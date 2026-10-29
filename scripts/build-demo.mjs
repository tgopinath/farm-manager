/**
 * Builds the online demo into prototype/app for the portfolio.
 *
 *   node scripts/build-demo.mjs
 *
 * The demo keeps its sample farm in the browser (see app/src/lib/demo.ts), so
 * it needs no server and can sit on GitHub Pages at BASE. Static hosting has
 * no file for client-side routes, so each top-level screen also gets its own
 * copy of index.html (GitHub Pages serves /money from money.html), which lets
 * a reload or a shared link land on that screen.
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = process.env.DEMO_BASE ?? '/Portfolio/prototypes/farm/app'
const OUT = path.join(ROOT, 'prototype/app')
const ROUTES = ['animals', 'money', 'stock', 'cameras', 'vaccinations', 'settings', 'health-check']
// The sample animals with fixed ids in app/src/lib/demo.ts, so their links survive a reload too.
const SAMPLE_ANIMALS = ['raja', 'lakshmi', 'gauri']

const tmp = path.join(ROOT, 'app/dist-demo')
const r = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', 'dist-demo'], {
  cwd: path.join(ROOT, 'app'),
  stdio: 'inherit',
  env: { ...process.env, EXPO_PUBLIC_DEMO: '1', EXPO_BASE_URL: BASE },
})
if (r.status !== 0) process.exit(r.status ?? 1)

fs.rmSync(OUT, { recursive: true, force: true })
fs.renameSync(tmp, OUT)
const index = fs.readFileSync(path.join(OUT, 'index.html'))
for (const route of ROUTES) fs.writeFileSync(path.join(OUT, `${route}.html`), index)
fs.mkdirSync(path.join(OUT, 'animal'), { recursive: true })
for (const id of SAMPLE_ANIMALS) fs.writeFileSync(path.join(OUT, 'animal', `${id}.html`), index)
console.log(`[demo] built ${path.relative(ROOT, OUT)} for ${BASE}`)
