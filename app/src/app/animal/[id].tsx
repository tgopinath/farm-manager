import { router, Stack, useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import {
  Badge, Button, Card, Chip, Columns, Empty, IconTile, List, ListRow, Panel, Row, Screen, SpeciesIcon, T, useToast,
  type IconName, type Tone,
} from '../../components/ui'
import { useCollection } from '../../lib/hooks'
import { api } from '../../lib/api'
import { niceDate, speciesOf, today, useTheme, useWide } from '../../lib/theme'

const STATUSES: [string, string][] = [['healthy', 'Healthy'], ['sick', 'Sick'], ['pregnant', 'Pregnant'], ['sold', 'Sold'], ['dead', 'Dead']]
const STATUS_TONE: Record<string, Tone> = { healthy: 'ok', sick: 'danger', pregnant: 'info', sold: 'neutral', dead: 'neutral' }
const AI: Record<string, { label: string; tone: Tone }> = {
  looks_healthy: { label: 'Looks healthy', tone: 'ok' }, possible_concern: { label: 'Possible concern', tone: 'warn' },
  likely_sick: { label: 'Likely sick', tone: 'danger' }, urgent: { label: 'Urgent', tone: 'danger' },
}
const LOG: Record<string, { label: string; icon: IconName }> = {
  ai: { label: 'AI health check', icon: 'scan-outline' }, vet: { label: 'Vet visit', icon: 'medkit-outline' },
  treatment: { label: 'Treatment', icon: 'bandage-outline' }, deworming: { label: 'Deworming', icon: 'water-outline' },
  check: { label: 'Check-up', icon: 'clipboard-outline' },
}

function ageOf(birth?: string) {
  if (!birth) return null
  const months = Math.floor((Date.now() - Date.parse(birth)) / (30.44 * 86400000))
  if (!Number.isFinite(months) || months < 0) return null
  return months < 24 ? `${months} months` : `${Math.floor(months / 12)} years`
}

export default function AnimalDetail() {
  const t = useTheme()
  const wide = useWide()
  const toast = useToast()
  const { id } = useLocalSearchParams<{ id: string }>()
  const animals = useCollection('animals')
  const health = useCollection('health')
  const vacc = useCollection('vaccinations')
  const a = animals.data.find((x) => x.id === id)

  if (!a) return <Screen>{animals.loading ? null : <Empty icon="paw-outline" title="Animal not found" detail="It may have been deleted." />}</Screen>

  const sp = speciesOf(a.species)
  const log = health.data.filter((h) => h.animalId === id).sort((x, y) => String(y.date).localeCompare(String(x.date)))
  const doses = vacc.data
    .filter((v) => v.animalId === id || (!v.animalId && v.species === a.species))
    .sort((x, y) => Number(!!x.givenDate) - Number(!!y.givenDate) || String(x.dueDate).localeCompare(String(y.dueDate)))

  async function setStatus(status: string) {
    const prev = a!.status
    await api.update('animals', a!.id, { status })
    animals.refresh()
    toast(`${a!.name || 'Animal'} marked ${status}`, { label: 'Undo', onPress: async () => { await api.update('animals', a!.id, { status: prev }); animals.refresh() } })
  }

  async function markGiven(vid: string, name: string) {
    await api.update('vaccinations', vid, { givenDate: today() })
    vacc.refresh()
    toast(`${name} marked as given`, { label: 'Undo', onPress: async () => { await api.update('vaccinations', vid, { givenDate: '' }); vacc.refresh() } })
  }

  const go = (collection: string, extra: Record<string, string> = {}) => router.push({ pathname: '/edit/[collection]', params: { collection, ...extra } })
  const name = a.name || a.tag || 'Unnamed'
  const facts: [string, string | null][] = [
    ['Species', sp?.one ?? a.species], ['Tag', a.tag ? `#${a.tag}` : null], ['Breed', a.breed || null],
    ['Sex', a.sex === 'female' ? 'Female' : a.sex === 'male' ? 'Male' : a.sex === 'mixed' ? 'Mixed' : null],
    ['Age', ageOf(a.birthDate)], ['Weight', a.weightKg ? `${a.weightKg} kg` : null], ['Head', Number(a.count) > 1 ? String(a.count) : null],
  ]

  return (
    <Screen
      title={wide ? name : undefined}
      back={{ label: 'Animals', onPress: () => router.navigate('/animals') }}
      action={wide ? (
        <>
          <Button kind="secondary" icon="camera-outline" title="Health check" onPress={() => router.push({ pathname: '/health-check', params: { animalId: a.id } })} />
          <Button kind="secondary" icon="create-outline" title="Edit" onPress={() => go('animals', { id: a.id })} />
        </>
      ) : null}
      refreshing={animals.loading}
      onRefresh={() => { animals.refresh(); health.refresh(); vacc.refresh() }}
    >
      {/* On a wide screen the top bar carries the name and a link back, so the stack header is hidden. */}
      <Stack.Screen options={{ title: name, headerShown: !wide }} />

      <Card style={{ marginBottom: 20, gap: 16 }}>
        <Row gap={14} wrap={false} align="flex-start">
          <SpeciesIcon species={a.species} size={28} boxed={56} />
          <View style={{ flex: 1, gap: 4 }}>
            <Row gap={8}>
              <T display size={wide ? 20 : 22}>{name}</T>
              <Badge label={STATUSES.find(([k]) => k === a.status)?.[1] ?? 'Healthy'} tone={STATUS_TONE[a.status] ?? 'ok'} dot />
            </Row>
            {a.notes ? <T muted size={13.5}>{a.notes}</T> : null}
          </View>
          {!wide ? <Button small kind="secondary" icon="create-outline" title="Edit" onPress={() => go('animals', { id: a.id })} /> : null}
        </Row>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: t.border, paddingTop: 14, rowGap: 12 }}>
          {facts.filter(([, v]) => v).map(([k, v]) => (
            <View key={k} style={{ width: wide ? '16.66%' : '33.33%', paddingRight: 8 }}>
              <T faint size={12}>{k}</T>
              <T weight={500}>{v}</T>
            </View>
          ))}
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: t.border, paddingTop: 14, gap: 8 }}>
          <T faint size={12}>Status</T>
          <Row gap={6}>
            {STATUSES.map(([k, l]) => <Chip key={k} label={l} active={a.status === k} onPress={() => a.status !== k && setStatus(k)} />)}
          </Row>
        </View>
      </Card>

      <Columns ratio={[1, 1]}>
        <View>
          <Panel title="Vaccinations" action={<Button small kind="ghost" icon="add" title="Schedule" onPress={() => go('vaccinations', { animalId: a.id })} />}>
            {doses.length === 0 ? <View style={{ padding: 16 }}><T muted>None scheduled.</T></View> : (
              <List bare>
                {doses.map((v) => {
                  const overdue = !v.givenDate && v.dueDate < today()
                  return (
                    <ListRow
                      key={v.id}
                      onPress={() => go('vaccinations', { id: v.id })}
                      trailing={!v.givenDate ? <Button small kind={overdue ? 'primary' : 'secondary'} icon="checkmark" title="Mark given" onPress={() => markGiven(v.id, v.vaccine)} /> : null}
                    >
                      <View style={{ gap: 4 }}>
                        <T weight={500}>{v.vaccine}{!v.animalId ? <T faint size={12.5}>  for all {a.species}s</T> : null}</T>
                        <Badge label={v.givenDate ? `Given ${niceDate(v.givenDate)}` : overdue ? `Overdue since ${niceDate(v.dueDate)}` : `Due ${niceDate(v.dueDate)}`} tone={v.givenDate ? 'ok' : overdue ? 'danger' : 'info'} />
                      </View>
                    </ListRow>
                  )
                })}
              </List>
            )}
          </Panel>

          {!wide ? (
            <Card onPress={() => router.push({ pathname: '/health-check', params: { animalId: a.id } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <IconTile icon="camera-outline" color={t.accent} size={36} />
              <View style={{ flex: 1 }}>
                <T weight={600}>Check {name} from a photo</T>
                <T muted size={12.5}>The result is saved to the health log.</T>
              </View>
              <Ionicons name="chevron-forward" size={18} color={t.faint} />
            </Card>
          ) : null}
        </View>

        <Panel title="Health log" action={<Button small kind="ghost" icon="add" title="Add note" onPress={() => go('health', { animalId: a.id })} />}>
          {log.length === 0 ? <View style={{ padding: 16 }}><T muted>Check-ups, treatments and AI checks appear here.</T></View> : (
            <View style={{ padding: 16 }}>
              {log.map((h, i) => {
                const k = LOG[h.kind] ?? { label: 'Note', icon: 'document-text-outline' as IconName }
                return (
                  <View key={h.id} style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ alignItems: 'center' }}>
                      <IconTile icon={k.icon} color={h.kind === 'ai' ? t.accent : t.primary} size={30} />
                      {i < log.length - 1 ? <View style={{ flex: 1, width: 1, backgroundColor: t.border, marginVertical: 4 }} /> : null}
                    </View>
                    <View style={{ flex: 1, paddingBottom: i < log.length - 1 ? 18 : 0, gap: 3 }}>
                      <Row style={{ justifyContent: 'space-between' }} wrap={false}>
                        <T weight={600}>{k.label}</T>
                        <T faint size={12.5}>{niceDate(h.date)}</T>
                      </Row>
                      {h.kind === 'ai' && AI[h.status] ? <Badge label={AI[h.status].label} tone={AI[h.status].tone} /> : null}
                      <T muted size={13.5}>{h.summary}</T>
                    </View>
                  </View>
                )
              })}
            </View>
          )}
        </Panel>
      </Columns>
    </Screen>
  )
}
