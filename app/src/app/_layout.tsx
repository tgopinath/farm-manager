import { Stack } from 'expo-router/stack'
import { StatusBar } from 'expo-status-bar'
import { Pressable, Text, View } from 'react-native'
import { useTheme } from '../lib/theme'
import { DEMO } from '../lib/api'
import { demo } from '../lib/demo'

function DemoStrip() {
  const t = useTheme()
  const reset = () => { demo.reset(); if (typeof window !== 'undefined') window.location.reload() }
  return (
    <View style={{ backgroundColor: t.primary, paddingVertical: 6, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <Text style={{ color: t.primaryText, fontSize: 12.5 }}>Demo · sample farm, saved in this browser</Text>
      <Pressable onPress={reset} accessibilityRole="button" hitSlop={8}>
        <Text style={{ color: t.primaryText, fontSize: 12.5, fontWeight: '700', textDecorationLine: 'underline' }}>Reset</Text>
      </Pressable>
    </View>
  )
}

export default function RootLayout() {
  const t = useTheme()
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style="auto" />
      {DEMO ? <DemoStrip /> : null}
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.card },
          headerTintColor: t.primary,
          headerTitleStyle: { color: t.text },
          contentStyle: { backgroundColor: t.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="animal/[id]" options={{ title: 'Animal' }} />
        <Stack.Screen name="camera/[id]" options={{ title: 'Live camera' }} />
        <Stack.Screen name="edit/[collection]" options={{ title: 'Edit', presentation: 'modal' }} />
        <Stack.Screen name="health-check" options={{ title: 'AI health check' }} />
        <Stack.Screen name="vaccinations" options={{ title: 'Vaccinations' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </View>
  )
}
