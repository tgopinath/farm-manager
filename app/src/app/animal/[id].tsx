import { router, Stack, useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Badge, Button, Card, Chip, Columns, Empty, List, ListRow, Row, Screen, Section, T, useToast, type Tone } from '../../components/ui'
import { useCollection } from '../../lib/hooks'
import { api } from '../../lib/api'
import { niceDate, speciesOf, today, useTheme, useWide } from '../../lib/theme'

const STATUSES: [string, string][] = [['healthy', 'Healthy'], ['sick', 'Sick'], ['pregnant', 'Pregnant'], ['sold', 'Sold'], ['dead', 'Dead']]
const AI: Record<string, { label: string; tone: Tone }> = {
  looks_healthy: { label: 'Looks healthy', tone: 'ok' }, possible_concern: { label: 'Possible concern', tone: 'warn' },
  likely_sick: { label: 'Likely sick', tone: 'danger' }, urgent: { label: 'Urgent', tone: 'danger' },
}
const LOG: Record<string, string> = { ai: '🤖 AI check', vet: '🩺 Vet visit', treatment: '💊 Treatment', deworming: '🪱 Deworming', check: '📝 Check-up' }

function ageOf(birth?: string) {
  if (!birth) return null
  const months = Math.floor((Date.now() - Date.parse(birth)) / (30.44 * 86400000))
  if (!Number.isFinite(months) || months < 0) return null
  return months < 24 ? `${months} months old` : `${Math.floor(months / 12)} years old`
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

  if (!a) return <Screen>{animals.loading ? null : <Empty title="Animal not found" detail="It may have been deleted." />}</Screen>

  const sp = speciesOf(a.species)
  const dark = t.bg !== '#F6F7FB'
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
  const facts = [a.tag && `#${a.tag}`, a.breed, a.sex === 'female' ? 'Female' : a.sex === 'male' ? 'Male' : a.sex === 'mixed' ? 'Mixed' : null, ageOf(a.birthDate), a.weightKg && `${a.weightKg} kg`, Number(a.count) > 1 && `${a.count} head`].filter(Boolean)

  return (
    <Screen refreshing={animals.loading} onRefresh={() => { animals.refresh(); health.refresh(); vacc.refresh() }}>
      {/* On a wide screen the sidebar is the navigation, so a plain link replaces the header bar. */}
      <Stack.Screen options={{ title: '', headerShown: !wide }} />
      {wide ? <View style={{ marginTop: 8, marginBottom: 14, marginLeft: -12 }}><Button small kind="ghost" icon="chevron-back" title="All animals" onPress={() => router.navigate('/animals')} /></View> : null}

      <View style={{ borderRadius: 24, padding: 22, marginBottom: 24, backgroundColor: sp ? (dark ? sp.softDark : sp.soft) : t.sunk, gap: 16 }}>
        <Row gap={16} wrap={false} align="flex-start">
          <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: t.card, alignItems: 'center', justifyContent: 'center' }}>
            <T size={40}>{sp?.emoji ?? '🐾'}</T>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <T display size={30}>{name}</T>
            <T muted size={14.5}>{facts.join(', ')}</T>
            {a.notes ? <T size={14.5} style={{ marginTop: 4 }}>{a.notes}</T> : null}
          </View>
          <Button small kind="secondary" icon="create-outline" title="Edit" onPress={() => go('animals', { id: a.id })} />
        </Row>
        <Row gap={6}>
          {STATUSES.map(([k, l]) => <Chip key={k} label={l} active={a.status === k} onPress={() => a.status !== k && setStatus(k)} />)}
        </Row>
      </View>

      <Columns ratio={[1, 1]}>
        <View>
          <Section title="Vaccinations" action={<Button small kind="ghost" icon="add" title="Schedule" onPress={() => go('vaccinations', { animalId: a.id })} />}>
            {doses.length === 0 ? <Empty icon="💉" title="None scheduled" /> : (
              <List>
                {doses.map((v) => {
                  const overdue = !v.givenDate && v.dueDate < today()
                  return (
                    <ListRow
                      key={v.id}
                      onPress={() => go('vaccinations', { id: v.id })}
                      trailing={!v.givenDate ? <Button small kind={overdue ? 'primary' : 'secondary'} icon="checkmark" title="Given" onPress={() => markGiven(v.id, v.vaccine)} /> : null}
                    >
                      <View style={{ gap: 4 }}>
                        <T bold>{v.vaccine}{!v.animalId ? <T faint size={13}>  for all {a.species}s</T> : null}</T>
                        <Badge label={v.givenDate ? `Given ${niceDate(v.givenDate)}` : overdue ? `Overdue since ${niceDate(v.dueDate)}` : `Due ${niceDate(v.dueDate)}`} tone={v.givenDate ? 'ok' : overdue ? 'danger' : 'info'} dot />
                      </View>
                    </ListRow>
                  )
                })}
              </List>
            )}
          </Section>

          <Card onPress={() => router.push({ pathname: '/health-check', params: { animalId: a.id } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28, backgroundColor: t.accentSoft, borderColor: 'transparent' }}>
            <Ionicons name="camera" size={24} color={t.accentText} />
            <View style={{ flex: 1 }}>
              <T bold color={t.accentText}>Check {name} from a photo</T>
              <T size={13} color={t.accentText}>The result is saved to the health log.</T>
            </View>
            <Ionicons name="chevron-forward" size={20} color={t.accentText} />
          </Card>
        </View>

        <Section title="Health log" action={<Button small kind="ghost" icon="add" title="Add note" onPress={() => go('health', { animalId: a.id })} />}>
          {log.length === 0 ? <Empty icon="🩺" title="No entries yet" detail="Check-ups, treatments and AI checks appear here." /> : (
            <View style={{ gap: 0 }}>
              {log.map((h, i) => (
                <View key={h.id} style={{ flexDirection: 'row', gap: 14 }}>
                  <View style={{ alignItems: 'center', width: 14 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, marginTop: 6, backgroundColor: h.kind === 'ai' ? t.accent : t.primary }} />
                    {i < log.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: t.border, marginVertical: 4 }} /> : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 20, gap: 4 }}>
                    <Row style={{ justifyContent: 'space-between' }} wrap={false}>
                      <T bold>{LOG[h.kind] ?? '📝 Note'}</T>
                      <T faint size={13}>{niceDate(h.date)}</T>
                    </Row>
                    {h.kind === 'ai' && AI[h.status] ? <Badge label={AI[h.status].label} tone={AI[h.status].tone} dot /> : null}
                    <T size={14.5} muted>{h.summary}</T>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Section>
      </Columns>
    </Screen>
  )
}
