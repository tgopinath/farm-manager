import { router, Stack, useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import { Button, Card, Chip, Empty, H, Row, Screen, T } from '../../components/ui'
import { useCollection } from '../../lib/hooks'
import { api } from '../../lib/api'
import { speciesEmoji, today, useTheme } from '../../lib/theme'

const AI_LABEL: Record<string, string> = {
  looks_healthy: 'Looks healthy', possible_concern: 'Possible concern', likely_sick: 'Likely sick', urgent: 'Urgent',
}

function ageOf(birth?: string) {
  if (!birth) return null
  const months = Math.floor((Date.now() - Date.parse(birth)) / (30.44 * 86400000))
  if (!Number.isFinite(months) || months < 0) return null
  return months < 24 ? `${months} months` : `${Math.floor(months / 12)} years`
}

export default function AnimalDetail() {
  const t = useTheme()
  const { id } = useLocalSearchParams<{ id: string }>()
  const animals = useCollection('animals')
  const health = useCollection('health')
  const vacc = useCollection('vaccinations')
  const a = animals.data.find((x) => x.id === id)

  if (!a) return <Screen>{animals.loading ? null : <Empty title="Animal not found" />}</Screen>

  const log = health.data.filter((h) => h.animalId === id).sort((x, y) => String(y.date).localeCompare(String(x.date)))
  const doses = vacc.data
    .filter((v) => v.animalId === id || (!v.animalId && v.species === a.species))
    .sort((x, y) => String(x.dueDate).localeCompare(String(y.dueDate)))

  async function setStatus(status: string) {
    await api.update('animals', a!.id, { status })
    animals.refresh()
  }

  async function markGiven(vid: string) {
    await api.update('vaccinations', vid, { givenDate: today() })
    vacc.refresh()
  }

  const name = a.name || a.tag || 'Unnamed'
  const go = (collection: string, extra: Record<string, string> = {}) =>
    router.push({ pathname: '/edit/[collection]', params: { collection, ...extra } })

  return (
    <Screen refreshing={animals.loading} onRefresh={() => { animals.refresh(); health.refresh(); vacc.refresh() }}>
      <Stack.Screen options={{ title: name }} />
      <Card>
        <Row style={{ flexWrap: 'nowrap' }} gap={14}>
          <T size={44}>{speciesEmoji(a.species)}</T>
          <View style={{ flex: 1 }}>
            <T bold size={20}>{name}</T>
            <T muted>{[a.tag && `#${a.tag}`, a.breed, a.sex, ageOf(a.birthDate), a.weightKg && `${a.weightKg} kg`, Number(a.count) > 1 && `${a.count} head`].filter(Boolean).join(' · ')}</T>
          </View>
        </Row>
        <Row style={{ marginTop: 12 }}>
          {['healthy', 'sick', 'pregnant', 'sold', 'dead'].map((s) => (
            <Chip key={s} label={s} active={a.status === s} onPress={() => setStatus(s)} />
          ))}
        </Row>
        {a.notes ? <T muted size={13} style={{ marginTop: 10 }}>{a.notes}</T> : null}
        <View style={{ marginTop: 12 }}>
          <Button small kind="ghost" title="Edit details" onPress={() => go('animals', { id: a.id })} />
        </View>
      </Card>

      <Button title="📷 AI health check for this animal" onPress={() => router.push({ pathname: '/health-check', params: { animalId: a.id } })} />

      <H right={<Button small kind="ghost" title="+ Schedule" onPress={() => go('vaccinations', { animalId: a.id })} />}>Vaccinations</H>
      {doses.length === 0 ? <T muted size={13}>None scheduled.</T> : null}
      {doses.map((v) => {
        const overdue = !v.givenDate && v.dueDate < today()
        return (
          <Card key={v.id} onPress={() => go('vaccinations', { id: v.id })}>
            <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
              <View style={{ flex: 1 }}>
                <T bold>💉 {v.vaccine}{!v.animalId ? <T muted size={12}>  (all {a.species}s)</T> : null}</T>
                <T size={13} color={v.givenDate ? t.ok : overdue ? t.danger : t.muted}>
                  {v.givenDate ? `Given ${v.givenDate}` : `${overdue ? 'Overdue — was due' : 'Due'} ${v.dueDate}`}
                </T>
              </View>
              {!v.givenDate ? <Button small title="Given ✓" onPress={() => markGiven(v.id)} /> : null}
            </Row>
          </Card>
        )
      })}

      <H right={<Button small kind="ghost" title="+ Add entry" onPress={() => go('health', { animalId: a.id })} />}>Health log</H>
      {log.length === 0 ? <T muted size={13}>No entries yet.</T> : null}
      {log.map((h) => (
        <Card key={h.id} onPress={h.kind === 'ai' ? undefined : () => go('health', { id: h.id })}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T bold>{h.kind === 'ai' ? '🤖 AI check' : h.kind === 'vet' ? '🩺 Vet visit' : h.kind === 'treatment' ? '💊 Treatment' : h.kind === 'deworming' ? '🪱 Deworming' : '📝 Check-up'}</T>
            <T muted size={12}>{h.date}</T>
          </Row>
          {h.kind === 'ai' && h.status ? <T size={12} bold color={h.status === 'looks_healthy' ? t.ok : h.status === 'possible_concern' ? t.warn : t.danger}>{AI_LABEL[h.status]}</T> : null}
          <T size={14} style={{ marginTop: 4 }}>{h.summary}</T>
        </Card>
      ))}
    </Screen>
  )
}
