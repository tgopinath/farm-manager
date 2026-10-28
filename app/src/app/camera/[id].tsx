import { useState } from 'react'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import { CameraPlayer } from '../../components/CameraPlayer'
import { AssessmentCard } from '../../components/AssessmentCard'
import { Button, Card, Empty, Row, Screen, T } from '../../components/ui'
import { useCollection } from '../../lib/hooks'
import { request, type Assessment } from '../../lib/api'

export default function CameraScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, loading } = useCollection('cameras')
  const cam = data.find((c) => c.id === id)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Assessment | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function check() {
    setBusy(true); setError(null); setResult(null)
    try {
      setResult((await request<{ result: Assessment }>(`/cameras/${id}/check`, { method: 'POST', body: '{}' })).result)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!cam) return <Screen>{loading ? null : <Empty title="Camera not found" />}</Screen>

  return (
    <Screen>
      <Stack.Screen options={{ title: cam.name }} />
      <CameraPlayer kind={cam.kind} url={cam.url} height={260} />
      <T muted size={12} style={{ marginTop: 6 }} numberOfLines={1}>{cam.url}</T>
      <Row style={{ marginTop: 12 }}>
        {cam.kind === 'snapshot' ? <Button title="🩺 AI check this frame" busy={busy} onPress={check} /> : null}
        <Button kind="ghost" title="Edit camera" onPress={() => router.push({ pathname: '/edit/[collection]', params: { collection: 'cameras', id: cam.id } })} />
      </Row>
      {cam.kind !== 'snapshot' ? (
        <T muted size={12} style={{ marginTop: 8 }}>
          AI checks from CCTV need a snapshot (JPEG) URL that the server can reach. Most cameras offer one alongside the stream.
        </T>
      ) : null}
      {error ? <Card style={{ marginTop: 12 }}><T>{error}</T></Card> : null}
      {result ? <View style={{ marginTop: 12 }}><AssessmentCard result={result} /></View> : null}
    </Screen>
  )
}
