# Farm Manager

One app for running a small goat, cow and chicken farm — on iPhone, Android and the web, from a single Expo (React Native) codebase.

- **Livestock** — individual animals or whole flocks, with status (healthy, sick, pregnant, sold, dead), breed, weight and a health log.
- **Money** — income and expenditure by category, bank and cash accounts with live balances.
- **Stock** — feed, medicine, equipment and produce, with days-left estimates from daily use.
- **Maintenance** — one-off and repeating upkeep tasks for sheds, tanks, pumps and vehicles.
- **Cameras** — the phone camera for photos, and farm CCTV over HLS, MJPEG or JPEG snapshots.
- **AI health check** — a photo goes to Claude's vision model, which reports visible signs of illness, likely conditions, what to do, and whether to call a vet. Saved to the animal's health log.
- **Reminders** — vaccinations due, feed running low, account balance under its minimum, maintenance due, sick animals. Shown on the dashboard and scheduled as 8 am phone notifications.

```
app/       Expo app (iOS, Android, web) — expo-router screens in src/app
server/    Node/Express API — records, dashboard summary, AI check
scripts/   stage-appsail.mjs: bundles the API + web build for Zoho Catalyst AppSail
prototype/ case study and screens for the portfolio
```

## Run it locally

```bash
cd server && npm install && npm run dev          # API on http://localhost:4600
node server/seed.mjs                             # optional: sample farm data
cd app && npm install && npx expo start           # press w for web, scan the QR with Expo Go for a phone
```

The phone app finds the API on the computer running Expo automatically (port 4600 on the same Wi-Fi). Change it under **Settings** (gear icon).

### AI health check

Put an Anthropic API key in `server/.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

The default model is `claude-opus-5` with server-side refusal fallbacks; override with `FARM_AI_MODEL`. The result is a screening aid, not a diagnosis, and the app says so on every result.

## Data storage

Without configuration the server keeps data in `server/data/db.json`. For the hosted app, set Zoho Catalyst Data Store credentials so data survives redeploys:

```
FARM_CATALYST_PROJECT_ID=...
FARM_CATALYST_CLIENT_ID=...
FARM_CATALYST_CLIENT_SECRET=...
FARM_CATALYST_REFRESH_TOKEN=...
FARM_CATALYST_ENV=Development
FARM_CATALYST_TABLE=farm_records     # columns: collection varchar(50), rec_id varchar(64), data text
FARM_ACCESS_KEY=choose-a-passphrase   # the app sends it as x-farm-key
```

## Deploy (web + API on Catalyst AppSail)

```bash
node scripts/stage-appsail.mjs
npx catalyst deploy --only appsail --project <project id>
```

## Phone apps

```bash
cd app
npx eas-cli@latest build --platform android   # .apk / .aab
npx eas-cli@latest build --platform ios       # needs an Apple developer account
```

## Cameras

Browsers and phone WebViews can't play RTSP. Use the camera or NVR's HLS (`.m3u8`), MJPEG or JPEG snapshot URL, or put a gateway such as go2rtc or MediaMTX in front of RTSP cameras. AI checks on CCTV need a snapshot URL that the server can reach.

## Tests

```bash
cd server && npm test     # reminder and dashboard logic
cd app && npx tsc --noEmit
```
