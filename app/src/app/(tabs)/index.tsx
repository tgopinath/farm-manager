import { useEffect, useRef, useState } from 'react'
import { Animated, Platform, Pressable, View } from 'react-native'
import { router } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import {
  Badge, Button, Card, Columns, ErrorBox, Fab, IconButton, List, ListRow, Meter, Row, Screen, Section, T, useToast,
  type IconName, type Tone,
} from '../../components/ui'
import { QuickAdd } from '../../components/QuickAdd'
import { useCollection, useSummary } from '../../lib/hooks'
import { api, type Rec, type Reminder } from '../../lib/api'
import { compactMoney, money, SPECIES, today, useTheme, useWide } from '../../lib/theme'

const KIND: Record<Reminder['kind'], { icon: IconName; label: string }> = {
  vaccination: { icon: 'medkit-outline', label: 'Vaccination' },
  feed: { icon: 'leaf-outline', label: 'Feed' },
  stock: { icon: 'cube-outline', label: 'Stock' },
  balance: { icon: 'wallet-outline', label: 'Money' },
  maintenance: { icon: 'construct-outline', label: 'Upkeep' },
  health: { icon: 'pulse-outline', label: 'Health' },
}

const LEVEL: Record<Reminder['level'], { tone: Tone; label: string }> = {
  overdue: { tone: 'danger', label: 'Overdue' },
  warning: { tone: 'warn', label: 'Act soon' },
  due: { tone: 'info', label: 'This week' },
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

/** One reminder, with the action that resolves it right here. */
function TaskRow({ r, onResolve }: { r: Reminder; onResolve: (r: Reminder) => Promise<void> }) {
  const t = useTheme()
  const wide = useWide()
  const fade = useRef(new Animated.Value(1)).current
  const [busy, setBusy] = useState(false)
  const level = LEVEL[r.level]
  const tint = { danger: t.danger, warn: t.accent, info: t.primary, ok: t.ok, neutral: t.faint }[level.tone]

  const resolve = async () => {
    setBusy(true)
    Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: Platform.OS !== 'web' }).start()
    await onResolve(r)
  }

  const action: { title: string; icon: IconName; run: () => void } =
    r.kind === 'vaccination' ? { title: 'Mark given', icon: 'checkmark', run: resolve }
      : r.kind === 'maintenance' ? { title: 'Done', icon: 'checkmark', run: resolve }
        : r.kind === 'balance' ? { title: 'Add income', icon: 'add', run: () => router.push({ pathname: '/edit/[collection]', params: { collection: 'transactions', type: 'income', accountId: r.ref.id } }) }
          : r.kind === 'health' ? { title: 'Open', icon: 'chevron-forward', run: () => router.push(`/animal/${r.ref.id}`) }
            : { title: 'Restock', icon: 'add', run: () => router.push({ pathname: '/edit/[collection]', params: { collection: 'inventory', id: r.ref.id } }) }

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateX: fade.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
      <View style={{ flexDirection: 'row', alignItems: wide ? 'center' : 'flex-start', gap: 14, paddingVertical: 14, paddingHorizontal: 16 }}>
        <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: tint + '1F', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={KIND[r.kind].icon} size={20} color={tint} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <T bold size={15.5}>{r.title}</T>
          <Row gap={8}>
            <Badge label={level.label} tone={level.tone} dot />
            <T muted size={13}>{r.detail}</T>
          </Row>
          {!wide ? <View style={{ marginTop: 6 }}><Button small kind={r.level === 'overdue' ? 'primary' : 'secondary'} title={action.title} icon={action.icon} busy={busy} onPress={action.run} /></View> : null}
        </View>
        {wide ? <Button small kind={r.level === 'overdue' ? 'primary' : 'secondary'} title={action.title} icon={action.icon} busy={busy} onPress={action.run} /> : null}
      </View>
    </Animated.View>
  )
}

function SpeciesTile({ s, head, sick }: { s: (typeof SPECIES)[number]; head: number; sick: number }) {
  const t = useTheme()
  const dark = t.bg !== '#F6F7FB'
  return (
    <Card
      onPress={() => router.push({ pathname: '/animals', params: { species: s.key } })}
      accessibilityLabel={`${head} ${s.label}`}
      style={{ flexGrow: 1, flexBasis: 0, minWidth: 96, padding: 14, gap: 6, backgroundColor: dark ? s.softDark : s.soft, borderColor: 'transparent' }}
    >
      <Row style={{ justifyContent: 'space-between' }} wrap={false}>
        <T size={24}>{s.emoji}</T>
        {sick ? <Badge label={`${sick} sick`} tone="danger" /> : null}
      </Row>
      <T display size={30} color={dark ? '#fff' : t.text}>{head}</T>
      <T size={13.5} weight="600" color={s.color}>{s.label}</T>
    </Card>
  )
}

export default function Today() {
  const t = useTheme()
  const wide = useWide()
  const toast = useToast()
  const { data: s, error, loading, refresh } = useSummary()
  const inventory = useCollection('inventory')
  const [adding, setAdding] = useState(false)
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  // A fresh summary already reflects resolved items; stop hiding them.
  useEffect(() => { setHidden(new Set()) }, [s])

  async function resolve(r: Reminder) {
    const key = `${r.ref.collection}/${r.ref.id}`
    const before = (await api.list(r.ref.collection)).find((x) => x.id === r.ref.id)
    if (!before) return
    const patch = r.kind === 'vaccination'
      ? { givenDate: today() }
      : { lastDone: today(), ...(Number(before.everyDays) ? {} : { dueDate: '' }) }
    await api.update(r.ref.collection, r.ref.id, patch)
    setTimeout(() => setHidden((h) => new Set(h).add(key)), 220)
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
  const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  const feeds = inventory.data
    .filter((i) => i.category === 'feed' && Number(i.dailyUse) > 0)
    .map((i) => ({ ...i, days: Math.floor((Number(i.quantity) || 0) / Number(i.dailyUse)) }) as Rec & { days: number })
    .sort((a, b) => a.days - b.days)

  const income = s?.month.income ?? 0
  const expense = s?.month.expense ?? 0
  const scale = Math.max(income, expense, 1)

  const herd = (
    <Row gap={10} style={{ marginBottom: 28, alignItems: 'stretch' }}>
      {SPECIES.map((sp) => <SpeciesTile key={sp.key} s={sp} head={s?.livestock[sp.key]?.head ?? 0} sick={s?.livestock[sp.key]?.sick ?? 0} />)}
    </Row>
  )

  return (
    <Screen
      title={greeting()}
      subtitle={date}
      refreshing={loading}
      onRefresh={() => { refresh(); inventory.refresh() }}
      action={wide ? null : <IconButton icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />}
      fab={<Fab onPress={() => setAdding(true)} label="Add record" />}
    >
      {error ? <ErrorBox message={error} onRetry={refresh} /> : null}
      {!wide ? herd : null}

      <Columns>
        <View>
          <View style={{ backgroundColor: t.card, borderRadius: 22, borderWidth: 1, borderColor: t.border, overflow: 'hidden', marginBottom: 28 }}>
            <View style={{ padding: 20, paddingBottom: 16, borderBottomWidth: tasks.length ? 1 : 0, borderBottomColor: t.border }}>
              <T display size={wide ? 28 : 24}>
                {!s ? ' ' : tasks.length === 0 ? 'Nothing needs you today' : `${tasks.length} thing${tasks.length > 1 ? 's' : ''} to look at`}
              </T>
              <T muted size={14} style={{ marginTop: 4 }}>
                {!s ? ' ' : tasks.length === 0
                  ? 'Vaccinations are up to date, feed and balances are above their limits.'
                  : urgent ? `${urgent} need${urgent > 1 ? '' : 's'} action now, the rest are coming up this week.` : 'All of these are coming up this week.'}
              </T>
            </View>
            {tasks.map((r, i) => (
              <View key={`${r.ref.collection}/${r.ref.id}`} style={i ? { borderTopWidth: 1, borderTopColor: t.border } : null}>
                <TaskRow r={r} onResolve={resolve} />
              </View>
            ))}
          </View>

          <Section title="Feed left" action={<Button small kind="ghost" title="All stock" onPress={() => router.push('/stock')} />}>
            <List>
              {feeds.length === 0 ? <ListRow><T muted>Add feed with its daily use to see how many days it will last.</T></ListRow> : null}
              {feeds.slice(0, 4).map((f) => {
                const tone: Tone = f.days <= 3 ? 'danger' : f.days <= 7 ? 'warn' : 'ok'
                return (
                  <ListRow key={f.id} onPress={() => router.push('/stock')}>
                    <Row style={{ justifyContent: 'space-between', marginBottom: 8 }} wrap={false}>
                      <T bold>{f.name}</T>
                      <T size={14} weight="600" color={tone === 'danger' ? t.danger : tone === 'warn' ? t.warn : t.muted}>{f.days} days</T>
                    </Row>
                    <Meter value={Math.min(1, f.days / 21)} tone={tone} />
                    <T faint size={12.5} style={{ marginTop: 6 }}>{f.quantity} {f.unit} in store, {f.dailyUse} {f.unit} a day</T>
                  </ListRow>
                )
              })}
            </List>
          </Section>
        </View>

        <View>
          {wide ? herd : null}

          <Section title="This month">
            <Card style={{ gap: 14 }}>
              {([['Income', income, t.income], ['Spent', expense, t.expense]] as const).map(([label, v, c]) => (
                <View key={label} style={{ gap: 6 }}>
                  <Row style={{ justifyContent: 'space-between' }} wrap={false}>
                    <T muted size={14}>{label}</T>
                    <T bold size={16}>{money(v)}</T>
                  </Row>
                  <View style={{ height: 10, borderRadius: 5, backgroundColor: t.sunk }}>
                    <View style={{ width: `${(v / scale) * 100}%`, height: 10, borderRadius: 5, backgroundColor: c }} />
                  </View>
                </View>
              ))}
              <View style={{ borderTopWidth: 1, borderTopColor: t.border, paddingTop: 12 }}>
                <Row style={{ justifyContent: 'space-between' }} wrap={false}>
                  <T muted size={14}>{income - expense >= 0 ? 'You kept' : 'You are short by'}</T>
                  <T display size={24} color={income - expense >= 0 ? t.income : t.expense}>{money(Math.abs(income - expense))}</T>
                </Row>
              </View>
            </Card>
          </Section>

          <Section title="Accounts" action={s ? <T muted size={14}>{compactMoney(s.totalBalance)} in total</T> : null}>
            <List>
              {(s?.balances ?? []).map((b) => {
                const low = b.balance < b.minBalance
                return (
                  <ListRow key={b.id} onPress={() => router.push('/money')} accessibilityLabel={`${b.name} ${money(b.balance)}`}>
                    <Row style={{ justifyContent: 'space-between' }} wrap={false}>
                      <View style={{ gap: 2 }}>
                        <T bold>{b.name}</T>
                        <T faint size={12.5}>Warn me below {money(b.minBalance)}</T>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <T bold size={17} color={low ? t.danger : t.text}>{money(b.balance)}</T>
                        {low ? <Badge label="Below minimum" tone="danger" /> : null}
                      </View>
                    </Row>
                  </ListRow>
                )
              })}
            </List>
          </Section>

          {wide ? (
            <Pressable
              onPress={() => router.push('/health-check')}
              accessibilityRole="button"
              style={(st) => {
                const { hovered } = st as { pressed: boolean; hovered?: boolean }
                return { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 18, backgroundColor: t.accentSoft, opacity: hovered ? 0.9 : 1, ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}) }
              }}
            >
              <T size={28}>📷</T>
              <View style={{ flex: 1 }}>
                <T bold color={t.accentText}>Worried about an animal?</T>
                <T size={13.5} color={t.accentText}>Take a photo and the AI checks it for visible signs of illness.</T>
              </View>
              <Ionicons name="chevron-forward" size={20} color={t.accentText} />
            </Pressable>
          ) : null}
        </View>
      </Columns>
      <QuickAdd open={adding} onClose={() => setAdding(false)} />
    </Screen>
  )
}
