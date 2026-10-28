/**
 * The dashboard numbers and the reminder list, worked out from the records.
 *
 * Pure functions of the data and a "today", so they can be tested without a
 * server and so the app's notifications agree with what the dashboard shows.
 */
const DAY = 86400000
const dayOf = (iso) => String(iso ?? '').slice(0, 10)
const daysBetween = (from, to) => Math.round((Date.parse(dayOf(to)) - Date.parse(dayOf(from))) / DAY)
const inr = (n) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

/** Upcoming window for vaccinations and maintenance. */
const SOON_DAYS = 7
/** Warn when feed will run out within this many days at the current rate. */
const FEED_DAYS = 5

export function accountBalances(accounts, transactions) {
  return accounts.map((a) => {
    let balance = num(a.openingBalance)
    for (const t of transactions) {
      if (t.accountId !== a.id) continue
      balance += t.type === 'income' ? num(t.amount) : -num(t.amount)
    }
    return { id: a.id, name: a.name, balance, minBalance: num(a.minBalance) }
  })
}

export function stockLevel(item) {
  const quantity = num(item.quantity)
  const daily = num(item.dailyUse)
  const daysLeft = daily > 0 ? Math.floor(quantity / daily) : null
  const low = quantity <= num(item.minLevel) || (daysLeft !== null && daysLeft <= FEED_DAYS)
  return { quantity, daysLeft, low }
}

/** The next date a recurring maintenance task is due. */
export function maintenanceDue(task) {
  if (task.dueDate) return dayOf(task.dueDate)
  if (task.lastDone && num(task.everyDays) > 0) {
    return new Date(Date.parse(dayOf(task.lastDone)) + num(task.everyDays) * DAY).toISOString().slice(0, 10)
  }
  return null
}

export function reminders(data, today = new Date().toISOString()) {
  const out = []
  const animals = new Map(data.animals.map((a) => [a.id, a]))
  const label = (v) => {
    const a = animals.get(v.animalId)
    if (a) return a.name || a.tag || a.species
    return v.species ? `all ${v.species}s` : 'animals'
  }

  for (const v of data.vaccinations) {
    if (v.givenDate || !v.dueDate) continue
    const d = daysBetween(today, v.dueDate)
    if (d > SOON_DAYS) continue
    out.push({
      kind: 'vaccination',
      level: d < 0 ? 'overdue' : 'due',
      title: `${v.vaccine} for ${label(v)}`,
      detail: d < 0 ? `${-d} day(s) overdue` : d === 0 ? 'Due today' : `Due in ${d} day(s)`,
      date: dayOf(v.dueDate),
      ref: { collection: 'vaccinations', id: v.id },
    })
  }

  for (const item of data.inventory) {
    const s = stockLevel(item)
    if (!s.low) continue
    out.push({
      kind: item.category === 'feed' ? 'feed' : 'stock',
      level: s.quantity <= 0 || s.daysLeft === 0 ? 'overdue' : 'warning',
      title: `${item.name} is running low`,
      detail: `${s.quantity} ${item.unit ?? ''} left${s.daysLeft !== null ? ` · about ${s.daysLeft} day(s) at current use` : ''}`.trim(),
      date: dayOf(today),
      ref: { collection: 'inventory', id: item.id },
    })
  }

  for (const b of accountBalances(data.accounts, data.transactions)) {
    if (b.balance >= b.minBalance) continue
    out.push({
      kind: 'balance',
      level: b.balance < 0 ? 'overdue' : 'warning',
      title: `${b.name} balance is below the minimum`,
      detail: `Balance ${inr(b.balance)} · minimum ${inr(b.minBalance)}`,
      date: dayOf(today),
      ref: { collection: 'accounts', id: b.id },
    })
  }

  for (const t of data.maintenance) {
    const due = maintenanceDue(t)
    if (!due) continue
    const d = daysBetween(today, due)
    if (d > SOON_DAYS) continue
    out.push({
      kind: 'maintenance',
      level: d < 0 ? 'overdue' : 'due',
      title: t.title,
      detail: d < 0 ? `${-d} day(s) overdue` : d === 0 ? 'Due today' : `Due in ${d} day(s)`,
      date: due,
      ref: { collection: 'maintenance', id: t.id },
    })
  }

  for (const a of data.animals) {
    if (a.status !== 'sick') continue
    out.push({
      kind: 'health',
      level: 'warning',
      title: `${a.name || a.tag || a.species} is marked sick`,
      detail: 'Check on treatment and update the health log',
      date: dayOf(today),
      ref: { collection: 'animals', id: a.id },
    })
  }

  const rank = { overdue: 0, warning: 1, due: 2 }
  return out.sort((x, y) => rank[x.level] - rank[y.level] || x.date.localeCompare(y.date))
}

export function summary(data, today = new Date().toISOString()) {
  const month = dayOf(today).slice(0, 7)
  const livestock = {}
  for (const a of data.animals) {
    if (a.status === 'sold' || a.status === 'dead') continue
    const s = (livestock[a.species] ??= { head: 0, sick: 0 })
    const n = Math.max(1, num(a.count) || 1)
    s.head += n
    if (a.status === 'sick') s.sick += n
  }
  let income = 0
  let expense = 0
  const byCategory = {}
  for (const t of data.transactions) {
    if (dayOf(t.date).slice(0, 7) !== month) continue
    const amt = num(t.amount)
    if (t.type === 'income') income += amt
    else {
      expense += amt
      byCategory[t.category || 'Other'] = (byCategory[t.category || 'Other'] ?? 0) + amt
    }
  }
  const balances = accountBalances(data.accounts, data.transactions)
  return {
    today: dayOf(today),
    livestock,
    month: { month, income, expense, net: income - expense, expenseByCategory: byCategory },
    balances,
    totalBalance: balances.reduce((s, b) => s + b.balance, 0),
    reminders: reminders(data, today),
  }
}
