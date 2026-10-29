import { useMemo, useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { router } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Badge, Button, Card, Chip, Columns, Empty, ErrorBox, Fab, List, ListRow, Row, Screen, Section, T } from '../../components/ui'
import { QuickAdd } from '../../components/QuickAdd'
import { useCollection } from '../../lib/hooks'
import type { Rec } from '../../lib/api'
import { compactMoney, money, niceDate, speciesEmoji, useTheme, useWide } from '../../lib/theme'

const monthKey = (d: Date) => d.toISOString().slice(0, 7)
const monthName = (m: string, long = false) =>
  new Date(`${m}-01T00:00:00`).toLocaleDateString('en-IN', long ? { month: 'long', year: 'numeric' } : { month: 'short' })
const amt = (r: Rec) => Number(r.amount) || 0

/** Six months of income against spending. Tap a month to see its transactions. */
function MonthChart({ rows, selected, onSelect }: { rows: Rec[]; selected: string; onSelect: (m: string) => void }) {
  const t = useTheme()
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i)); return monthKey(d) })
  const data = months.map((m) => {
    const inMonth = rows.filter((r) => String(r.date).startsWith(m))
    return { m, inc: inMonth.filter((r) => r.type === 'income').reduce((s, r) => s + amt(r), 0), exp: inMonth.filter((r) => r.type !== 'income').reduce((s, r) => s + amt(r), 0) }
  })
  const max = Math.max(1, ...data.flatMap((d) => [d.inc, d.exp]))
  const H = 140
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <T bold>Last six months</T>
        <Row gap={14}>
          <Row gap={6}><View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: t.income }} /><T muted size={13}>Income</T></Row>
          <Row gap={6}><View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: t.expense }} /><T muted size={13}>Spent</T></Row>
        </Row>
      </Row>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: H + 28 }}>
        {data.map((d) => {
          const on = d.m === selected
          return (
            <Pressable
              key={d.m}
              onPress={() => onSelect(on ? '' : d.m)}
              accessibilityRole="button"
              accessibilityLabel={`${monthName(d.m, true)}: income ${money(d.inc)}, spent ${money(d.exp)}`}
              style={(s) => {
                const { hovered } = s as { pressed: boolean; hovered?: boolean }
                return { flex: 1, alignItems: 'center', gap: 6, paddingTop: 4, borderRadius: 10, backgroundColor: on ? t.soft : hovered ? t.sunk : 'transparent', ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}) }
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: H }}>
                <View style={{ width: 12, height: Math.max(2, (d.inc / max) * H), borderRadius: 4, backgroundColor: t.income, opacity: selected && !on ? 0.35 : 1 }} />
                <View style={{ width: 12, height: Math.max(2, (d.exp / max) * H), borderRadius: 4, backgroundColor: t.expense, opacity: selected && !on ? 0.35 : 1 }} />
              </View>
              <T size={12.5} weight={on ? '700' : '500'} color={on ? t.primary : t.muted}>{monthName(d.m)}</T>
            </Pressable>
          )
        })}
      </View>
    </Card>
  )
}

export default function Money() {
  const t = useTheme()
  const wide = useWide()
  const tx = useCollection('transactions')
  const accounts = useCollection('accounts')
  const [type, setType] = useState<'all' | 'income' | 'expense'>('all')
  const [month, setMonth] = useState(monthKey(new Date()))
  const [adding, setAdding] = useState(false)
  const refresh = () => { tx.refresh(); accounts.refresh() }

  const accountName = useMemo(() => new Map(accounts.data.map((a) => [a.id, a.name])), [accounts.data])
  const balances = useMemo(() => accounts.data.map((a) => {
    let bal = Number(a.openingBalance) || 0
    for (const r of tx.data) if (r.accountId === a.id) bal += (r.type === 'income' ? 1 : -1) * amt(r)
    return { ...a, balance: bal } as Rec & { balance: number }
  }), [accounts.data, tx.data])
  const total = balances.reduce((s, b) => s + b.balance, 0)

  const inMonth = tx.data.filter((r) => !month || String(r.date).startsWith(month))
  const rows = inMonth
    .filter((r) => type === 'all' || r.type === type)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  const inc = inMonth.filter((r) => r.type === 'income').reduce((s, r) => s + amt(r), 0)
  const exp = inMonth.filter((r) => r.type !== 'income').reduce((s, r) => s + amt(r), 0)

  const byCat = Object.entries(inMonth.filter((r) => r.type !== 'income').reduce<Record<string, number>>((m, r) => {
    const k = r.category || 'Other'; m[k] = (m[k] ?? 0) + amt(r); return m
  }, {})).sort((a, b) => b[1] - a[1])

  const transactions = (
    <Section
      title={month ? monthName(month, true) : 'All transactions'}
      action={<Row gap={6}>{(['all', 'income', 'expense'] as const).map((k) => <Chip key={k} label={k === 'all' ? 'All' : k === 'income' ? 'In' : 'Out'} active={type === k} onPress={() => setType(k)} />)}</Row>}
    >
      <Row gap={18} style={{ marginBottom: 12 }}>
        <T size={14} muted>In <T size={14} bold color={t.income}>{money(inc)}</T></T>
        <T size={14} muted>Out <T size={14} bold color={t.expense}>{money(exp)}</T></T>
        {month ? <Button small kind="ghost" title="Show all months" onPress={() => setMonth('')} /> : null}
      </Row>
      {!tx.loading && rows.length === 0 ? (
        <Empty icon="🧾" title="Nothing recorded" detail="Record milk, egg and animal sales, and what you spend on feed, medicine and labour." action={<Button title="Add a transaction" icon="add" onPress={() => setAdding(true)} />} />
      ) : (
        <List>
          {rows.map((r) => {
            const inn = r.type === 'income'
            return (
              <ListRow key={r.id} onPress={() => router.push({ pathname: '/edit/[collection]', params: { collection: 'transactions', id: r.id } })}>
                <Row wrap={false} gap={12}>
                  <View style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: inn ? t.okSoft : t.dangerSoft }}>
                    <Ionicons name={inn ? 'arrow-down' : 'arrow-up'} size={18} color={inn ? t.income : t.expense} />
                  </View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <T bold>{r.category || (inn ? 'Income' : 'Expense')} {r.species ? speciesEmoji(r.species) : ''}</T>
                    <T muted size={13} numberOfLines={1}>{[niceDate(r.date), accountName.get(r.accountId), r.note].filter(Boolean).join(', ')}</T>
                  </View>
                  <T bold size={16} color={inn ? t.income : t.text}>{inn ? '+' : '−'}{money(amt(r))}</T>
                </Row>
              </ListRow>
            )
          })}
        </List>
      )}
    </Section>
  )

  const side = (
    <View>
      <Section title="Accounts" action={<Button small kind="ghost" icon="add" title="Account" onPress={() => router.push('/edit/accounts')} />}>
        {balances.length === 0 ? <Empty icon="🏦" title="No accounts" detail="Add your bank account and cash box with a minimum, and you'll be warned when either runs low." /> : (
          <List>
            {balances.map((a) => {
              const low = a.balance < (Number(a.minBalance) || 0)
              return (
                <ListRow key={a.id} onPress={() => router.push({ pathname: '/edit/[collection]', params: { collection: 'accounts', id: a.id } })}>
                  <Row style={{ justifyContent: 'space-between' }} wrap={false}>
                    <View style={{ gap: 2 }}>
                      <T bold>{a.name}</T>
                      <T faint size={12.5}>Warn me below {money(Number(a.minBalance) || 0)}</T>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 3 }}>
                      <T bold size={17} color={low ? t.danger : t.text}>{money(a.balance)}</T>
                      {low ? <Badge label="Below minimum" tone="danger" /> : null}
                    </View>
                  </Row>
                </ListRow>
              )
            })}
          </List>
        )}
      </Section>

      {byCat.length ? (
        <Section title="Where it went">
          <Card style={{ gap: 12 }}>
            {byCat.map(([c, v]) => (
              <View key={c} style={{ gap: 5 }}>
                <Row style={{ justifyContent: 'space-between' }} wrap={false}>
                  <T size={14}>{c}</T>
                  <T size={14} bold>{money(v)}</T>
                </Row>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: t.sunk }}>
                  <View style={{ width: `${(v / byCat[0][1]) * 100}%`, height: 6, borderRadius: 3, backgroundColor: t.primary }} />
                </View>
              </View>
            ))}
          </Card>
        </Section>
      ) : null}
    </View>
  )

  return (
    <Screen
      title="Money"
      subtitle={`${compactMoney(total)} across ${balances.length} account${balances.length === 1 ? '' : 's'}`}
      refreshing={tx.loading || accounts.loading}
      onRefresh={refresh}
      action={wide ? (
        <Row>
          <Button kind="secondary" icon="arrow-down" title="Income" onPress={() => router.push({ pathname: '/edit/[collection]', params: { collection: 'transactions', type: 'income' } })} />
          <Button icon="arrow-up" title="Expense" onPress={() => router.push({ pathname: '/edit/[collection]', params: { collection: 'transactions', type: 'expense' } })} />
        </Row>
      ) : null}
      fab={<Fab onPress={() => setAdding(true)} label="Add transaction" />}
    >
      {tx.error ? <ErrorBox message={tx.error} onRetry={refresh} /> : null}
      <View style={{ marginBottom: 28 }}>
        <MonthChart rows={tx.data} selected={month} onSelect={setMonth} />
      </View>
      <Columns>
        {transactions}
        {side}
      </Columns>
      <QuickAdd open={adding} onClose={() => setAdding(false)} />
    </Screen>
  )
}
