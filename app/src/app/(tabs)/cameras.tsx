import { router } from 'expo-router'
import { View } from 'react-native'
import { Button, Card, Empty, ErrorBox, H, Row, Screen, T } from '../../components/ui'
import { useCollection } from '../../lib/hooks'
import { useTheme } from '../../lib/theme'

const KIND_LABEL: Record<string, string> = { hls: 'HLS', mjpeg: 'MJPEG', snapshot: 'Snapshot', web: 'Web viewer' }

export default function Cameras() {
  const t = useTheme()
  const { data, error, loading, refresh } = useCollection('cameras')

  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      {error ? <ErrorBox message={error} onRetry={refresh} /> : null}

      <Card style={{ backgroundColor: t.soft, borderColor: t.soft }}>
        <T bold size={16}>📷 Phone camera</T>
        <T muted size={13} style={{ marginVertical: 6 }}>
          Photograph an animal that looks unwell. The AI looks for visible signs of illness and tells you how urgent it is.
        </T>
        <Button title="Take a photo for a health check" onPress={() => router.push('/health-check')} />
      </Card>

      <H right={<Button small kind="ghost" title="+ Add camera" onPress={() => router.push('/edit/cameras')} />}>Farm CCTV</H>
      {!loading && data.length === 0 ? (
        <Empty
          title="No cameras added"
          detail="Add your CCTV or IP camera's HLS (.m3u8), MJPEG or snapshot URL. RTSP-only cameras need a gateway such as go2rtc or your NVR's HLS output."
        />
      ) : null}
      {data.map((c) => (
        <Card key={c.id} onPress={() => router.push(`/camera/${c.id}`)}>
          <Row style={{ flexWrap: 'nowrap' }} gap={12}>
            <T size={24}>🎥</T>
            <View style={{ flex: 1 }}>
              <T bold>{c.name}</T>
              <T muted size={12} numberOfLines={1}>{[KIND_LABEL[c.kind] ?? c.kind, c.location].filter(Boolean).join(' · ')}</T>
            </View>
            <T color={t.primary} bold>View ›</T>
          </Row>
        </Card>
      ))}
    </Screen>
  )
}
