/**
 * iOS app mode (Apple HIG): SF Symbols, haptics and the large-title navigation bar.
 * Everything here only runs when HIG is on (the iOS build, or ?app=ios on the web);
 * Android (M3) and the web keep their own look.
 */
import React from 'react'
import { Animated, Platform, Pressable, Text, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SymbolView } from 'expo-symbols'
import * as Haptics from 'expo-haptics'
import { HIG, font, iosBar, useTheme } from '../lib/theme'

const native = Platform.OS === 'ios'
type IonName = React.ComponentProps<typeof Ionicons>['name']

/** Ionicons names used by the app, and the SF Symbol each one becomes on iOS. */
const SF: Record<string, string> = {
  grid: 'square.grid.2x2.fill', 'grid-outline': 'square.grid.2x2',
  paw: 'pawprint.fill', 'paw-outline': 'pawprint',
  wallet: 'wallet.bifold.fill', 'wallet-outline': 'wallet.bifold',
  cube: 'shippingbox.fill', 'cube-outline': 'shippingbox',
  videocam: 'video.fill', 'videocam-outline': 'video',
  add: 'plus', close: 'xmark', checkmark: 'checkmark', 'checkmark-circle': 'checkmark.circle.fill',
  'chevron-back': 'chevron.left', 'chevron-forward': 'chevron.right', 'chevron-down': 'chevron.down',
  'settings-outline': 'gearshape', settings: 'gearshape.fill',
  search: 'magnifyingglass', 'search-outline': 'magnifyingglass',
  refresh: 'arrow.clockwise', 'camera-outline': 'camera', camera: 'camera.fill',
  'create-outline': 'square.and.pencil', 'trash-outline': 'trash',
  'arrow-up': 'arrow.up', 'arrow-down': 'arrow.down', 'arrow-back': 'chevron.left',
  'leaf-outline': 'leaf', 'receipt-outline': 'list.bullet.rectangle', 'construct-outline': 'wrench.and.screwdriver',
  'medkit-outline': 'cross.case', 'pulse-outline': 'waveform.path.ecg', 'calendar-outline': 'calendar',
  'trending-up': 'chart.line.uptrend.xyaxis', 'trending-up-outline': 'chart.line.uptrend.xyaxis',
  'alert-circle-outline': 'exclamationmark.circle', 'warning-outline': 'exclamationmark.triangle',
  'time-outline': 'clock', 'cash-outline': 'banknote', 'water-outline': 'drop', 'remove': 'minus',
  'information-circle-outline': 'info.circle', 'cloud-upload-outline': 'icloud.and.arrow.up',
  'download-outline': 'square.and.arrow.down', 'share-outline': 'square.and.arrow.up',
  'play': 'play.fill', 'pause': 'pause.fill', 'expand-outline': 'arrow.up.left.and.arrow.down.right',
}

/** An icon: an SF Symbol in the iOS app (HIG), the Ionicon everywhere else (and as the fallback). */
export function Icon({ name, size, color }: { name: IonName; size: number; color: string }) {
  const ion = <Ionicons name={name} size={size} color={color} />
  const sf = SF[name as string]
  if (!HIG || !native || !sf) return ion
  return <SymbolView name={sf as any} size={size} tintColor={color} weight="regular" fallback={ion} style={{ width: size, height: size }} />
}

/** Haptic feedback on iOS (HIG); nothing elsewhere. */
export function haptic(kind: 'selection' | 'light' | 'medium' | 'success' | 'warning' = 'light') {
  if (!HIG || !native) return
  if (kind === 'selection') Haptics.selectionAsync()
  else if (kind === 'success' || kind === 'warning') Haptics.notificationAsync(kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning)
  else Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light)
}

/**
 * HIG navigation bar for a tab's root screen: 44 pt under the status bar with the bar buttons; the
 * screen's large title (34 pt bold) sits in the content and the inline title (17 pt semibold) fades in
 * here, over a translucent bar material and a hairline, once the large title scrolls away.
 */
export function IOSNavBar({ title, scrollY, children }: { title: string; scrollY: Animated.Value; children?: React.ReactNode }) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const isDark = useColorScheme() === 'dark'
  const shown = scrollY.interpolate({ inputRange: [24, 44], outputRange: [0, 1], extrapolate: 'clamp' })
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingTop: insets.top }} pointerEvents="box-none">
      <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: shown, backgroundColor: iosBar(isDark), borderBottomWidth: 0.5, borderBottomColor: t.border, ...(Platform.OS === 'web' ? { backdropFilter: 'saturate(1.8) blur(20px)' } as any : {}) }} />
      <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16, gap: 8 }} pointerEvents="box-none">
        <Animated.Text accessibilityElementsHidden importantForAccessibility="no" numberOfLines={1} style={{ position: 'absolute', left: 80, right: 80, textAlign: 'center', opacity: shown, color: t.text, fontSize: 17, letterSpacing: -0.43, ...font(600) }}>{title}</Animated.Text>
        {children}
      </View>
    </View>
  )
}

/** A circular bar button (HIG glass-style capsule); `prominent` = tinted, for the screen's main add action. */
export function BarButton({ icon, label, onPress, prominent }: { icon: IonName; label: string; onPress: () => void; prominent?: boolean }) {
  const t = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      onPress={() => { haptic('light'); onPress() }}
      style={({ pressed }) => ({
        width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1,
        backgroundColor: prominent ? t.primary : t.card,
        shadowColor: '#000', shadowOpacity: prominent ? 0 : 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
      })}
    >
      <Icon name={icon} size={prominent ? 20 : 19} color={prominent ? t.primaryText : t.text} />
    </Pressable>
  )
}

/** Large title (34 pt bold) for the top of a tab's root screen. */
export function LargeTitle({ title, sub }: { title: string; sub?: React.ReactNode }) {
  const t = useTheme()
  return (
    <View style={{ marginBottom: 16, gap: 2 }}>
      <Text accessibilityRole="header" style={{ color: t.text, fontSize: 34, lineHeight: 41, letterSpacing: 0.4, ...font(700) }}>{title}</Text>
      {sub}
    </View>
  )
}
