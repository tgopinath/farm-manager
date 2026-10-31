import { useEffect, useRef, useState } from 'react'
import { Animated, Platform, View } from 'react-native'
import { router } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import {
  Badge, Button, Columns, ErrorBox, Fab, IconButton, IconTile, List, ListRow, Meter, Panel, Row, Screen, SpeciesIcon, Stat, T, useToast,
  type IconName, type Tone,
} from '../../components/ui'
import { QuickAdd } from '../../components/QuickAdd'
import { useCollection, useSummary } from '../../lib/hooks'
import { api, type Rec, type Reminder } from '../../lib/api'
import { compactMoney, money, SPECIES, today, useTheme, useWide } from '../../lib/theme'

const KIND: Record<Reminder['kind'], IconName> = {
  vaccination: 'medkit-outline', feed: 'leaf-outline', stock: 'cube-outline',
  balance: 'wallet-outline', maintenance: 'construct-outline', health: 'pulse-outline',
}

const LEVEL: Record<Reminder['level'], { tone: Tone; label: string }> = {
  overdue: { tone: 'danger', label: 'Overdue' },
  warning: { tone: 'warn', label: 'Act soon' },
  due: { tone: 'info', label: 'This week' },
}

/** One reminder, with the action that settles it right here. */
function TaskRow({ r, onResolve }: { r: Reminder; onResolve: (r: Reminder) => Promise<void> }) {
  const t = useTheme()
  const wide = useWide()
  const fade = useRef(new Animated.Value(1)).current
  const [busy, setBusy] = useState(false)
  const level = LEVEL[r.level]
  const tint = { danger: t.danger, warn: t.accent, info: t.primary, ok: t.ok, neutral: t.faint }[level.tone]

  const resolve = async () => {
    setBusy(true)
    Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }).start()
    await onResolve(r)
  }

  const action: { title: string; icon: IconName; run: () => void } =
    r.kind === 'vaccination' ? { title: 'Mark given', icon: 'checkmark', run: resolve }
      : r.kind === 'maintenance' ? { title: 'Mark done', icon: 'checkmark', run: resolve }
        : r.kind === 'balance' ? { title: 'Add income', icon: 'add', run: () => router.push({ pathname: '/edit/[collection]', params: { collection: 'transactions', type: 'income', accountId: r.ref.id } }) }
          : r.kind === 'health' ? { title: 'View animal', icon: 'open-outline', run: () => router.push(`/animal/${r.ref.id}`) }
            : { title: 'Restock', icon: 'add', run: () => router.push({ pathname: '/edit/[collection]', params: { collection: 'inventory', id: r.ref.id } }) }

  const button = <Button small kind={r.level === 'overdue' ? 'primary' : 'secondary'} title={action.title} icon={action.icon} busy={busy} onPress={action.run} />

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateX: fade.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
      <View style={{ flexDirection: 'row', alignItems: wide ? 'center' : 'flex-start', gap: 12, paddingVertical: 12, paddingHorizontal: 16 }}>
        <IconTile icon={KIND[r.kind]} color={tint} size={34} />
        <View style={{ flex: 1, gap: 4 }}>
          <T weight={500} size={14}>{r.title}</T>
          <Row gap={8}>
            <Badge label={level.label} tone={level.tone} />
            <T muted size={12.5}>{r.detail}</T>
          </Row>
          {!wide ? <View style={{ marginTop: 6 }}>{button}</View> : null}
        </View>
        {wide ? button : null}
      </View>
    </Animated.View>
  )
}

export default function Overview() {
  const t = useTheme()
  const wide = useWide()
  const toast = useToast()
  const { data: s, error, loading, refresh } = useSummary()
  const inventory = useCollection('inventory')
  const [adding, setAdding] = useState(false)
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  // A fresh summary already reflects settled items; stop hiding them.
  useEffect(() => { setHidden(new Set()) }, [s])

  async function resolve(r: Reminder) {
    const key = `${r.ref.collection}/${r.ref.id}`
    const before = (await api.list(r.ref.collection)).find((x) => x.id === r.ref.id)
    if (!before) return
    const patch = r.kind === 'vaccination'
      ? { givenDate: today() }
      : { lastDone: today(), ...(Number(before.everyDays) ? {} : { dueDate: '' }) }
    await api.update(r.ref.collection, r.ref.id, patch)
    setTimeout(() => setHidden((h) => new Set(h).add(key)), 200)
    toast(r.kind === 'vaccination' ? `${r.title.split(' for ')[0]} marked as given` : `${r.title} marked done`, {
      label: 'Undo',
      onPress: async () => {
        const undo: Record<string, any> = {}
        for (const k of Object.keys(patch)) undo[k] = before[k] ?? ''
        await api.update(r.ref.collection, r.ref.id, undo)
        refresh()
      },
    })
    setTimeout(refresh, 400)
  }

  const tasks = (s?.reminders ?? []).filter((r) => !hidden.has(`${r.ref.collection}/${r.ref.id}`))
  const urgent = tasks.filter((r) => r.level !== 'due').length
  const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const feeds = inventory.data
    .filter((i) => i.category === 'feed' && Number(i.dailyUse) > 0)
    .map((i) => ({ ...i, days: Math.floor((Number(i.quantity) || 0) / Number(i.dailyUse)) }) as Rec & { days: number })
    .sort((a, b) => a.days - b.days)

  const head = SPECIES.reduce((n, sp) => n + (s?.livestock[sp.key]?.head ?? 0), 0)
  const sick = SPECIES.reduce((n, sp) => n + (s?.livestock[sp.key]?.sick ?? 0), 0)
  const income = s?.month.income ?? 0
  const expense = s?.month.expense ?? 0
  const net = income - expense
  const low = (s?.balances ?? []).filter((b) => b.balance < b.minBalance)
  const scale = Math.max(income, expense, 1)

  const kpi = (icon: IconName) => <Ionicons name={icon} size={15} color={t.faint} />

  return (
    <Screen
      title="Overview"
      subtitle={date}
      refreshing={loading}
      onRefresh={() => { refresh(); inventory.refresh() }}
      action={wide ? (
        <Button kind="secondary" icon="camera-outline" title="Health check" onPress={() => router.push('/health-check')} />
      ) : <IconButton icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />}
      fab={<Fab onPress={() => setAdding(true)} label="Add record" />}
    >
      {error ? <ErrorBox message={error} onRetry={refresh} /> : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <Stat icon={kpi('paw-outline')} label="Livestock" value={head} hint={sick ? `${sick} sick` : 'All healthy'} tone={sick ? 'danger' : 'ok'} onPress={() => router.push('/animals')} />
        <Stat icon={kpi('trending-up-outline')} label="Net this month" value={<T display size={24} num color={net >= 0 ? t.text : t.expense}>{net < 0 ? '−' : ''}{money(Math.abs(net))}</T>} hint={`${compactMoney(income)} in, ${compactMoney(expense)} out`} onPress={() => router.push('/money')} />
        <Stat icon={kpi('wallet-outline')} label="Balance" value={compactMoney(s?.totalBalance ?? 0)} hint={low.length ? `${low[0].name} below minimum` : 'Above all minimums'} tone={low.length ? 'danger' : 'ok'} onPress={() => router.push('/money')} />
        <Stat icon={kpi('leaf-outline')} label="Feed left" value={feeds.length ? `${feeds[0].days} days` : '—'} hint={feeds.length ? `${feeds[0].name} runs out first` : 'Add daily use to track'} tone={feeds.length && feeds[0].days <= 5 ? 'warn' : undefined} onPress={() => router.push('/stock')} />
      </View>

      <Columns>
        <View>
          <Panel
            title="Needs attention"
            subtitle={!s ? undefined : tasks.length === 0 ? 'Nothing to do today' : urgent ? `${urgent} to act on now, ${tasks.length - urgent} this week` : `${tasks.length} coming up this week`}
            action={<Button small kind="ghost" title="Vaccinations" onPress={() => router.push('/vaccinations')} />}
          >
            {s && tasks.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center', gap: 6 }}>
                <IconTile icon="checkmark-done-outline" color={t.ok} size={40} />
                <T muted size={13.5}>Vaccinations are up to date; feed and balances are above their limits.</T>
              </View>
            ) : null}
            <List bare>
              {tasks.map((r) => <TaskRow key={`${r.ref.collection}/${r.ref.id}`} r={r} onResolve={resolve} />)}
            </List>
          </Panel>

          <Panel title="Feed levels" subtitle="Days left at today's rate of use" action={<Button small kind="ghost" title="All stock" onPress={() => router.push('/stock')} />}>
            <List bare>
              {feeds.length === 0 ? <ListRow><T muted>Add feed with its daily use to see how long it lasts.</T></ListRow> : null}
              {feeds.slice(0, 4).map((f) => {
                const tone: Tone = f.days <= 3 ? 'danger' : f.days <= 7 ? 'warn' : 'ok'
                return (
                  <ListRow key={f.id} onPress={() => router.push('/stock')}>
                    <Row wrap={false} gap={16}>
                      <View style={{ width: wide ? 160 : 120 }}>
                        <T weight={500}>{f.name}</T>
                        <T faint size={12} num>{f.quantity} {f.unit}, {f.dailyUse} {f.unit}/day</T>
                      </View>
                      <View style={{ flex: 1 }}><Meter value={Math.min(1, f.days / 21)} tone={tone} /></View>
                      <T size={13} weight={600} num color={tone === 'danger' ? t.danger : tone === 'warn' ? t.warn : t.muted} style={{ width: 56, textAlign: 'right' }}>{f.days} days</T>
                    </Row>
                  </ListRow>
                )
              })}
            </List>
          </Panel>
        </View>

        <View>
          <Panel title="Herd" action={<Button small kind="ghost" title="All animals" onPress={() => router.push('/animals')} />}>
            <List bare>
              {SPECIES.map((sp) => {
                const n = s?.livestock[sp.key]
                return (
                  <ListRow key={sp.key} onPress={() => router.push({ pathname: '/animals', params: { species: sp.key } })}>
                    <Row wrap={false} gap={12}>
                      <SpeciesIcon species={sp.key} size={18} boxed={32} />
                      <T weight={500} style={{ flex: 1 }}>{sp.label}</T>
                      {n?.sick ? <Badge label={`${n.sick} sick`} tone="danger" /> : null}
                      <T display size={16} num style={{ width: 48, textAlign: 'right' }}>{n?.head ?? 0}</T>
                    </Row>
                  </ListRow>
                )
              })}
            </List>
          </Panel>

          <Panel title="This month" action={<Button small kind="ghost" title="Money" onPress={() => router.push('/money')} />}>
            <View style={{ padding: 16, gap: 14 }}>
              {([['Income', income, t.income], ['Spent', expense, t.expense]] as const).map(([label, v, c]) => (
                <View key={label} style={{ gap: 6 }}>
                  <Row style={{ justifyContent: 'space-between' }} wrap={false}>
                    <T muted size={13}>{label}</T>
                    <T weight={600} num>{money(v)}</T>
                  </Row>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: t.sunk }}>
                    <View style={{ width: `${(v / scale) * 100}%`, height: 6, borderRadius: 3, backgroundColor: c }} />
                  </View>
                </View>
              ))}
            </View>
          </Panel>

          <Panel title="Accounts" subtitle={s ? `${money(s.totalBalance)} in total` : undefined}>
            <List bare>
              {(s?.balances ?? []).map((b) => {
                const isLow = b.balance < b.minBalance
                return (
                  <ListRow key={b.id} onPress={() => router.push('/money')} accessibilityLabel={`${b.name} ${money(b.balance)}`}>
                    <Row style={{ justifyContent: 'space-between' }} wrap={false}>
                      <View>
                        <T weight={500}>{b.name}</T>
                        <T faint size={12} num>Minimum {money(b.minBalance)}</T>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 3 }}>
                        <T weight={600} num color={isLow ? t.danger : t.text}>{money(b.balance)}</T>
                        {isLow ? <Badge label="Below minimum" tone="danger" /> : null}
                      </View>
                    </Row>
                  </ListRow>
                )
              })}
            </List>
          </Panel>
        </View>
      </Columns>
      <QuickAdd open={adding} onClose={() => setAdding(false)} />
    </Screen>
  )
}
