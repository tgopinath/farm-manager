/**
 * The app's navigation, drawn by hand so it can be two things:
 * a sidebar on a laptop, and a bottom bar on a phone.
 */
import { useState } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import { router, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { BottomTabBarProps } from 'expo-router/js-tabs'
import { FONT, useTheme } from '../lib/theme'
import { DEMO } from '../lib/api'
import { QuickAdd } from './QuickAdd'
import type { IconName } from './ui'

export const TABS: { name: string; label: string; icon: IconName; active: IconName }[] = [
  { name: 'index', label: 'Today', icon: 'sunny-outline', active: 'sunny' },
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
  return (
    <View style={{ width: 248, backgroundColor: t.card, borderRightWidth: 1, borderRightColor: t.border, paddingHorizontal: 16, paddingTop: 28, paddingBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, marginBottom: 28 }}>
        <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 19 }}>🐐</Text>
        </View>
        <Text style={{ fontFamily: FONT.display, fontSize: 20, color: t.text, letterSpacing: -0.4 }}>Farm Manager</Text>
      </View>

      <Pressable
        onPress={() => setAdding(true)}
        accessibilityRole="button"
        style={(s) => {
          const { pressed, hovered } = s as { pressed: boolean; hovered?: boolean }
          return {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 12, marginBottom: 20,
            backgroundColor: t.primary, transform: [{ scale: pressed ? 0.98 : 1 }],
            ...(web ? { cursor: 'pointer', filter: hovered ? 'brightness(1.08)' : 'none' } as any : {}),
          }
        }}
      >
        <Ionicons name="add" size={20} color={t.primaryText} />
        <Text style={{ color: t.primaryText, fontWeight: '600', fontSize: 15 }}>Add record</Text>
      </Pressable>

      <View style={{ gap: 2 }}>
        {TABS.map((tab) => {
          const on = current === tab.name
          return (
            <Pressable
              key={tab.name}
              accessibilityRole="link"
              accessibilityState={{ selected: on }}
              onPress={() => router.navigate(tab.name === 'index' ? '/' : (`/${tab.name}` as any))}
              style={(s) => {
                const { hovered } = s as { pressed: boolean; hovered?: boolean }
                return {
                  flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 11,
                  backgroundColor: on ? t.soft : hovered ? t.sunk : 'transparent',
                  ...(web ? { cursor: 'pointer', transitionDuration: '120ms' } as any : {}),
                }
              }}
            >
              <Ionicons name={on ? tab.active : tab.icon} size={20} color={on ? t.primary : t.muted} />
              <Text style={{ color: on ? t.primary : t.text, fontWeight: on ? '700' : '500', fontSize: 15 }}>{tab.label}</Text>
            </Pressable>
          )
        })}
      </View>

      <View style={{ flex: 1 }} />
      {DEMO ? (
        <View style={{ backgroundColor: t.accentSoft, borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <Text style={{ color: t.accentText, fontSize: 12.5, lineHeight: 18 }}>You're trying a demo farm. Changes stay in this browser.</Text>
        </View>
      ) : null}
      <Pressable
        onPress={() => router.navigate('/settings')}
        accessibilityRole="link"
        accessibilityState={{ selected: current === 'settings' }}
        style={(s) => {
          const { hovered } = s as { pressed: boolean; hovered?: boolean }
          return { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 11, backgroundColor: current === 'settings' ? t.soft : hovered ? t.sunk : 'transparent', ...(web ? { cursor: 'pointer' } as any : {}) }
        }}
      >
        <Ionicons name={current === 'settings' ? 'settings' : 'settings-outline'} size={20} color={current === 'settings' ? t.primary : t.muted} />
        <Text style={{ color: current === 'settings' ? t.primary : t.text, fontSize: 15, fontWeight: current === 'settings' ? '700' : '500' }}>Settings</Text>
      </Pressable>
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
            <View style={{ paddingHorizontal: 16, paddingVertical: 4, borderRadius: 999, backgroundColor: on ? t.soft : 'transparent' }}>
              <Ionicons name={on ? tab.active : tab.icon} size={22} color={on ? t.primary : t.muted} />
            </View>
            <Text style={{ fontSize: 11.5, fontWeight: on ? '700' : '500', color: on ? t.primary : t.muted }}>{tab.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}
