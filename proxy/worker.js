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

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (!isAllowedOrigin(origin)) {
      return new Response('Forbidden', { status: 403 });
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);
    const [, host, ...rest] = url.pathname.split('/');
    const path = '/' + rest.join('/');
    if (!ALLOWED_HOSTS.has(host) || !ALLOWED_PATHS.some(p => path.startsWith(p))) {
      return new Response('Endpoint no permitido', { status: 403, headers: corsHeaders(origin) });
    }

    const riotRes = await fetch(`https://${host}.api.riotgames.com${path}${url.search}`, {
      headers: { 'X-Riot-Token': env.RIOT_API_KEY },
    });

    const headers = new Headers(corsHeaders(origin));
    headers.set('Content-Type', riotRes.headers.get('Content-Type') || 'application/json');
    const retryAfter = riotRes.headers.get('Retry-After');
    if (retryAfter) headers.set('Retry-After', retryAfter);
    return new Response(riotRes.body, { status: riotRes.status, headers });
  },
};
