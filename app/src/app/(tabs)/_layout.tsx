import { Tabs } from 'expo-router/js-tabs'
import { Link } from 'expo-router'
import { Pressable } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '../../lib/theme'

type IconName = React.ComponentProps<typeof Ionicons>['name']

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Farm', icon: 'home-outline' },
  { name: 'animals', title: 'Animals', icon: 'paw-outline' },
  { name: 'money', title: 'Money', icon: 'wallet-outline' },
  { name: 'stock', title: 'Stock', icon: 'cube-outline' },
  { name: 'cameras', title: 'Cameras', icon: 'videocam-outline' },
]

export default function TabsLayout() {
  const t = useTheme()
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.card },
        headerTitleStyle: { color: t.text },
        tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border },
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.muted,
        sceneStyle: { backgroundColor: t.bg },
        headerRight: () => (
          <Link href="/settings" asChild>
            <Pressable accessibilityLabel="Settings" hitSlop={10} style={{ marginRight: 16 }}>
              <Ionicons name="settings-outline" size={22} color={t.primary} />
            </Pressable>
          </Link>
        ),
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.name === 'index' ? 'My Farm' : tab.title,
            tabBarLabel: tab.title,
            tabBarIcon: ({ color, size }) => <Ionicons name={tab.icon} size={size} color={color as string} />,
          }}
        />
      ))}
    </Tabs>
  )
}
