import { Platform, useColorScheme, useWindowDimensions } from 'react-native'

/**
 * A working tool's palette: neutral slate surfaces, one indigo for actions,
 * and colour otherwise reserved for status. Amber means "act soon", red means
 * "late or short", green means money in or a healthy animal. Nothing else is
 * coloured, so those three always mean something.
 */
const light = {
  bg: '#F6F7F9',
  card: '#FFFFFF',
  raised: '#FFFFFF',
  sunk: '#F1F3F6',
  text: '#101828',
  muted: '#525C6E',
  faint: '#8A93A5',
  border: '#E4E7EC',
  strong: '#D0D5DD',
  primary: '#3043C4',
  primaryText: '#FFFFFF',
  soft: '#EEF0FB',
  accent: '#D97706',
  accentSoft: '#FEF4E2',
  accentText: '#93460A',
  warn: '#B45309',
  warnSoft: '#FEF4E2',
  danger: '#D92D20',
  dangerSoft: '#FEECEB',
  ok: '#067647',
  okSoft: '#E7F6EC',
  income: '#067647',
  expense: '#D92D20',
  shadow: 'rgba(16, 24, 40, 0.06)',
  overlay: 'rgba(16, 24, 40, 0.5)',
}

const dark: typeof light = {
  bg: '#0C0E12',
  card: '#13161C',
  raised: '#181C23',
  sunk: '#10131A',
  text: '#E8EAEE',
  muted: '#A0A8B8',
  faint: '#6C7486',
  border: '#232833',
  strong: '#313847',
  primary: '#8A98FF',
  primaryText: '#0C0E12',
  soft: '#1B2040',
  accent: '#F5A524',
  accentSoft: '#2A2111',
  accentText: '#F8C46B',
  warn: '#F5A524',
  warnSoft: '#2A2111',
  danger: '#F97066',
  dangerSoft: '#3A1513',
  ok: '#47CD89',
  okSoft: '#0E2A1D',
  income: '#47CD89',
  expense: '#F97066',
  shadow: 'rgba(0, 0, 0, 0.4)',
  overlay: 'rgba(0, 0, 0, 0.6)',
}

/**
 * Android app mode: Material Design 3. The Android build follows M3 (colour roles, top app bar, navigation
 * bar, ripples, M3 shapes); iOS and the web keep the look above. On the web `?app=android` previews it.
 * The roles come from the shared Kolam M3 kit's generator for the app's indigo, so they match the
 * Kolam web apps' Android look: node -e "require('kolam-design-system/m3/kolam-m3.js').scheme('#3043C4')".
 */
export const M3 =
  Platform.OS === 'android' ||
  (Platform.OS === 'web' && typeof location !== 'undefined' && /[?&]app=android\b/.test(location.search))

const m3Light = {
  primary: '#424ed1',
  onPrimary: '#ffffff',
  primaryContainer: '#e5deff',
  onPrimaryContainer: '#1437b5',
  secondaryContainer: '#e5deff',
  onSecondaryContainer: '#48435f',
  surface: '#faf8ff',
  onSurface: '#1c1b21',
  onSurfaceVariant: '#484554',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f4f2fc',
  surfaceContainer: '#efedf6',
  surfaceContainerHigh: '#e9e7f0',
  surfaceContainerHighest: '#e3e1eb',
  outline: '#787586',
  outlineVariant: '#c8c4d7',
  inverseSurface: '#312f37',
  inverseOnSurface: '#f2eff9',
  inversePrimary: '#c9bfff',
  error: '#b4271f',
  errorContainer: '#ffdad3',
  onErrorContainer: '#93000b',
}
const m3Dark = {
  primary: '#c9bfff',
  onPrimary: '#002485',
  primaryContainer: '#1437b5',
  onPrimaryContainer: '#e5deff',
  secondaryContainer: '#48435f',
  onSecondaryContainer: '#e5deff',
  surface: '#141219',
  onSurface: '#e3e1eb',
  onSurfaceVariant: '#c8c4d7',
  surfaceContainerLowest: '#0f0d15',
  surfaceContainerLow: '#1c1b21',
  surfaceContainer: '#201f25',
  surfaceContainerHigh: '#2a2930',
  surfaceContainerHighest: '#35343b',
  outline: '#928ea0',
  outlineVariant: '#484554',
  inverseSurface: '#e3e1eb',
  inverseOnSurface: '#312f37',
  inversePrimary: '#424ed1',
  error: '#ffb4a5',
  errorContainer: '#93000b',
  onErrorContainer: '#ffdad3',
}

export type M3Roles = typeof m3Light

/** The app's palette with M3 roles in its slots; status colours (amber, red, green) keep their meaning. */
const fromM3 = (base: typeof light, r: M3Roles, isDark: boolean) => ({
  ...base,
  bg: r.surface,
  card: r.surfaceContainerLow,
  raised: r.surfaceContainerHigh,
  sunk: r.surfaceContainerHighest,
  text: r.onSurface,
  muted: r.onSurfaceVariant,
  faint: r.outline,
  border: r.outlineVariant,
  strong: r.outline,
  primary: r.primary,
  primaryText: r.onPrimary,
  soft: r.secondaryContainer,
  overlay: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.32)',
  m3: r,
})

export type Theme = typeof light & { m3?: M3Roles }

const m3LightTheme: Theme = fromM3(light, m3Light, false)
const m3DarkTheme: Theme = fromM3(dark, m3Dark, true)

export function useTheme(): Theme {
  const darkMode = useColorScheme() === 'dark'
  if (M3) return darkMode ? m3DarkTheme : m3LightTheme
  return darkMode ? dark : light
}

/** Android ripple for a Pressable (M3 state layer); nothing on iOS and the web. */
export const ripple = (t: Theme, borderless = false, color?: string) =>
  M3 && Platform.OS === 'android' ? { android_ripple: { color: color ?? (t.m3 ? t.m3.onSurface + '1f' : 'rgba(0,0,0,0.12)'), borderless, foreground: true } } : {}

/** Sidebar layout from this width up; bottom tabs below it. */
export const WIDE = 900

export function useWide() {
  return useWindowDimensions().width >= WIDE
}

/**
 * Inter, one file per weight: React Native picks fonts by family name, not by
 * fontWeight, so text asks for the family that matches its weight.
 */
export const FONT = {
  400: 'Inter_400Regular',
  500: 'Inter_500Medium',
  600: 'Inter_600SemiBold',
  700: 'Inter_700Bold',
} as const

export type Weight = keyof typeof FONT

export function font(weight: Weight | string | number = 400) {
  const w = (Number(weight) || 400) as Weight
  return { fontFamily: FONT[w] ?? FONT[400], fontWeight: String(w) as any }
}

/** Numbers that line up in columns. */
export const tabular = { fontVariant: ['tabular-nums' as const] }

/**
 * Species keep one quiet colour each, used as an icon tint and a dot.
 * The icon set has no goat, so goats borrow the sheep silhouette; the label
 * always sits beside it.
 */
export const SPECIES = [
  { key: 'goat', label: 'Goats', one: 'Goat', icon: 'sheep', color: '#B4690E' },
  { key: 'cow', label: 'Cows', one: 'Cow', icon: 'cow', color: '#2E6BD8' },
  { key: 'chicken', label: 'Chickens', one: 'Chicken', icon: 'turkey', color: '#0E8A80' },
] as const

export const speciesOf = (s?: string) => SPECIES.find((x) => x.key === s)

export const money = (n: number) =>
  '₹' + (Math.round(n * 100) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })

export const compactMoney = (n: number) => {
  const a = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  if (a >= 100000) return `${sign}₹${(a / 100000).toFixed(a >= 1000000 ? 0 : 1)}L`
  if (a >= 1000) return `${sign}₹${(a / 1000).toFixed(a >= 10000 ? 0 : 1)}k`
  return `${sign}₹${Math.round(a)}`
}

export const today = () => new Date().toISOString().slice(0, 10)

export const niceDate = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  const days = Math.round((d.getTime() - new Date(`${today()}T00:00:00`).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === -1) return 'Yesterday'
  if (days === 1) return 'Tomorrow'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) })
}
