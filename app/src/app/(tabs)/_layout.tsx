import { Tabs } from 'expo-router/js-tabs'
import { BottomBar, Sidebar, TABS } from '../../components/NavBar'
import { useTheme, useWide } from '../../lib/theme'

export default function TabsLayout() {
  const t = useTheme()
  const wide = useWide()
  return (
    <Tabs
      tabBar={(props) => (wide ? <Sidebar {...props} /> : <BottomBar {...props} />)}
      screenOptions={{
        headerShown: false,
        tabBarPosition: wide ? 'left' : 'bottom',
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      {TABS.map((tab) => <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />)}
    </Tabs>
  )
}
