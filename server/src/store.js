/**
 * Where farm records live.
 *
 * Every record is a JSON document in a named collection (animals,
 * transactions, ...). The whole farm is small — thousands of rows, not
 * millions — so the server keeps all of it in memory and writes each change
 * through to durable storage:
 *
 *   • Zoho Catalyst Data Store, when FARM_CATALYST_* is configured. One table,
 *     `farm_records`, with columns collection / rec_id / data. This is what the
 *     hosted app uses, because AppSail wipes its disk on every redeploy.
 *   • A JSON file in server/data/ otherwise, for local development.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import * as catalyst from './catalyst.js'

export const COLLECTIONS = [
  'animals',       // individual animals or flocks/herds
  'health',        // health log entries, incl. AI checks
  'vaccinations',  // scheduled and given doses
  'transactions',  // income and expenditure
  'accounts',      // bank / cash accounts with a minimum balance
  'inventory',     // feed, medicine, equipment, produce
  'maintenance',   // upkeep tasks for sheds, pumps, fences, vehicles
  'cameras',       // CCTV / IP camera stream URLs
]

const DATA_DIR = process.env.FARM_DATA_DIR ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data')
const FILE = path.join(DATA_DIR, 'db.json')

/** collection -> Map(id -> record) */
const db = new Map(COLLECTIONS.map((c) => [c, new Map()]))
/** Catalyst ROWID per `${collection}/${id}`, so updates hit the same row. */
const rowIds = new Map()

export const backend = () => (catalyst.ready() ? 'catalyst' : 'file')

export async function load() {
  if (catalyst.ready()) {
    for (const row of await catalyst.allRows()) {
      const items = db.get(row.collection)
      if (!items) continue
      try {
        items.set(row.rec_id, JSON.parse(row.data))
        rowIds.set(`${row.collection}/${row.rec_id}`, row.ROWID)
      } catch {
        console.warn(`[store] skipping unreadable row ${row.ROWID}`)
      }
    }
    return
  }
  try {
    const saved = JSON.parse(fs.readFileSync(FILE, 'utf8'))
    for (const c of COLLECTIONS) for (const r of saved[c] ?? []) db.get(c).set(r.id, r)
  } catch {
    // First run: start empty.
  }
}

let timer = null
function saveFile() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    const out = Object.fromEntries(COLLECTIONS.map((c) => [c, [...db.get(c).values()]]))
    fs.writeFileSync(FILE, JSON.stringify(out, null, 2))
  }, 50)
}

async function persist(collection, record, removed = false) {
  if (!catalyst.ready()) return saveFile()
  const key = `${collection}/${record.id}`
  const rowId = rowIds.get(key)
  if (removed) {
    if (rowId) await catalyst.deleteRow(rowId)
    rowIds.delete(key)
  } else if (rowId) {
    await catalyst.updateRow(rowId, JSON.stringify(record))
  } else {
    rowIds.set(key, await catalyst.insertRow(collection, record.id, JSON.stringify(record)))
  }
}

export const has = (collection) => db.has(collection)
export const list = (collection) => [...db.get(collection).values()]
export const get = (collection, id) => db.get(collection).get(id) ?? null

export async function create(collection, data) {
  const now = new Date().toISOString()
  const record = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
  db.get(collection).set(record.id, record)
  await persist(collection, record)
  return record
}

export async function update(collection, id, patch) {
  const current = get(collection, id)
  if (!current) return null
  const record = { ...current, ...patch, id, createdAt: current.createdAt, updatedAt: new Date().toISOString() }
  db.get(collection).set(id, record)
  await persist(collection, record)
  return record
}

export async function remove(collection, id) {
  const current = get(collection, id)
  if (!current) return false
  db.get(collection).delete(id)
  await persist(collection, current, true)
  return true
}
