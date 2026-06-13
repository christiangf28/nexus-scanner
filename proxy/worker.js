// Nexus Scanner — proxy de la Riot API (Cloudflare Worker).
// La API key vive en el secreto RIOT_API_KEY del Worker, nunca en el cliente:
//   npx wrangler secret put RIOT_API_KEY
//
// La página llama a  https://<worker>/<cluster>/<ruta-riot>  y este Worker
// reenvía a  https://<cluster>.api.riotgames.com/<ruta-riot>  agregando la key.

const ALLOWED_ORIGINS = [
  'https://christiangf28.github.io',
];

// Clusters regionales y plataformas que usa la app (ver REGIONS en lol-tracker.html)
const ALLOWED_HOSTS = new Set([
  'americas', 'europe', 'asia', 'sea',
  'la1', 'la2', 'na1', 'br1', 'euw1', 'eun1', 'kr', 'jp1', 'oc1', 'tr1',
]);

// Solo los endpoints que Nexus Scanner consume — nadie puede usar este proxy
// como key gratis para otra cosa.
const ALLOWED_PATHS = [
  '/riot/account/v1/accounts/',
  '/lol/summoner/v4/summoners/',
  '/lol/league/v4/entries/',
  '/lol/match/v5/matches/',
];

function isAllowedOrigin(origin) {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // 'null' = archivo abierto localmente (file://); localhost = desarrollo
  if (origin === 'null') return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Expose-Headers': 'Retry-After',
    'Vary': 'Origin',
  };
}

async function notifyDiscord(webhookUrl, title, description, color = 0xe74c3c) {
  if (!webhookUrl) return;
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title,
        description,
        color,
        timestamp: new Date().toISOString(),
      }],
    }),
  }).catch(() => {});
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (!isAllowedOrigin(origin)) {
      console.error(`[403] Origen bloqueado: "${origin}" | ${request.method} ${request.url}`);
      // Sin notificación: origin vacío = bot scanner, ruido constante sin valor
      return new Response('Forbidden', { status: 403 });
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'GET') {
      console.error(`[405] Método no permitido: ${request.method} | origin: ${origin}`);
      return new Response('Method not allowed', { status: 405, headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);
    const [, host, ...rest] = url.pathname.split('/');
    const path = '/' + rest.join('/');

    if (!ALLOWED_HOSTS.has(host) || !ALLOWED_PATHS.some(p => path.startsWith(p))) {
      console.error(`[403] Endpoint bloqueado: host="${host}" path="${path}" | origin: ${origin}`);
      // Sin notificación: casi siempre bots intentando usar el proxy para otra cosa
      return new Response('Endpoint no permitido', { status: 403, headers: corsHeaders(origin) });
    }

    let riotRes;
    try {
      riotRes = await fetch(`https://${host}.api.riotgames.com${path}${url.search}`, {
        headers: { 'X-Riot-Token': env.RIOT_API_KEY },
      });
    } catch (err) {
      console.error(`[fetch-error] No se pudo contactar Riot API | ${host}${path} | ${err.message}`);
      await notifyDiscord(env.DISCORD_WEBHOOK,
        '🔴 Riot API inalcanzable',
        `**Endpoint:** \`${host}${path}\`\n**Error:** ${err.message}`
      );
      return new Response('Error contacting Riot API', { status: 502, headers: corsHeaders(origin) });
    }

    if (!riotRes.ok) {
      const retryAfter = riotRes.headers.get('Retry-After');
      const detail = `**Endpoint:** \`${host}${path}${url.search}\`` +
        (retryAfter ? `\n**Retry-After:** ${retryAfter}s` : '') +
        `\n**Origin:** \`${origin}\``;

      console.error(
        `[riot-${riotRes.status}] ${host}${path}${url.search}` +
        (retryAfter ? ` | Retry-After: ${retryAfter}s` : '') +
        ` | origin: ${origin}`
      );

      // 429 es frecuente y esperado — avisa pero sin alarmar
      if (riotRes.status === 429) {
        await notifyDiscord(env.DISCORD_WEBHOOK,
          '⚠️ Rate limit (429)',
          detail,
          0xf39c12
        );
      } else if (riotRes.status >= 500) {
        await notifyDiscord(env.DISCORD_WEBHOOK,
          `🔴 Error Riot ${riotRes.status}`,
          detail
        );
      }
    }

    const headers = new Headers(corsHeaders(origin));
    headers.set('Content-Type', riotRes.headers.get('Content-Type') || 'application/json');
    const retryAfter = riotRes.headers.get('Retry-After');
    if (retryAfter) headers.set('Retry-After', retryAfter);
    return new Response(riotRes.body, { status: riotRes.status, headers });
  },
};
