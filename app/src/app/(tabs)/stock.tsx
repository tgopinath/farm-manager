import { useState } from 'react'
import { Alert, Platform, View } from 'react-native'
import { router } from 'expo-router'
import { Badge, Button, Card, Chip, Empty, ErrorBox, Fab, IconButton, IconTile, List, ListRow, Meter, Row, Screen, T, useToast, type IconName, type Tone } from '../../components/ui'
import { useCollection } from '../../lib/hooks'
import { api, type Rec } from '../../lib/api'
import { money, niceDate, today, useTheme, useWide } from '../../lib/theme'

const DAY = 86400000
const CATEGORY: Record<string, IconName> = { feed: 'leaf-outline', medicine: 'medkit-outline', equipment: 'construct-outline', produce: 'basket-outline', other: 'cube-outline' }

function nextDue(t: Rec): string | null {
  if (t.dueDate) return t.dueDate
  if (t.lastDone && Number(t.everyDays) > 0) return new Date(Date.parse(t.lastDone) + Number(t.everyDays) * DAY).toISOString().slice(0, 10)
  return null
}

const edit = (collection: string, id?: string) =>
  router.push({ pathname: '/edit/[collection]', params: id ? { collection, id } : { collection } })

/** Alert.prompt is iOS-only; the web has window.prompt; Android opens the form. */
function askNumber(title: string, onValue: (n: number) => void, fallback: () => void) {
  if (Platform.OS === 'ios') {
    Alert.prompt(title, undefined, (v) => { const n = Number(v); if (Number.isFinite(n) && n > 0) onValue(n) }, 'plain-text', '', 'decimal-pad')
  } else if (Platform.OS === 'web') {
    const n = Number(window.prompt(title) ?? '')
    if (Number.isFinite(n) && n > 0) onValue(n)
  } else fallback()
}

function level(item: Rec): { days: number | null; tone: Tone; fill: number } {
  const qty = Number(item.quantity) || 0
  const daily = Number(item.dailyUse) || 0
  const min = Number(item.minLevel) || 0
  const days = daily > 0 ? Math.floor(qty / daily) : null
  const low = qty <= min || (days !== null && days <= 5)
  const tone: Tone = qty <= 0 || (days !== null && days <= 2) ? 'danger' : low ? 'warn' : 'ok'
  const fill = days !== null ? days / 21 : min ? qty / (min * 3) : 1
  return { days, tone, fill: Math.min(1, fill) }
}

export default function Stock() {
  const t = useTheme()
  const wide = useWide()
  const toast = useToast()
  const [tab, setTab] = useState<'inventory' | 'maintenance'>('inventory')
  const inv = useCollection('inventory')
  const tasks = useCollection('maintenance')

  async function change(item: Rec, delta: number, message: string) {
    const before = Number(item.quantity) || 0
    await api.update('inventory', item.id, { quantity: Math.max(0, before + delta) })
    inv.refresh()
    toast(message, { label: 'Undo', onPress: async () => { await api.update('inventory', item.id, { quantity: before }); inv.refresh() } })
  }

  async function markDone(task: Rec) {
    const prev = { lastDone: task.lastDone ?? '', dueDate: task.dueDate ?? '' }
    await api.update('maintenance', task.id, { lastDone: today(), ...(Number(task.everyDays) ? {} : { dueDate: '' }) })
    tasks.refresh()
    toast(`${task.title} marked done`, { label: 'Undo', onPress: async () => { await api.update('maintenance', task.id, prev); tasks.refresh() } })
  }

  const items = [...inv.data].sort((a, b) => (level(a).days ?? 999) - (level(b).days ?? 999))
  const lowCount = items.filter((i) => level(i).tone !== 'ok').length
  const add = () => edit(tab === 'inventory' ? 'inventory' : 'maintenance')

  return (
    <Screen
      title="Stock"
      subtitle={lowCount ? `${lowCount} item${lowCount > 1 ? 's' : ''} running low` : 'Everything is well stocked'}
      refreshing={inv.loading || tasks.loading}
      onRefresh={() => { inv.refresh(); tasks.refresh() }}
      action={wide ? <Button icon="add" title={tab === 'inventory' ? 'Add item' : 'Add task'} onPress={add} /> : null}
      fab={<Fab onPress={add} label={tab === 'inventory' ? 'Add item' : 'Add task'} />}
    >
      {inv.error ? <ErrorBox message={inv.error} onRetry={inv.refresh} /> : null}
      <Row style={{ marginBottom: 18 }}>
        <Chip label="Feed and goods" count={inv.data.length} active={tab === 'inventory'} onPress={() => setTab('inventory')} />
        <Chip label="Upkeep" count={tasks.data.length} active={tab === 'maintenance'} onPress={() => setTab('maintenance')} />
      </Row>

      {tab === 'inventory' ? (
        <>
          {!inv.loading && items.length === 0 ? (
            <Empty icon="leaf-outline" title="No stock recorded" detail="Add feed with how much you use a day, and you'll be warned five days before it runs out." action={<Button icon="add" title="Add item" onPress={add} />} />
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {items.map((item) => {
              const lv = level(item)
              const daily = Number(item.dailyUse) || 0
              return (
                <View key={item.id} style={{ width: wide ? 'calc(33.333% - 8px)' as any : '100%' }}>
                  <Card style={{ gap: 12 }}>
                    <Row style={{ justifyContent: 'space-between' }} wrap={false} align="flex-start">
                      <Row gap={10} wrap={false} style={{ flexShrink: 1 }}>
                        <IconTile icon={CATEGORY[item.category] ?? 'cube-outline'} color={t.primary} size={34} />
                        <View style={{ flexShrink: 1 }}>
                          <T weight={600} numberOfLines={1}>{item.name}</T>
                          <T faint size={12.5}>{item.unitCost ? `${money(Number(item.unitCost))} per ${item.unit}` : item.category}</T>
                        </View>
                      </Row>
                      <Row gap={4} wrap={false}>
                        {lv.tone !== 'ok' ? <Badge label={lv.tone === 'danger' ? 'Almost out' : 'Low'} tone={lv.tone} /> : null}
                        <IconButton icon="create-outline" label={`Edit ${item.name}`} onPress={() => edit('inventory', item.id)} />
                      </Row>
                    </Row>
                    <View>
                      <Row style={{ justifyContent: 'space-between', marginBottom: 8 }} align="flex-end">
                        <T display size={22} num>{item.quantity}<T size={13} muted> {item.unit}</T></T>
                        {lv.days !== null ? <T size={13} weight={600} num color={lv.tone === 'ok' ? t.muted : lv.tone === 'danger' ? t.danger : t.warn}>{lv.days} days left</T> : null}
                      </Row>
                      <Meter value={lv.fill} tone={lv.tone} />
                    </View>
                    <Row gap={8}>
                      {daily ? (
                        <Button small kind="secondary" icon="remove" title={`Today's ${daily} ${item.unit}`} onPress={() => change(item, -daily, `Logged ${daily} ${item.unit} of ${item.name}`)} />
                      ) : (
                        <Button small kind="secondary" icon="remove" title="Used" onPress={() => askNumber(`How much ${item.name} was used? (${item.unit})`, (n) => change(item, -n, `Logged ${n} ${item.unit} of ${item.name}`), () => edit('inventory', item.id))} />
                      )}
                      <Button small kind="ghost" icon="add" title="Restocked" onPress={() => askNumber(`How much ${item.name} came in? (${item.unit})`, (n) => change(item, n, `Added ${n} ${item.unit} of ${item.name}`), () => edit('inventory', item.id))} />
                    </Row>
                  </Card>
                </View>
              )
            })}
          </View>
        </>
      ) : (
        <>
          {!tasks.loading && tasks.data.length === 0 ? (
            <Empty icon="construct-outline" title="No upkeep tasks" detail="Track shed cleaning, water tanks, pumps, fencing and vehicle servicing." action={<Button icon="add" title="Add task" onPress={add} />} />
          ) : (
            <List>
              {tasks.data
                .map((task) => ({ task, due: nextDue(task) }))
                .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))
                .map(({ task, due }) => {
                  const overdue = due !== null && due < today()
                  return (
                    <ListRow key={task.id} onPress={() => edit('maintenance', task.id)} trailing={<Button small kind={overdue ? 'primary' : 'secondary'} icon="checkmark" title="Done" onPress={() => markDone(task)} />}>
                      <View style={{ gap: 3 }}>
                        <T bold>{task.title}</T>
                        <T muted size={13}>{[task.asset, Number(task.everyDays) ? `Every ${task.everyDays} days` : 'One-off', task.lastDone && `last done ${niceDate(task.lastDone)}`].filter(Boolean).join(', ')}</T>
                        {due ? <Badge label={overdue ? `Overdue since ${niceDate(due)}` : `Due ${niceDate(due)}`} tone={overdue ? 'danger' : 'info'} dot /> : null}
                      </View>
                    </ListRow>
                  )
                })}
            </List>
          )}
        </>
      )}
    </Screen>
  )
}
