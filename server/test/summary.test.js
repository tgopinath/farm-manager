import { test } from 'node:test'
import assert from 'node:assert/strict'
import { summary, stockLevel, maintenanceDue } from '../src/summary.js'

const today = '2026-10-28'
const data = {
  animals: [
    { id: 'a1', species: 'goat', name: 'Lakshmi', status: 'healthy' },
    { id: 'a2', species: 'goat', name: 'Raja', status: 'sick' },
    { id: 'a3', species: 'chicken', name: 'Layer flock A', count: 120, status: 'healthy' },
    { id: 'a4', species: 'cow', name: 'Gauri', status: 'sold' },
  ],
  vaccinations: [
    { id: 'v1', animalId: 'a1', vaccine: 'PPR', dueDate: '2026-10-26' },
    { id: 'v2', species: 'chicken', vaccine: 'Lasota', dueDate: '2026-10-31' },
    { id: 'v3', species: 'cow', vaccine: 'FMD', dueDate: '2026-12-01' },
    { id: 'v4', animalId: 'a1', vaccine: 'ET', dueDate: '2026-10-20', givenDate: '2026-10-20' },
  ],
  inventory: [
    { id: 'i1', name: 'Layer mash', category: 'feed', quantity: 40, unit: 'kg', minLevel: 20, dailyUse: 12 },
    { id: 'i2', name: 'Green fodder', category: 'feed', quantity: 500, unit: 'kg', minLevel: 100, dailyUse: 30 },
  ],
  accounts: [{ id: 'b1', name: 'SBI', openingBalance: 10000, minBalance: 5000 }],
  transactions: [
    { id: 't1', type: 'income', amount: 2000, accountId: 'b1', date: '2026-10-05', category: 'Eggs' },
    { id: 't2', type: 'expense', amount: 8000, accountId: 'b1', date: '2026-10-10', category: 'Feed' },
    { id: 't3', type: 'expense', amount: 500, accountId: 'b1', date: '2026-09-10', category: 'Vet' },
  ],
  maintenance: [{ id: 'm1', title: 'Clean water tank', lastDone: '2026-10-01', everyDays: 30 }],
}

test('livestock counts skip sold animals and expand flocks', () => {
  const s = summary(data, today)
  assert.deepEqual(s.livestock, { goat: { head: 2, sick: 1 }, chicken: { head: 120, sick: 0 } })
})

test('month totals and balances', () => {
  const s = summary(data, today)
  assert.equal(s.month.income, 2000)
  assert.equal(s.month.expense, 8000)
  assert.equal(s.balances[0].balance, 3500)
})

test('reminders cover vaccination, feed, balance, maintenance, health', () => {
  const kinds = summary(data, today).reminders.map((r) => `${r.kind}:${r.level}`)
  assert.ok(kinds.includes('vaccination:overdue'))
  assert.ok(kinds.includes('vaccination:due'))
  assert.ok(kinds.includes('feed:warning'))
  assert.ok(kinds.includes('balance:warning'))
  assert.ok(kinds.includes('maintenance:due'))
  assert.ok(kinds.includes('health:warning'))
  assert.equal(kinds.filter((k) => k.startsWith('vaccination')).length, 2)
  assert.equal(kinds.filter((k) => k.startsWith('feed')).length, 1)
})

test('stock and maintenance helpers', () => {
  assert.deepEqual(stockLevel(data.inventory[0]), { quantity: 40, daysLeft: 3, low: true })
  assert.equal(maintenanceDue(data.maintenance[0]), '2026-10-31')
})

test('the app carries an identical copy of summary.js for the demo build', async () => {
  const fs = await import('node:fs')
  assert.equal(
    fs.readFileSync(new URL('../../app/src/lib/summary.js', import.meta.url), 'utf8'),
    fs.readFileSync(new URL('../src/summary.js', import.meta.url), 'utf8'),
  )
})
