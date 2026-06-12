# Nexus Scanner

> [🇬🇧 English](#english) · [🇪🇸 Español](#español)

---

## English

**Nexus Scanner** is a personal performance analysis tool for League of Legends. It fetches your match history via the Riot Games API and breaks down your gameplay across six weighted dimensions — KDA, Farm, Vision, Damage, Survival, and Kill Participation — calibrated by role and rank, so you know exactly what to work on.

🔗 **Live demo:** https://christiangf28.github.io/nexus-scanner/

![Nexus Scanner — main view](final_dark.png)

### Features

- **Role-aware scoring** — each dimension is weighted differently for Support, Jungle, Top, Mid, and Bot
- **Rank-calibrated thresholds** — expectations scale from Iron to Challenger so your score is always contextual
- **El Erudito** — a sarcastic but honest advisor that pinpoints your biggest bottleneck and gives concrete tips
- **Multi-mode tracking** — Solo Queue, Flex, ARAM, Arena, and unranked modes in one place
- **Player comparison** — add multiple players side by side with a radar chart and full stat breakdown
- **12-week / 1-year history** — track your improvement over time with a score sparkline
- **Chemistry tab** — see rank distribution of your most frequent teammates
- **Dark / light mode** — full cyberpunk dark theme and a clean steel-blue light theme
- **No setup required** — the live demo works out of the box; optionally bring your own Riot API key

![Analysis tab](screen_analysis.png)
![Comparison mode](screen_comp.png)

### How to use

1. Open the [live demo](https://christiangf28.github.io/nexus-scanner/) — no key, no account, no install
2. Select your region and search for a player by Riot ID (`Name#TAG`)
3. Optional: paste your own [Riot Developer API key](https://developer.riotgames.com/) to use your personal rate limits instead of the shared access

### Architecture

Single-file HTML application — all CSS and JavaScript are bundled in one `lol-tracker.html` file. This is an intentional design choice: zero dependencies, no build step, fully portable. Open it locally or deploy it to any static host as-is.

API requests are routed through a minimal Cloudflare Worker ([`proxy/worker.js`](proxy/worker.js)) that holds the Riot API key as a server-side secret — the key is never exposed in client code. The proxy only accepts requests from this app's origin and only forwards to the four endpoints listed below. If the user provides their own key, the app calls the Riot API directly instead.

**APIs used:** `account/v1` · `summoner/v4` · `league/v4` · `match/v5`

**Stack:** Vanilla JS · Canvas API · CSS custom properties · localStorage · Cloudflare Workers

### Disclaimer

Nexus Scanner was created under Riot Games' "Legal Jibber Jabber" policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project.

---

## Español

**Nexus Scanner** es una herramienta de análisis de rendimiento personal para League of Legends. Obtiene tu historial de partidas a través de la API de Riot Games y desglosa tu juego en seis dimensiones ponderadas — KDA, Farm, Visión, Daño, Supervivencia y Participación en Kills — calibradas por rol y elo, para que sepas exactamente qué mejorar.

🔗 **Demo en vivo:** https://christiangf28.github.io/nexus-scanner/

### Funciones

- **Score por rol** — cada dimensión tiene un peso distinto según tu posición (Support, Jungle, Top, Mid, Bot)
- **Umbrales por elo** — las expectativas escalan de Hierro a Challenger para que el score siempre tenga contexto
- **El Erudito** — un consejero sarcástico pero honesto que identifica tu mayor cuello de botella y da consejos concretos
- **Múltiples modos** — Solo Queue, Flex, ARAM, Arena y normales en un solo lugar
- **Comparativa de jugadores** — añade varios jugadores con radar chart y tabla de stats completa
- **Historial de 12 semanas / 1 año** — sigue tu evolución con un gráfico de progreso
- **Tab Química** — distribución de rangos de tus compañeros más frecuentes
- **Modo claro / oscuro** — tema oscuro cyberpunk y tema claro azul acero
- **Sin configuración** — la demo funciona de inmediato; opcionalmente puedes usar tu propia Riot API key

### Cómo usar

1. Abre la [demo en vivo](https://christiangf28.github.io/nexus-scanner/) — sin key, sin cuenta, sin instalación
2. Selecciona tu región y busca un jugador por Riot ID (`Nombre#TAG`)
3. Opcional: pega tu propia [API key de Riot Developer](https://developer.riotgames.com/) para usar tus límites personales en vez del acceso compartido

### Arquitectura

Aplicación HTML de un solo archivo — todo el CSS y JavaScript están en `lol-tracker.html`. Es una decisión de diseño intencional: cero dependencias, sin build, totalmente portable. Ábrelo localmente o súbelo a cualquier host estático tal cual.

Las llamadas a la API pasan por un Cloudflare Worker mínimo ([`proxy/worker.js`](proxy/worker.js)) que guarda la API key de Riot como secreto del lado del servidor — la key nunca se expone en el código cliente. El proxy solo acepta requests desde el origen de esta app y solo reenvía a los cuatro endpoints listados abajo. Si el usuario ingresa su propia key, la app llama a la API de Riot directamente.

**APIs utilizadas:** `account/v1` · `summoner/v4` · `league/v4` · `match/v5`

**Stack:** Vanilla JS · Canvas API · CSS custom properties · localStorage · Cloudflare Workers

### Aviso legal

Nexus Scanner fue creado bajo la política "Legal Jibber Jabber" de Riot Games usando activos de su propiedad. Riot Games no respalda ni patrocina este proyecto.
