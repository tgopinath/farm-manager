import { Tabs } from 'expo-router/js-tabs'
import { BottomBar, TABS } from '../../components/NavBar'
import { useTheme, useWide } from '../../lib/theme'

export default function TabsLayout() {
  const t = useTheme()
  const wide = useWide()
  return (
    <Tabs
      // Wide screens use the sidebar from the root layout instead of a tab bar.
      tabBar={(props) => (wide ? null : <BottomBar {...props} />)}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      {TABS.map((tab) => <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />)}
    </Tabs>
  )
}
