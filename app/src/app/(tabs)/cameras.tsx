import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { CameraPlayer } from '../../components/CameraPlayer'
import { Badge, Button, Card, Empty, ErrorBox, Fab, Row, Screen, Section, T } from '../../components/ui'
import { useCollection } from '../../lib/hooks'
import { useTheme, useWide } from '../../lib/theme'

const KIND: Record<string, string> = { hls: 'Live video', mjpeg: 'Live stream', snapshot: 'Snapshots', web: 'Web viewer' }

export default function Cameras() {
  const t = useTheme()
  const wide = useWide()
  const { data, error, loading, refresh } = useCollection('cameras')
  const add = () => router.push('/edit/cameras')

  return (
    <Screen
      title="Cameras"
      subtitle="Watch the sheds, and check an animal from a photo"
      refreshing={loading}
      onRefresh={refresh}
      action={wide ? <Button icon="add" title="Add camera" onPress={add} /> : null}
      fab={<Fab onPress={add} label="Add camera" />}
    >
      {error ? <ErrorBox message={error} onRetry={refresh} /> : null}

      <Pressable
        onPress={() => router.push('/health-check')}
        accessibilityRole="button"
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 20, backgroundColor: t.accentSoft, marginBottom: 28, transform: [{ scale: pressed ? 0.99 : 1 }] })}
      >
        <View style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="camera" size={26} color="#1F1600" />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T display size={19} color={t.accentText}>Check an animal's health</T>
          <T size={14} color={t.accentText}>Take a photo. The AI looks for visible signs of illness and says how urgent it is.</T>
        </View>
        <Ionicons name="chevron-forward" size={22} color={t.accentText} />
      </Pressable>

      <Section title="Farm CCTV">
        {!loading && data.length === 0 ? (
          <Empty icon="🎥" title="No cameras added" detail="Add a camera's HLS (.m3u8), MJPEG or snapshot address. Cameras that only offer RTSP need a gateway such as go2rtc." action={<Button icon="add" title="Add camera" onPress={add} />} />
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {data.map((c) => (
            <View key={c.id} style={{ width: wide ? 'calc(50% - 8px)' as any : '100%' }}>
              <Card padded={false} style={{ overflow: 'hidden' }}>
                <CameraPlayer kind={c.kind} url={c.url} height={wide ? 240 : 200} />
                <Pressable onPress={() => router.push(`/camera/${c.id}`)} accessibilityRole="button" style={{ padding: 14 }}>
                  <Row style={{ justifyContent: 'space-between' }} wrap={false}>
                    <View style={{ flexShrink: 1, gap: 2 }}>
                      <T bold>{c.name}</T>
                      {c.location ? <T muted size={13}>{c.location}</T> : null}
                    </View>
                    <Badge label={KIND[c.kind] ?? c.kind} tone="info" dot />
                  </Row>
                </Pressable>
              </Card>
            </View>
          ))}
        </View>
      </Section>
    </Screen>
  )
}
