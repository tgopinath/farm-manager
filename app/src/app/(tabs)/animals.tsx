import { useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import { Button, Card, Chip, Empty, ErrorBox, Input, Row, Screen, T } from '../../components/ui'
import { useCollection } from '../../lib/hooks'
import { SPECIES, speciesEmoji } from '../../lib/theme'

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'danger' | undefined> = {
  healthy: 'ok', sick: 'danger', pregnant: 'warn',
}

export default function Animals() {
  const params = useLocalSearchParams<{ species?: string }>()
  const [species, setSpecies] = useState<string>(params.species ?? 'all')
  const [query, setQuery] = useState('')
  const [showGone, setShowGone] = useState(false)
  const { data, error, loading, refresh } = useCollection('animals')

  const q = query.trim().toLowerCase()
  const shown = data
    .filter((a) => species === 'all' || a.species === species)
    .filter((a) => showGone || (a.status !== 'sold' && a.status !== 'dead'))
    .filter((a) => !q || [a.name, a.tag, a.breed].some((v) => String(v ?? '').toLowerCase().includes(q)))
    .sort((a, b) => (a.status === 'sick' ? -1 : 0) - (b.status === 'sick' ? -1 : 0) || String(a.name ?? '').localeCompare(String(b.name ?? '')))

  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      {error ? <ErrorBox message={error} onRetry={refresh} /> : null}
      <Row style={{ marginBottom: 10 }}>
        <Chip label="All" active={species === 'all'} onPress={() => setSpecies('all')} />
        {SPECIES.map((s) => (
          <Chip key={s.key} label={`${s.emoji} ${s.label}`} active={species === s.key} onPress={() => setSpecies(s.key)} />
        ))}
        <Chip label={showGone ? 'Hide sold/dead' : 'Show sold/dead'} onPress={() => setShowGone(!showGone)} />
      </Row>
      <Input placeholder="Search by name, tag or breed" value={query} onChangeText={setQuery} />
      <View style={{ marginBottom: 12 }}>
        <Button title="+ Add animal or flock" onPress={() => router.push({ pathname: '/edit/[collection]', params: { collection: 'animals', species: species === 'all' ? '' : species } })} />
      </View>

      {!loading && shown.length === 0 ? (
        <Empty title="No animals yet" detail="Add each goat or cow, or a whole chicken flock with a head count." />
      ) : null}

      {shown.map((a) => (
        <Card key={a.id} onPress={() => router.push(`/animal/${a.id}`)}>
          <Row gap={12} style={{ flexWrap: 'nowrap' }}>
            <T size={28}>{speciesEmoji(a.species)}</T>
            <View style={{ flex: 1 }}>
              <T bold>{a.name || a.tag || 'Unnamed'}{Number(a.count) > 1 ? ` · ${a.count} head` : ''}</T>
              <T muted size={13} numberOfLines={1}>{[a.tag && `#${a.tag}`, a.breed, a.sex].filter(Boolean).join(' · ') || a.species}</T>
            </View>
            {a.status ? <Chip label={a.status} tone={STATUS_TONE[a.status]} /> : null}
          </Row>
        </Card>
      ))}
      {shown.length ? <T muted size={12} style={{ textAlign: 'center', marginTop: 6 }}>{shown.length} record(s)</T> : null}
    </Screen>
  )
}
