import { Stack } from 'expo-router/stack'
import { StatusBar } from 'expo-status-bar'
import { Platform, Text, View } from 'react-native'
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import { ToastProvider } from '../components/ui'
import { Sidebar } from '../components/NavBar'
import { font, useTheme, useWide } from '../lib/theme'
import { DEMO } from '../lib/api'

/** On a phone the demo notice is a thin strip; the sidebar carries it on a wide screen. */
function DemoStrip() {
  const t = useTheme()
  const wide = useWide()
  // The native apps draw edge to edge, so a strip here would sit under the status bar; Settings explains the demo instead.
  if (wide || Platform.OS !== 'web') return null
  return (
    <View style={{ backgroundColor: t.soft, paddingVertical: 6, paddingHorizontal: 12, alignItems: 'center' }}>
      <Text style={{ color: t.primary, fontSize: 12.5, ...font(500) }}>Demo farm. Changes stay in this browser.</Text>
    </View>
  )
}

export default function RootLayout() {
  const t = useTheme()
  const wide = useWide()
  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold })
  if (!loaded) return <View style={{ flex: 1, backgroundColor: t.bg }} />
  return (
    <ToastProvider>
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <StatusBar style="auto" />
        {DEMO ? <DemoStrip /> : null}
        <View style={{ flex: 1, flexDirection: 'row' }}>
        {wide ? <Sidebar /> : null}
        <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: t.card },
            headerShadowVisible: true,
            headerTintColor: t.primary,
            headerTitleStyle: { color: t.text, fontSize: 17, ...font(600) },
            contentStyle: { backgroundColor: t.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="animal/[id]" options={{ title: '' }} />
          <Stack.Screen name="camera/[id]" options={{ title: 'Live camera' }} />
          <Stack.Screen name="edit/[collection]" options={{ title: 'Edit', presentation: 'modal' }} />
          <Stack.Screen name="health-check" options={{ title: 'Health check' }} />
          <Stack.Screen name="vaccinations" options={{ title: 'Vaccinations' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
        </View>
        </View>
      </View>
    </ToastProvider>
  )
}
