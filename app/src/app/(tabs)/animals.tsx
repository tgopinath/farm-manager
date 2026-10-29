import { useMemo, useState } from 'react'
import { Platform, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Badge, Button, Card, Chip, Empty, ErrorBox, Fab, Row, Screen, T, type Tone } from '../../components/ui'
import { useCollection } from '../../lib/hooks'
import type { Rec } from '../../lib/api'
import { SPECIES, speciesOf, useTheme, useWide } from '../../lib/theme'

const STATUS: Record<string, { tone: Tone; label: string }> = {
  healthy: { tone: 'ok', label: 'Healthy' }, sick: { tone: 'danger', label: 'Sick' }, pregnant: { tone: 'info', label: 'Pregnant' },
  sold: { tone: 'neutral', label: 'Sold' }, dead: { tone: 'neutral', label: 'Dead' },
}

const head = (a: Rec) => Math.max(1, Number(a.count) || 1)
const gone = (a: Rec) => a.status === 'sold' || a.status === 'dead'

function Avatar({ species }: { species?: string }) {
  const t = useTheme()
  const s = speciesOf(species)
  const dark = t.bg !== '#F6F7FB'
  return (
    <View style={{ width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: s ? (dark ? s.softDark : s.soft) : t.sunk }}>
      <T size={24}>{s?.emoji ?? '🐾'}</T>
    </View>
  )
}

function AnimalCard({ a }: { a: Rec }) {
  const t = useTheme()
  const st = STATUS[a.status] ?? STATUS.healthy
  const facts = [a.breed, a.sex === 'female' ? 'Female' : a.sex === 'male' ? 'Male' : a.sex === 'mixed' ? 'Mixed' : null, a.weightKg ? `${a.weightKg} kg` : null].filter(Boolean)
  return (
    <Card onPress={() => router.push(`/animal/${a.id}`)} accessibilityLabel={a.name || a.tag} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, opacity: gone(a) ? 0.6 : 1 }}>
      <Avatar species={a.species} />
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <T bold size={16} numberOfLines={1}>{a.name || a.tag || 'Unnamed'}</T>
        <T muted size={13.5} numberOfLines={1}>
          {head(a) > 1 ? <T size={13.5} weight="600" color={speciesOf(a.species)?.color ?? t.muted}>{head(a)} head  </T> : null}
          {[a.tag && `#${a.tag}`, ...facts].filter(Boolean).join(', ') || speciesOf(a.species)?.one}
        </T>
      </View>
      <Badge label={st.label} tone={st.tone} dot />
    </Card>
  )
}

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

  return (
    <Screen
      title="Animals"
      subtitle={`${total} head on the farm${sick ? `, ${sick} sick` : ''}`}
      refreshing={loading}
      onRefresh={refresh}
      action={wide ? <Button title="Add animal" icon="add" onPress={add} /> : null}
      fab={<Fab onPress={add} label="Add animal" />}
    >
      {error ? <ErrorBox message={error} onRetry={refresh} /> : null}

      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 12, marginBottom: 18, alignItems: wide ? 'center' : 'stretch' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.card, borderWidth: 1.5, borderColor: t.border, borderRadius: 12, paddingHorizontal: 12, flex: wide ? 1 : undefined, maxWidth: wide ? 360 : undefined }}>
          <Ionicons name="search" size={18} color={t.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search name, tag or breed"
            placeholderTextColor={t.faint}
            style={[{ flex: 1, paddingVertical: 11, fontSize: 15, color: t.text }, Platform.OS === 'web' ? { outlineStyle: 'none' } as any : null]}
          />
        </View>
        <Row>
          <Chip label="All" active={species === 'all'} count={total} onPress={() => setSpecies('all')} />
          {SPECIES.map((s) => <Chip key={s.key} icon={s.emoji} label={s.label} count={counts[s.key]} active={species === s.key} onPress={() => setSpecies(s.key)} />)}
        </Row>
      </View>

      {!loading && shown.length === 0 ? (
        <Empty icon="🐐" title={q ? 'No match' : 'No animals yet'} detail={q ? `Nothing matches “${query}”.` : 'Add each goat or cow, or a whole flock of chickens with a head count.'} action={!q ? <Button title="Add animal" icon="add" onPress={add} /> : null} />
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {shown.map((a) => (
          <View key={a.id} style={{ flexBasis: wide ? '48%' : '100%', flexGrow: 1 }}>
            <AnimalCard a={a} />
          </View>
        ))}
      </View>

      <View style={{ alignItems: 'center', marginTop: 18 }}>
        <Button small kind="ghost" title={showGone ? 'Hide sold and dead' : 'Show sold and dead'} onPress={() => setShowGone(!showGone)} />
      </View>
    </Screen>
  )
}
