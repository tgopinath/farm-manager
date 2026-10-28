import { useMemo, useState } from 'react'
import { router } from 'expo-router'
import { View } from 'react-native'
import { Button, Card, Chip, Empty, ErrorBox, H, Row, Screen, T } from '../../components/ui'
import { useCollection } from '../../lib/hooks'
import type { Rec } from '../../lib/api'
import { money, speciesEmoji, useTheme } from '../../lib/theme'

const monthLabel = (m: string) =>
  new Date(`${m}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

export default function Money() {
  const t = useTheme()
  const [tab, setTab] = useState<'transactions' | 'accounts'>('transactions')
  const [type, setType] = useState<'all' | 'income' | 'expense'>('all')
  const tx = useCollection('transactions')
  const accounts = useCollection('accounts')
  const refresh = () => { tx.refresh(); accounts.refresh() }

  const accountName = useMemo(() => new Map(accounts.data.map((a) => [a.id, a.name])), [accounts.data])

  const months = useMemo(() => {
    const groups = new Map<string, typeof tx.data>()
    for (const r of [...tx.data].sort((a, b) => String(b.date).localeCompare(String(a.date)))) {
      if (type !== 'all' && r.type !== type) continue
      const m = String(r.date ?? '').slice(0, 7) || 'Undated'
      groups.set(m, [...(groups.get(m) ?? []), r])
    }
    return [...groups.entries()]
  }, [tx.data, type])

  const balances = useMemo(() => accounts.data.map((a) => {
    let bal = Number(a.openingBalance) || 0
    for (const r of tx.data) if (r.accountId === a.id) bal += (r.type === 'income' ? 1 : -1) * (Number(r.amount) || 0)
    return { ...a, balance: bal } as Rec & { balance: number }
  }), [accounts.data, tx.data])

  return (
    <Screen refreshing={tx.loading || accounts.loading} onRefresh={refresh}>
      {tx.error ? <ErrorBox message={tx.error} onRetry={refresh} /> : null}
      <Row style={{ marginBottom: 12 }}>
        <Chip label="Income & expenses" active={tab === 'transactions'} onPress={() => setTab('transactions')} />
        <Chip label="Bank & cash accounts" active={tab === 'accounts'} onPress={() => setTab('accounts')} />
      </Row>

      {tab === 'transactions' ? (
        <>
          <Row>
            <View style={{ flex: 1 }}><Button title="+ Income" kind="ghost" onPress={() => router.push({ pathname: '/edit/[collection]', params: { collection: 'transactions', type: 'income' } })} /></View>
            <View style={{ flex: 1 }}><Button title="+ Expense" onPress={() => router.push({ pathname: '/edit/[collection]', params: { collection: 'transactions', type: 'expense' } })} /></View>
          </Row>
          <Row style={{ marginTop: 12 }}>
            {(['all', 'income', 'expense'] as const).map((k) => (
              <Chip key={k} label={k === 'all' ? 'All' : k === 'income' ? 'Income' : 'Expenses'} active={type === k} onPress={() => setType(k)} />
            ))}
          </Row>
          {!tx.loading && months.length === 0 ? (
            <View style={{ marginTop: 12 }}><Empty title="No transactions yet" detail="Record milk, egg and animal sales, and what you spend on feed, medicine and labour." /></View>
          ) : null}
          {months.map(([m, rows]) => {
            const inc = rows.filter((r) => r.type === 'income').reduce((s, r) => s + (Number(r.amount) || 0), 0)
            const exp = rows.filter((r) => r.type !== 'income').reduce((s, r) => s + (Number(r.amount) || 0), 0)
            return (
              <View key={m}>
                <H right={<T size={13} muted><T size={13} color={t.income}>+{money(inc)}</T>  <T size={13} color={t.expense}>−{money(exp)}</T></T>}>
                  {m === 'Undated' ? m : monthLabel(m)}
                </H>
                {rows.map((r) => (
                  <Card key={r.id} onPress={() => router.push({ pathname: '/edit/[collection]', params: { collection: 'transactions', id: r.id } })}>
                    <Row style={{ flexWrap: 'nowrap' }} gap={10}>
                      <View style={{ flex: 1 }}>
                        <T bold>{r.category || (r.type === 'income' ? 'Income' : 'Expense')} {r.species ? speciesEmoji(r.species) : ''}</T>
                        <T muted size={13} numberOfLines={1}>
                          {[r.date, accountName.get(r.accountId), r.note].filter(Boolean).join(' · ')}
                        </T>
                      </View>
                      <T bold color={r.type === 'income' ? t.income : t.expense}>
                        {r.type === 'income' ? '+' : '−'}{money(Number(r.amount) || 0)}
                      </T>
                    </Row>
                  </Card>
                ))}
              </View>
            )
          })}
        </>
      ) : (
        <>
          <Button title="+ Add account" onPress={() => router.push('/edit/accounts')} />
          <View style={{ height: 12 }} />
          {!accounts.loading && balances.length === 0 ? (
            <Empty title="No accounts yet" detail="Add your bank account and cash box with a minimum balance to get low-balance reminders." />
          ) : null}
          {balances.map((a) => {
            const low = a.balance < (Number(a.minBalance) || 0)
            return (
              <Card key={a.id} onPress={() => router.push({ pathname: '/edit/[collection]', params: { collection: 'accounts', id: a.id } })}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T bold>{a.name}</T>
                  <T bold size={18} color={low ? t.danger : t.text}>{money(a.balance)}</T>
                </Row>
                <T muted size={12}>
                  Opening {money(Number(a.openingBalance) || 0)} · reminder below {money(Number(a.minBalance) || 0)}
                </T>
                {low ? <T size={12} bold color={t.danger}>Below your minimum balance</T> : null}
              </Card>
            )
          })}
        </>
      )}
    </Screen>
  )
}
