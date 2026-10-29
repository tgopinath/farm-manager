import { useColorScheme, useWindowDimensions } from 'react-native'

/**
 * Indigo and marigold: the dye crop and the flower that grow at the edge of
 * many Indian farms. Indigo carries every action; marigold is the one warm
 * note, saved for things that need attention. Red and green appear only on
 * money and health status, never as decoration.
 */
const light = {
  bg: '#F6F7FB',
  card: '#FFFFFF',
  raised: '#FFFFFF',
  sunk: '#EEF0F7',
  text: '#151A33',
  muted: '#5D6483',
  faint: '#8E94AE',
  border: '#E3E6F0',
  primary: '#3046C5',
  primaryText: '#FFFFFF',
  soft: '#E8EBFB',
  accent: '#F2A30F',
  accentSoft: '#FFF3D9',
  accentText: '#8A5600',
  warn: '#B86E00',
  warnSoft: '#FFF3D9',
  danger: '#D23F36',
  dangerSoft: '#FDE8E6',
  ok: '#13875A',
  okSoft: '#E1F5EC',
  income: '#13875A',
  expense: '#D23F36',
  shadow: 'rgba(21, 26, 51, 0.08)',
  overlay: 'rgba(21, 26, 51, 0.45)',
}

const dark: typeof light = {
  bg: '#0D1020',
  card: '#161A2E',
  raised: '#1D2239',
  sunk: '#11152A',
  text: '#ECEEF8',
  muted: '#A3A9C6',
  faint: '#6E7494',
  border: '#272C47',
  primary: '#8C9BFF',
  primaryText: '#0D1020',
  soft: '#20264A',
  accent: '#FFBE3D',
  accentSoft: '#3A2C10',
  accentText: '#FFD27A',
  warn: '#FFBE3D',
  warnSoft: '#3A2C10',
  danger: '#FF7A70',
  dangerSoft: '#3D1A1A',
  ok: '#4ED39B',
  okSoft: '#123326',
  income: '#4ED39B',
  expense: '#FF7A70',
  shadow: 'rgba(0, 0, 0, 0.35)',
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

export const FONT = {
  display: 'BricolageGrotesque_700Bold',
  displaySemi: 'BricolageGrotesque_600SemiBold',
}

/** Each species keeps its own colour everywhere it appears. */
export const SPECIES = [
  { key: 'goat', label: 'Goats', one: 'Goat', emoji: '🐐', color: '#E39B0B', soft: '#FFF1D6', softDark: '#3A2C10' },
  { key: 'cow', label: 'Cows', one: 'Cow', emoji: '🐄', color: '#2F7DDB', soft: '#E2EEFD', softDark: '#15284A' },
  { key: 'chicken', label: 'Chickens', one: 'Chicken', emoji: '🐔', color: '#0E9E93', soft: '#DDF5F2', softDark: '#0F302D' },
] as const

export const speciesOf = (s?: string) => SPECIES.find((x) => x.key === s)
export const speciesEmoji = (s?: string) => speciesOf(s)?.emoji ?? '🐾'

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
