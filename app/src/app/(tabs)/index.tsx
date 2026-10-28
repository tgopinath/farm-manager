import { router } from 'expo-router'
import { View } from 'react-native'
import { Button, Card, Empty, ErrorBox, H, Row, Screen, T } from '../../components/ui'
import { useSummary } from '../../lib/hooks'
import { money, SPECIES, useTheme } from '../../lib/theme'
import type { Reminder } from '../../lib/api'

const ICON: Record<Reminder['kind'], string> = {
  vaccination: '💉', feed: '🌾', stock: '📦', balance: '🏦', maintenance: '🛠️', health: '🩺',
}

function open(r: Reminder) {
  switch (r.kind) {
    case 'vaccination': return router.push('/vaccinations')
    case 'feed': case 'stock': case 'maintenance': return router.push('/stock')
    case 'balance': return router.push('/money')
    case 'health': return router.push(`/animal/${r.ref.id}`)
  }
}

export default function Dashboard() {
  const t = useTheme()
  const { data: s, error, loading, refresh } = useSummary()

  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      {error ? <ErrorBox message={error} onRetry={refresh} /> : null}

      <Row gap={10} style={{ alignItems: 'stretch' }}>
        {SPECIES.map((sp) => {
          const n = s?.livestock[sp.key]
          return (
            <Card key={sp.key} style={{ flexGrow: 1, flexBasis: 100, marginBottom: 0 }} onPress={() => router.push({ pathname: '/animals', params: { species: sp.key } })}>
              <T size={26}>{sp.emoji}</T>
              <T size={24} bold>{n?.head ?? 0}</T>
              <T muted size={13}>{sp.label}</T>
              {n?.sick ? <T size={12} color={t.danger} bold>{n.sick} sick</T> : null}
            </Card>
          )
        })}
      </Row>

      <H>Needs attention</H>
      {s && s.reminders.length === 0 ? (
        <Empty title="All good today" detail="No vaccinations due, feed and balances are above their limits." />
      ) : null}
      {s?.reminders.map((r, i) => {
        const tone = r.level === 'overdue' ? t.danger : r.level === 'warning' ? t.warn : t.primary
        return (
          <Card key={i} onPress={() => open(r)} style={{ borderLeftWidth: 4, borderLeftColor: tone }}>
            <Row gap={10} style={{ flexWrap: 'nowrap' }}>
              <T size={22}>{ICON[r.kind]}</T>
              <View style={{ flex: 1 }}>
                <T bold>{r.title}</T>
                <T muted size={13}>{r.detail}</T>
              </View>
              <T size={12} bold color={tone}>{r.level.toUpperCase()}</T>
            </Row>
          </Card>
        )
      })}

      <H>This month</H>
      <Row gap={10} style={{ alignItems: 'stretch' }}>
        <Card style={{ flexGrow: 1, flexBasis: 140, marginBottom: 0 }}>
          <T muted size={13}>Income</T>
          <T size={20} bold color={t.income}>{money(s?.month.income ?? 0)}</T>
        </Card>
        <Card style={{ flexGrow: 1, flexBasis: 140, marginBottom: 0 }}>
          <T muted size={13}>Expenditure</T>
          <T size={20} bold color={t.expense}>{money(s?.month.expense ?? 0)}</T>
        </Card>
        <Card style={{ flexGrow: 1, flexBasis: 140, marginBottom: 0 }}>
          <T muted size={13}>Net</T>
          <T size={20} bold color={(s?.month.net ?? 0) >= 0 ? t.income : t.expense}>{money(s?.month.net ?? 0)}</T>
        </Card>
      </Row>

      {s && s.balances.length ? (
        <>
          <H>Accounts · {money(s.totalBalance)}</H>
          {s.balances.map((b) => (
            <Card key={b.id} onPress={() => router.push('/money')}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T bold>{b.name}</T>
                <T bold color={b.balance < b.minBalance ? t.danger : t.text}>{money(b.balance)}</T>
              </Row>
              {b.minBalance ? <T muted size={12}>Reminder below {money(b.minBalance)}</T> : null}
            </Card>
          ))}
        </>
      ) : null}

      <H>Quick actions</H>
      <View style={{ gap: 8 }}>
        <Button title="📷  Check an animal's health from a photo" onPress={() => router.push('/health-check')} />
        <Row>
          <View style={{ flex: 1 }}><Button kind="ghost" title="+ Income / expense" onPress={() => router.push('/edit/transactions')} /></View>
          <View style={{ flex: 1 }}><Button kind="ghost" title="💉 Vaccinations" onPress={() => router.push('/vaccinations')} /></View>
        </Row>
      </View>
    </Screen>
  )
}
