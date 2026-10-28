import { Stack } from 'expo-router/stack'
import { StatusBar } from 'expo-status-bar'
import { useTheme } from '../lib/theme'

export default function RootLayout() {
  const t = useTheme()
  return (
    <>
      <StatusBar style="auto" />
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
    </>
  )
}
