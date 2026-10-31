import { useMemo, useState } from 'react'
import { Platform, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Badge, Button, Chip, Empty, ErrorBox, Fab, List, ListRow, Row, Screen, SpeciesIcon, T, type Tone } from '../../components/ui'
import { useCollection } from '../../lib/hooks'
import type { Rec } from '../../lib/api'
import { font, SPECIES, speciesOf, useTheme, useWide } from '../../lib/theme'

const STATUS: Record<string, { tone: Tone; label: string }> = {
  healthy: { tone: 'ok', label: 'Healthy' }, sick: { tone: 'danger', label: 'Sick' }, pregnant: { tone: 'info', label: 'Pregnant' },
  sold: { tone: 'neutral', label: 'Sold' }, dead: { tone: 'neutral', label: 'Dead' },
}
const SEX: Record<string, string> = { female: 'Female', male: 'Male', mixed: 'Mixed' }

const head = (a: Rec) => Math.max(1, Number(a.count) || 1)
const gone = (a: Rec) => a.status === 'sold' || a.status === 'dead'

/** Column widths for the desktop table; the name column takes the rest. */
const COLS = { tag: 90, breed: 140, sex: 80, head: 70, status: 110 }

export default function Animals() {
  const t = useTheme()
  const wide = useWide()
  const params = useLocalSearchParams<{ species?: string }>()
  const [species, setSpecies] = useState<string>(params.species ?? 'all')
  const [query, setQuery] = useState('')
  const [showGone, setShowGone] = useState(false)
  const { data, error, loading, refresh } = useCollection('animals')

  const live = data.filter((a) => !gone(a))
  const counts = useMemo(() => Object.fromEntries(SPECIES.map((s) => [s.key, live.filter((a) => a.species === s.key).reduce((n, a) => n + head(a), 0)])), [live])
  const total = live.reduce((n, a) => n + head(a), 0)
  const sick = live.filter((a) => a.status === 'sick').length

  const q = query.trim().toLowerCase()
  const shown = data
    .filter((a) => species === 'all' || a.species === species)
    .filter((a) => showGone || !gone(a))
    .filter((a) => !q || [a.name, a.tag, a.breed].some((v) => String(v ?? '').toLowerCase().includes(q)))
    .sort((a, b) => Number(b.status === 'sick') - Number(a.status === 'sick') || String(a.name ?? '').localeCompare(String(b.name ?? '')))

  const add = () => router.push({ pathname: '/edit/[collection]', params: { collection: 'animals', species: species === 'all' ? '' : species } })
  const th = (label: string, w?: number, right?: boolean) => (
    <T faint size={12} weight={500} style={[w ? { width: w } : { flex: 1 }, right ? { textAlign: 'right' } : null]}>{label}</T>
  )

  return (
    <Screen
      title="Animals"
      subtitle={`${total} head across ${live.length} records${sick ? `, ${sick} sick` : ''}`}
      refreshing={loading}
      onRefresh={refresh}
      action={wide ? <Button title="Add animal" icon="add" onPress={add} /> : null}
      fab={<Fab onPress={add} label="Add animal" />}
    >
      {error ? <ErrorBox message={error} onRetry={refresh} /> : null}

      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 10, marginBottom: 14, alignItems: wide ? 'center' : 'stretch', justifyContent: 'space-between' }}>
        <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.card, borderWidth: 1, borderColor: t.strong, borderRadius: 8, paddingHorizontal: 10, width: wide ? 300 : undefined }, Platform.OS === 'web' ? { boxShadow: `0 1px 2px ${t.shadow}` } as any : null]}>
          <Ionicons name="search" size={16} color={t.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search name, tag or breed"
            placeholderTextColor={t.faint}
            style={[{ flex: 1, paddingVertical: 9, fontSize: 14, color: t.text, ...font(400) }, Platform.OS === 'web' ? { outlineStyle: 'none' } as any : null]}
          />
        </View>
        <Row gap={6}>
          <Chip label="All" active={species === 'all'} count={total} onPress={() => setSpecies('all')} />
          {SPECIES.map((s) => <Chip key={s.key} lead={<SpeciesIcon species={s.key} size={15} />} label={s.label} count={counts[s.key]} active={species === s.key} onPress={() => setSpecies(s.key)} />)}
        </Row>
      </View>

      {!loading && shown.length === 0 ? (
        <Empty icon="paw-outline" title={q ? 'No match' : 'No animals yet'} detail={q ? `Nothing matches “${query}”.` : 'Add each goat or cow, or a whole flock of chickens with a head count.'} action={!q ? <Button title="Add animal" icon="add" onPress={add} /> : null} />
      ) : (
        <List>
          {wide ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: t.bg }}>
              <View style={{ width: 32 }} />
              {th('Name')}{th('Tag', COLS.tag)}{th('Breed', COLS.breed)}{th('Sex', COLS.sex)}{th('Head', COLS.head, true)}{th('Status', COLS.status)}
            </View>
          ) : null}
          {shown.map((a) => {
            const st = STATUS[a.status] ?? STATUS.healthy
            return (
              <ListRow key={a.id} onPress={() => router.push(`/animal/${a.id}`)} accessibilityLabel={a.name || a.tag}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: gone(a) ? 0.55 : 1 }}>
                  <SpeciesIcon species={a.species} size={17} boxed={32} />
                  {wide ? (
                    <>
                      <T weight={500} numberOfLines={1} style={{ flex: 1 }}>{a.name || 'Unnamed'}</T>
                      <T muted style={{ width: COLS.tag }}>{a.tag ? `#${a.tag}` : '—'}</T>
                      <T muted numberOfLines={1} style={{ width: COLS.breed }}>{a.breed || '—'}</T>
                      <T muted style={{ width: COLS.sex }}>{SEX[a.sex] ?? '—'}</T>
                      <T num weight={500} style={{ width: COLS.head, textAlign: 'right' }}>{head(a)}</T>
                      <View style={{ width: COLS.status, paddingLeft: 12 }}><Badge label={st.label} tone={st.tone} dot /></View>
                    </>
                  ) : (
                    <>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <T weight={500} numberOfLines={1}>{a.name || a.tag || 'Unnamed'}</T>
                        <T muted size={12.5} numberOfLines={1}>
                          {[head(a) > 1 ? `${head(a)} head` : null, a.tag && `#${a.tag}`, a.breed, SEX[a.sex]].filter(Boolean).join(', ') || speciesOf(a.species)?.one}
                        </T>
                      </View>
                      <Badge label={st.label} tone={st.tone} dot />
                    </>
                  )}
                </View>
              </ListRow>
            )
          })}
        </List>
      )}

      <View style={{ alignItems: 'center', marginTop: 14 }}>
        <Button small kind="ghost" title={showGone ? 'Hide sold and dead' : 'Show sold and dead'} onPress={() => setShowGone(!showGone)} />
      </View>
    </Screen>
  )
}
