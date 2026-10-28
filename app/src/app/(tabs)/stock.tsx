import { useState } from 'react'
import { Alert, Platform, View } from 'react-native'
import { router } from 'expo-router'
import { Button, Card, Chip, Empty, ErrorBox, Row, Screen, T } from '../../components/ui'
import { useCollection } from '../../lib/hooks'
import { api, Rec } from '../../lib/api'
import { money, today, useTheme } from '../../lib/theme'

const DAY = 86400000

function nextDue(t: Rec): string | null {
  if (t.dueDate) return t.dueDate
  if (t.lastDone && Number(t.everyDays) > 0) {
    return new Date(Date.parse(t.lastDone) + Number(t.everyDays) * DAY).toISOString().slice(0, 10)
  }
  return null
}

const edit = (collection: string, id?: string) =>
  router.push({ pathname: '/edit/[collection]', params: id ? { collection, id } : { collection } })

/** Ask for a number. Alert.prompt only exists on iOS, so other platforms open the edit form. */
function askNumber(title: string, onValue: (n: number) => void, fallback: () => void) {
  if (Platform.OS === 'ios') {
    Alert.prompt(title, undefined, (v) => { const n = Number(v); if (Number.isFinite(n) && n > 0) onValue(n) }, 'plain-text', '', 'decimal-pad')
  } else if (Platform.OS === 'web') {
    const n = Number(window.prompt(title) ?? '')
    if (Number.isFinite(n) && n > 0) onValue(n)
  } else fallback()
}

export default function Stock() {
  const t = useTheme()
  const [tab, setTab] = useState<'inventory' | 'maintenance'>('inventory')
  const inv = useCollection('inventory')
  const tasks = useCollection('maintenance')

  async function adjust(item: Rec, delta: number) {
    await api.update('inventory', item.id, { quantity: Math.max(0, (Number(item.quantity) || 0) + delta) })
    inv.refresh()
  }

  async function markDone(task: Rec) {
    const patch: Rec = { id: task.id, lastDone: today() }
    if (!Number(task.everyDays)) patch.dueDate = ''
    await api.update('maintenance', task.id, patch)
    tasks.refresh()
  }

  return (
    <Screen refreshing={inv.loading || tasks.loading} onRefresh={() => { inv.refresh(); tasks.refresh() }}>
      {inv.error ? <ErrorBox message={inv.error} onRetry={inv.refresh} /> : null}
      <Row style={{ marginBottom: 12 }}>
        <Chip label="Feed & farm goods" active={tab === 'inventory'} onPress={() => setTab('inventory')} />
        <Chip label="Maintenance" active={tab === 'maintenance'} onPress={() => setTab('maintenance')} />
      </Row>

      {tab === 'inventory' ? (
        <>
          <Button title="+ Add stock item" onPress={() => edit('inventory')} />
          <View style={{ height: 12 }} />
          {!inv.loading && inv.data.length === 0 ? (
            <Empty title="No stock recorded" detail="Add feed with how much you use per day, and you'll be reminded before it runs out." />
          ) : null}
          {[...inv.data].sort((a, b) => String(a.category).localeCompare(String(b.category))).map((item) => {
            const qty = Number(item.quantity) || 0
            const daily = Number(item.dailyUse) || 0
            const daysLeft = daily > 0 ? Math.floor(qty / daily) : null
            const low = qty <= (Number(item.minLevel) || 0) || (daysLeft !== null && daysLeft <= 5)
            const pct = item.minLevel ? Math.min(1, qty / (Number(item.minLevel) * 3)) : null
            return (
              <Card key={item.id} onPress={() => edit('inventory', item.id)}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <T bold>{item.name}</T>
                    <T muted size={12}>{item.category}{item.unitCost ? ` · ${money(Number(item.unitCost))}/${item.unit}` : ''}</T>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <T bold size={18} color={low ? t.danger : t.text}>{qty} {item.unit}</T>
                    {daysLeft !== null ? <T size={12} color={low ? t.danger : t.muted}>≈ {daysLeft} day(s) left</T> : null}
                  </View>
                </Row>
                {pct !== null ? (
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: t.border, marginTop: 8, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.round(pct * 100)}%`, height: 6, backgroundColor: low ? t.danger : t.primary }} />
                  </View>
                ) : null}
                <Row style={{ marginTop: 10 }}>
                  <Button small kind="ghost" title={`− Used`} onPress={() => askNumber(`How much ${item.name} was used? (${item.unit})`, (n) => adjust(item, -n), () => edit('inventory', item.id))} />
                  <Button small kind="ghost" title={`+ Restocked`} onPress={() => askNumber(`How much ${item.name} was added? (${item.unit})`, (n) => adjust(item, n), () => edit('inventory', item.id))} />
                </Row>
              </Card>
            )
          })}
        </>
      ) : (
        <>
          <Button title="+ Add maintenance task" onPress={() => edit('maintenance')} />
          <View style={{ height: 12 }} />
          {!tasks.loading && tasks.data.length === 0 ? (
            <Empty title="No maintenance tasks" detail="Track shed cleaning, water tanks, pumps, fencing and vehicle servicing." />
          ) : null}
          {tasks.data
            .map((task) => ({ task, due: nextDue(task) }))
            .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))
            .map(({ task, due }) => {
              const overdue = due !== null && due < today()
              return (
                <Card key={task.id} onPress={() => edit('maintenance', task.id)}>
                  <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                    <View style={{ flex: 1 }}>
                      <T bold>{task.title}</T>
                      <T muted size={13}>
                        {[task.asset, Number(task.everyDays) ? `every ${task.everyDays} days` : 'one-off', task.lastDone && `last done ${task.lastDone}`].filter(Boolean).join(' · ')}
                      </T>
                      {due ? <T size={13} bold color={overdue ? t.danger : t.primary}>{overdue ? 'Overdue since' : 'Next due'} {due}</T> : null}
                    </View>
                    <Button small title="Done ✓" onPress={() => markDone(task)} />
                  </Row>
                </Card>
              )
            })}
        </>
      )}
    </Screen>
  )
}
