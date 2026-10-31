/**
 * The app's navigation, drawn by hand so it can be two things:
 * a sidebar on a laptop, and a bottom bar on a phone.
 */
import { useState } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import { router, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import type { BottomTabBarProps } from 'expo-router/js-tabs'
import { font, useTheme } from '../lib/theme'
import { DEMO } from '../lib/api'
import { QuickAdd } from './QuickAdd'
import type { IconName } from './ui'

export const TABS: { name: string; label: string; icon: IconName; active: IconName }[] = [
  { name: 'index', label: 'Overview', icon: 'grid-outline', active: 'grid' },
  { name: 'animals', label: 'Animals', icon: 'paw-outline', active: 'paw' },
  { name: 'money', label: 'Money', icon: 'wallet-outline', active: 'wallet' },
  { name: 'stock', label: 'Stock', icon: 'cube-outline', active: 'cube' },
  { name: 'cameras', label: 'Cameras', icon: 'videocam-outline', active: 'videocam' },
]

const web = Platform.OS === 'web'

/** Which sidebar item a path belongs to, so detail pages keep their section lit. */
function sectionOf(path: string) {
  if (path === '/' || path.startsWith('/vaccinations')) return 'index'
  if (path.startsWith('/animal')) return 'animals'
  if (path.startsWith('/camera') || path.startsWith('/health-check')) return 'cameras'
  if (path.startsWith('/money')) return 'money'
  if (path.startsWith('/stock')) return 'stock'
  if (path.startsWith('/settings')) return 'settings'
  return ''
}

/**
 * The desktop sidebar. It lives in the root layout rather than the tab bar,
 * so it stays put on every page, including an animal or a form, the way a
 * web app's navigation does.
 */
export function Sidebar() {
  const t = useTheme()
  const [adding, setAdding] = useState(false)
  const current = sectionOf(usePathname())

  const item = (key: string, label: string, icon: IconName, activeIcon: IconName, go: () => void) => {
    const on = current === key
    return (
      <Pressable
        key={key}
        accessibilityRole="link"
        accessibilityState={{ selected: on }}
        onPress={go}
        style={(s) => {
          const { hovered } = s as { pressed: boolean; hovered?: boolean }
          return {
            flexDirection: 'row', alignItems: 'center', gap: 10, height: 36, paddingHorizontal: 10, borderRadius: 8,
            backgroundColor: on ? t.soft : hovered ? t.sunk : 'transparent',
            ...(web ? { cursor: 'pointer', transitionDuration: '100ms' } as any : {}),
          }
        }}
      >
        <Ionicons name={on ? activeIcon : icon} size={18} color={on ? t.primary : t.muted} />
        <Text style={{ color: on ? t.primary : t.text, fontSize: 14, ...font(on ? 600 : 500) }}>{label}</Text>
      </Pressable>
    )
  }

  return (
    <View style={{ width: 240, backgroundColor: t.card, borderRightWidth: 1, borderRightColor: t.border, paddingHorizontal: 12, paddingTop: 18, paddingBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6, height: 36, marginBottom: 18 }}>
        <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="barn" size={18} color={t.primaryText} />
        </View>
        <View>
          <Text style={{ fontSize: 14.5, color: t.text, ...font(600) }}>Farm Manager</Text>
          <Text style={{ fontSize: 12, color: t.muted, ...font(400) }}>{DEMO ? 'Sample farm' : 'My farm'}</Text>
        </View>
      </View>

      <Pressable
        onPress={() => setAdding(true)}
        accessibilityRole="button"
        style={(s) => {
          const { pressed, hovered } = s as { pressed: boolean; hovered?: boolean }
          return {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 8, height: 38, marginBottom: 18,
            backgroundColor: t.primary,
            ...(web ? { cursor: 'pointer', filter: hovered || pressed ? 'brightness(0.92)' : 'none', transitionDuration: '100ms' } as any : {}),
          }
        }}
      >
        <Ionicons name="add" size={18} color={t.primaryText} />
        <Text style={{ color: t.primaryText, fontSize: 14, ...font(600) }}>Add record</Text>
      </Pressable>

      <View style={{ gap: 2 }}>
        {TABS.map((tab) => item(tab.name, tab.label, tab.icon, tab.active, () => router.navigate(tab.name === 'index' ? '/' : (`/${tab.name}` as any))))}
      </View>

      <View style={{ flex: 1 }} />
      {DEMO ? (
        <View style={{ borderWidth: 1, borderColor: t.border, borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <Text style={{ color: t.text, fontSize: 12.5, ...font(600) }}>Demo data</Text>
          <Text style={{ color: t.muted, fontSize: 12, lineHeight: 17, ...font(400) }}>Changes stay in this browser.</Text>
        </View>
      ) : null}
      {item('settings', 'Settings', 'settings-outline', 'settings', () => router.navigate('/settings'))}
      <QuickAdd open={adding} onClose={() => setAdding(false)} />
    </View>
  )
}

export function BottomBar({ state, navigateToTab }: BottomTabBarProps) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const current = state.routes[state.index]?.name
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.card, borderTopWidth: 1, borderTopColor: t.border, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 8), paddingHorizontal: 6 }}>
      {TABS.map((tab) => {
        const on = current === tab.name
        return (
          <Pressable
            key={tab.name}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={tab.label}
            onPress={() => { const r = state.routes.find((x) => x.name === tab.name); if (r) navigateToTab(r.key) }}
            style={{ flex: 1, alignItems: 'center', gap: 3 }}
          >
            <View style={{ paddingHorizontal: 14, paddingVertical: 3, borderRadius: 8, backgroundColor: on ? t.soft : 'transparent' }}>
              <Ionicons name={on ? tab.active : tab.icon} size={21} color={on ? t.primary : t.muted} />
            </View>
            <Text style={{ fontSize: 11, color: on ? t.primary : t.muted, ...font(on ? 600 : 500) }}>{tab.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}
