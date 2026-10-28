/**
 * Assembles appsail/ — the API plus the built web app — for
 * `catalyst deploy --only appsail`.
 *
 *   node scripts/stage-appsail.mjs
 *
 * One AppSail app serves both: /api/* is the server, everything else is the
 * web build. The phone apps point at the same URL from their Settings screen.
 *
 * Environment variables come from server/.env and are written into
 * appsail/app-config.json, which is git-ignored. Only the keys listed in
 * SHIP are copied, so nothing else from the local .env leaves the machine.
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'appsail')
const SHIP = [
  'ANTHROPIC_API_KEY', 'FARM_AI_MODEL', 'FARM_ACCESS_KEY', 'ZOHO_DC',
  'FARM_CATALYST_PROJECT_ID', 'FARM_CATALYST_ENV', 'FARM_CATALYST_TABLE',
  'FARM_CATALYST_CLIENT_ID', 'FARM_CATALYST_CLIENT_SECRET', 'FARM_CATALYST_REFRESH_TOKEN',
]

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit' })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

function readEnv(file) {
  if (!fs.existsSync(file)) return {}
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8').split('\n')
      .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/))
      .filter(Boolean)
      .map(([, k, v]) => [k, v.replace(/^['"]|['"]$/g, '')]),
  )
}

console.log('[appsail] building the web app')
run('npx', ['expo', 'export', '--platform', 'web'], path.join(ROOT, 'app'))

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })
fs.cpSync(path.join(ROOT, 'server/src'), path.join(OUT, 'src'), { recursive: true })
fs.cpSync(path.join(ROOT, 'app/dist'), path.join(OUT, 'web'), { recursive: true })
fs.copyFileSync(path.join(ROOT, 'server/package.json'), path.join(OUT, 'package.json'))
fs.copyFileSync(path.join(ROOT, 'server/package-lock.json'), path.join(OUT, 'package-lock.json'))

console.log('[appsail] installing production dependencies')
run('npm', ['ci', '--omit=dev'], OUT)

const env = readEnv(path.join(ROOT, 'server/.env'))
const shipped = Object.fromEntries(SHIP.filter((k) => env[k]).map((k) => [k, env[k]]))
fs.writeFileSync(path.join(OUT, 'app-config.json'), JSON.stringify({
  command: 'npm start',
  build_path: '.',
  stack: 'node22',
  memory: 256,
  env_variables: { ...shipped, FARM_WEB_DIR: './web', NODE_ENV: 'production' },
}, null, 2))

console.log(`[appsail] staged ${OUT} with env: ${Object.keys(shipped).join(', ') || '(none)'}`)
if (!shipped.FARM_CATALYST_REFRESH_TOKEN) console.warn('[appsail] warning: no FARM_CATALYST_* set — the hosted app would keep data on a disk that redeploys wipe')
