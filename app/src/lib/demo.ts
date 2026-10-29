/**
 * The demo build: the whole farm lives in this browser instead of on a server.
 *
 * Built with EXPO_PUBLIC_DEMO=1 for the portfolio, so anyone with the link can
 * click through a working app. It starts from a sample farm dated relative to
 * today, saves every change in localStorage, and works out the dashboard with
 * the server's own summary.js. The AI health check is the one thing it cannot
 * do, because that needs the server's API key; it says so rather than faking
 * a result.
 */
import type { Rec } from './api'
import { summary } from './summary'

const KEY = 'farm.demo.v1'
type DB = Record<string, Rec[]>

let db: DB | null = null
const memory: { saved?: string } = {}

const day = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

function seed(): DB {
  const now = new Date().toISOString()
  const r = (data: Record<string, any>): Rec => ({ ...data, id: uid(), createdAt: now, updatedAt: now })
  const sbi = r({ name: 'SBI savings', openingBalance: 42000, minBalance: 15000 })
  const cash = r({ name: 'Cash box', openingBalance: 3000, minBalance: 2000 })
  const lakshmi = r({ species: 'goat', name: 'Lakshmi', tag: 'G-014', breed: 'Boer', sex: 'female', status: 'pregnant', birthDate: '2024-03-10', weightKg: 38, count: 1 })
  const raja = r({ species: 'goat', name: 'Raja', tag: 'G-002', breed: 'Jamunapari', sex: 'male', status: 'sick', birthDate: '2023-01-05', weightKg: 52, count: 1, notes: 'Coughing since Monday' })
  const gauri = r({ species: 'cow', name: 'Gauri', tag: 'C-01', breed: 'Gir', sex: 'female', status: 'healthy', birthDate: '2021-07-01', weightKg: 380, count: 1 })
  const tx = (type: string, amount: number, category: string, d: number, accountId: string, species = '') =>
    r({ type, amount, category, date: day(d), accountId, species })
  return {
    accounts: [sbi, cash],
    animals: [
      lakshmi, raja, gauri,
      r({ species: 'goat', name: 'Kid group', breed: 'Mixed', sex: 'mixed', status: 'healthy', count: 9 }),
      r({ species: 'cow', name: 'Nandi', tag: 'C-02', breed: 'Sahiwal', sex: 'male', status: 'healthy', count: 1 }),
      r({ species: 'chicken', name: 'Layer flock A', breed: 'BV-380', sex: 'female', status: 'healthy', count: 120 }),
      r({ species: 'chicken', name: 'Country chickens', breed: 'Kadaknath', sex: 'mixed', status: 'healthy', count: 35 }),
    ],
    vaccinations: [
      r({ vaccine: 'PPR', species: 'goat', dueDate: day(-2) }),
      r({ vaccine: 'Lasota (ND)', species: 'chicken', dueDate: day(3) }),
      r({ vaccine: 'FMD', animalId: gauri.id, dueDate: day(20) }),
      r({ vaccine: 'ET', animalId: lakshmi.id, dueDate: day(-30), givenDate: day(-30) }),
    ],
    inventory: [
      r({ name: 'Layer mash', category: 'feed', quantity: 45, unit: 'kg', minLevel: 30, dailyUse: 14, unitCost: 32 }),
      r({ name: 'Green fodder', category: 'feed', quantity: 600, unit: 'kg', minLevel: 150, dailyUse: 45 }),
      r({ name: 'Goat pellets', category: 'feed', quantity: 120, unit: 'kg', minLevel: 40, dailyUse: 6, unitCost: 28 }),
      r({ name: 'Mineral mixture', category: 'medicine', quantity: 4, unit: 'kg', minLevel: 2 }),
      r({ name: 'Eggs in store', category: 'produce', quantity: 180, unit: 'pcs' }),
    ],
    maintenance: [
      r({ title: 'Clean water tank', asset: 'Main tank', everyDays: 30, lastDone: day(-27) }),
      r({ title: 'Service borewell pump', asset: 'Pump', dueDate: day(-1), cost: 1500 }),
      r({ title: 'Lime wash poultry shed', asset: 'Shed B', everyDays: 90, lastDone: day(-40) }),
    ],
    transactions: [
      tx('income', 9600, 'Eggs', -3, sbi.id, 'chicken'), tx('income', 14200, 'Milk', -5, sbi.id, 'cow'),
      tx('income', 18000, 'Animal sale', -12, sbi.id, 'goat'), tx('expense', 22400, 'Feed', -8, sbi.id),
      tx('expense', 1800, 'Vet', -2, cash.id, 'goat'), tx('expense', 12000, 'Labour', -1, sbi.id),
      tx('expense', 2300, 'Electricity', -6, sbi.id), tx('expense', 900, 'Medicine', -4, cash.id),
      tx('expense', 14500, 'Feed', -35, sbi.id), tx('income', 15800, 'Milk', -36, sbi.id, 'cow'),
    ],
    health: [r({ animalId: raja.id, date: day(-2), kind: 'vet', summary: 'Vet visit: mild respiratory infection. Oxytetracycline for 5 days.', cost: 600 })],
    cameras: [r({ name: 'Goat shed', kind: 'hls', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', location: 'Shed A (demo stream)' })],
  }
}

function read(): string | undefined {
  try { return globalThis.localStorage?.getItem(KEY) ?? memory.saved } catch { return memory.saved }
}

function write() {
  const text = JSON.stringify(db)
  memory.saved = text
  try { globalThis.localStorage?.setItem(KEY, text) } catch {}
}

function load(): DB {
  if (db) return db
  try { db = JSON.parse(read() ?? '') } catch { db = null }
  if (!db) { db = seed(); write() }
  return db
}

const rows = (c: string) => (load()[c] ??= [])
const tick = () => new Promise((r) => setTimeout(r, 120)) // feels like a network call

export const demo = {
  async list(c: string) { await tick(); return [...rows(c)] },
  async create(c: string, data: object) {
    await tick()
    const now = new Date().toISOString()
    const rec: Rec = { ...data, id: uid(), createdAt: now, updatedAt: now }
    rows(c).push(rec); write(); return rec
  },
  async update(c: string, id: string, data: object) {
    await tick()
    const list = rows(c)
    const i = list.findIndex((r) => r.id === id)
    if (i < 0) throw new Error('Not found')
    list[i] = { ...list[i], ...data, id, updatedAt: new Date().toISOString() }
    write(); return list[i]
  },
  async remove(c: string, id: string) {
    await tick()
    load()[c] = rows(c).filter((r) => r.id !== id); write()
  },
  async summary() { await tick(); return summary(load()) },
  reset() { db = seed(); write() },
}

export const NO_AI = 'The AI health check needs the farm server and its API key, so it is switched off in this online demo. Everything else works and saves in your browser.'
