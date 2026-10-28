/**
 * Farm Manager API.
 *
 *   GET    /api/status                      liveness + which storage is in use
 *   GET    /api/summary                     dashboard numbers and reminders
 *   GET    /api/:collection                 list
 *   POST   /api/:collection                 create
 *   PUT    /api/:collection/:id             update (merge)
 *   DELETE /api/:collection/:id             delete
 *   POST   /api/diagnose                    AI health check of a photo
 *
 * When FARM_ACCESS_KEY is set, every /api call must send it in the
 * `x-farm-key` header. The app asks for it once on its Settings screen.
 *
 * The built web app (app/dist) is served from `/` when present, so one
 * hosted URL is both the API and the web version of the app.
 */
import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as store from './store.js'
import { summary } from './summary.js'
import { diagnose, aiReady } from './diagnose.js'

const app = express()
const PORT = Number(process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 4600)
const KEY = (process.env.FARM_ACCESS_KEY ?? '').trim()

app.use(cors())
app.use(express.json({ limit: '15mb' }))

app.get('/api/status', (_req, res) => res.json({ ok: true, storage: store.backend(), ai: aiReady(), locked: !!KEY }))

app.use('/api', (req, res, next) => {
  if (!KEY || req.get('x-farm-key') === KEY) return next()
  res.status(401).json({ error: 'Wrong or missing farm access key' })
})

const all = () => Object.fromEntries(store.COLLECTIONS.map((c) => [c, store.list(c)]))

app.get('/api/summary', (req, res) => {
  res.json(summary(all(), req.query.today ? String(req.query.today) : undefined))
})

app.post('/api/diagnose', async (req, res) => {
  const { imageBase64, mediaType, species, notes, animalId } = req.body ?? {}
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' })
  if (!aiReady()) return res.status(503).json({ error: 'AI health check is not set up on the server (ANTHROPIC_API_KEY)' })
  try {
    const result = await diagnose({ imageBase64: String(imageBase64).replace(/^data:[^,]+,/, ''), mediaType, species, notes })
    let entry = null
    if (animalId && store.get('animals', animalId)) {
      entry = await store.create('health', {
        animalId,
        date: new Date().toISOString().slice(0, 10),
        kind: 'ai',
        summary: result.summary,
        status: result.status,
        details: result,
      })
      if (result.status === 'likely_sick' || result.status === 'urgent') {
        await store.update('animals', animalId, { status: 'sick' })
      }
    }
    res.json({ result, entry })
  } catch (err) {
    console.error('[diagnose]', err)
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

/** AI check on a CCTV snapshot. The server must be able to reach the camera. */
app.post('/api/cameras/:id/check', async (req, res) => {
  const cam = store.get('cameras', req.params.id)
  if (!cam) return res.status(404).json({ error: 'Camera not found' })
  if (!aiReady()) return res.status(503).json({ error: 'AI health check is not set up on the server (ANTHROPIC_API_KEY)' })
  try {
    const shot = await fetch(cam.url, { signal: AbortSignal.timeout(10000) })
    const type = shot.headers.get('content-type') ?? ''
    if (!shot.ok || !type.startsWith('image/')) throw Object.assign(new Error(`The camera did not return a picture (${shot.status} ${type || 'no type'})`), { status: 502 })
    const imageBase64 = Buffer.from(await shot.arrayBuffer()).toString('base64')
    res.json({ result: await diagnose({ imageBase64, mediaType: type.split(';')[0], notes: `CCTV snapshot from "${cam.name}"` }) })
  } catch (err) {
    const unreachable = err.name === 'TimeoutError' || err.cause?.code
    res.status(err.status ?? 502).json({ error: unreachable ? `The server could not reach ${cam.name}. A camera on your farm network is only reachable from a server on the same network.` : err.message })
  }
})

function collection(req, res, next) {
  if (!store.has(req.params.collection)) return res.status(404).json({ error: `Unknown collection ${req.params.collection}` })
  next()
}

/** Fields the server owns. */
const clean = ({ id, createdAt, updatedAt, ...rest } = {}) => rest

app.get('/api/:collection', collection, (req, res) => res.json(store.list(req.params.collection)))

app.post('/api/:collection', collection, async (req, res, next) => {
  try { res.status(201).json(await store.create(req.params.collection, clean(req.body))) } catch (e) { next(e) }
})

app.put('/api/:collection/:id', collection, async (req, res, next) => {
  try {
    const r = await store.update(req.params.collection, req.params.id, clean(req.body))
    r ? res.json(r) : res.status(404).json({ error: 'Not found' })
  } catch (e) { next(e) }
})

app.delete('/api/:collection/:id', collection, async (req, res, next) => {
  try {
    (await store.remove(req.params.collection, req.params.id)) ? res.status(204).end() : res.status(404).json({ error: 'Not found' })
  } catch (e) { next(e) }
})

const WEB = process.env.FARM_WEB_DIR ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../app/dist')
if (fs.existsSync(WEB)) {
  app.use(express.static(WEB))
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(WEB, 'index.html')))
}

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: err.message })
})

await store.load()
app.listen(PORT, () => console.log(`[farm] API on http://localhost:${PORT} · storage=${store.backend()} · ai=${aiReady()}`))
