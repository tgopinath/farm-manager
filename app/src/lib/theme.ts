import { useColorScheme, useWindowDimensions } from 'react-native'

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

export type Theme = typeof light

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light
}

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
