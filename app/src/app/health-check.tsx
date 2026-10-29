import { useState } from 'react'
import { Image, Platform, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { AssessmentCard } from '../components/AssessmentCard'
import { Button, Card, Chip, Input, Row, Screen, T } from '../components/ui'
import { useCollection } from '../lib/hooks'
import { api, DEMO, type Assessment } from '../lib/api'
import { NO_AI } from '../lib/demo'
import { SPECIES, speciesEmoji, useTheme } from '../lib/theme'

type Photo = { uri: string; base64: string; mimeType: string }

const PICK: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  base64: true,
  quality: 0.5,
  allowsEditing: false,
}

export default function HealthCheck() {
  const t = useTheme()
  const params = useLocalSearchParams<{ animalId?: string }>()
  const animals = useCollection('animals')
  const [animalId, setAnimalId] = useState(params.animalId ?? '')
  const [species, setSpecies] = useState('')
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Assessment | null>(null)
  const [saved, setSaved] = useState(false)

  const animal = animals.data.find((a) => a.id === animalId)

  async function choose(fromCamera: boolean) {
    setError(null)
    if (fromCamera && Platform.OS !== 'web') {
      const perm = await ImagePicker.requestCameraPermissionsAsync()
      if (!perm.granted) return setError('Camera permission is needed to take a photo.')
    }
    const res = fromCamera ? await ImagePicker.launchCameraAsync(PICK) : await ImagePicker.launchImageLibraryAsync(PICK)
    const asset = res.canceled ? null : res.assets[0]
    if (!asset) return
    let base64 = asset.base64 ?? ''
    // The web picker hands back a data: URI rather than a separate base64 field.
    if (!base64 && asset.uri.startsWith('data:')) base64 = asset.uri.split(',')[1] ?? ''
    if (!base64) return setError('Could not read that photo. Try another one.')
    setPhoto({ uri: asset.uri, base64, mimeType: asset.mimeType ?? 'image/jpeg' })
    setResult(null)
    setSaved(false)
  }

  async function run() {
    if (!photo) return
    setBusy(true); setError(null); setResult(null)
    try {
      const out = await api.diagnose({
        imageBase64: photo.base64,
        mediaType: photo.mimeType,
        species: animal?.species ?? (species || undefined),
        notes: notes || undefined,
        animalId: animalId || undefined,
      })
      setResult(out.result)
      setSaved(!!out.entry)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      {DEMO ? (
        <Card style={{ backgroundColor: t.warnSoft, borderColor: t.warnSoft }}>
          <T color={t.warn} size={13}>{NO_AI}</T>
        </Card>
      ) : null}
      <T muted style={{ marginBottom: 12 }}>
        Take a clear, well-lit photo showing the whole animal, or the part that worries you (eyes, mouth, hooves, skin, droppings).
      </T>

      <T bold style={{ marginBottom: 6 }}>Which animal? (optional)</T>
      <Row style={{ marginBottom: 12 }}>
        <Chip label="Not listed" active={!animalId} onPress={() => setAnimalId('')} />
        {animals.data.filter((a) => a.status !== 'sold' && a.status !== 'dead').slice(0, 30).map((a) => (
          <Chip key={a.id} label={`${speciesEmoji(a.species)} ${a.name || a.tag || a.species}`} active={animalId === a.id} onPress={() => setAnimalId(a.id)} />
        ))}
      </Row>
      {!animalId ? (
        <Row style={{ marginBottom: 12 }}>
          {SPECIES.map((s) => <Chip key={s.key} label={`${s.emoji} ${s.label}`} active={species === s.key} onPress={() => setSpecies(species === s.key ? '' : s.key)} />)}
        </Row>
      ) : null}

      <Input label="What have you noticed? (optional)" placeholder="Not eating since yesterday, limping…" value={notes} onChangeText={setNotes} multiline />

      <Row>
        <View style={{ flex: 1 }}><Button title="📷 Take photo" onPress={() => choose(true)} /></View>
        <View style={{ flex: 1 }}><Button kind="ghost" title="🖼️ From gallery" onPress={() => choose(false)} /></View>
      </Row>

      {photo ? (
        <Card style={{ marginTop: 12, padding: 8 }}>
          <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 260, borderRadius: 10, backgroundColor: t.border }} resizeMode="contain" />
          <View style={{ marginTop: 8 }}>
            <Button title={busy ? 'Checking…' : '🩺 Check health'} busy={busy} disabled={DEMO} onPress={run} />
          </View>
        </Card>
      ) : null}

      {error ? <Card style={{ backgroundColor: t.dangerSoft, borderColor: t.dangerSoft, marginTop: 12 }}><T color={t.danger}>{error}</T></Card> : null}
      {result ? (
        <View style={{ marginTop: 12 }}>
          <AssessmentCard result={result} />
          {saved ? <T muted size={12}>Saved to {animal?.name || 'the animal'}'s health log{result.status === 'likely_sick' || result.status === 'urgent' ? ' and marked as sick' : ''}.</T> : null}
        </View>
      ) : null}
    </Screen>
  )
}
