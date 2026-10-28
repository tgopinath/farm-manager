import { useColorScheme } from 'react-native'

const light = {
  bg: '#F5F3EC',
  card: '#FFFFFF',
  text: '#1D2A1F',
  muted: '#62705F',
  border: '#E2DED2',
  primary: '#2F6B3A',
  primaryText: '#FFFFFF',
  soft: '#E8F0E3',
  warn: '#B7791F',
  warnSoft: '#FBF0DC',
  danger: '#B83A2E',
  dangerSoft: '#F9E3E0',
  ok: '#2F7D4A',
  income: '#2F7D4A',
  expense: '#B83A2E',
}

const dark: typeof light = {
  bg: '#121611',
  card: '#1B211A',
  text: '#E8EDE4',
  muted: '#9AA896',
  border: '#2C352A',
  primary: '#6FB57C',
  primaryText: '#0E140D',
  soft: '#223022',
  warn: '#E0A84A',
  warnSoft: '#3A2F1A',
  danger: '#F07A6C',
  dangerSoft: '#3D211E',
  ok: '#6FC48A',
  income: '#6FC48A',
  expense: '#F07A6C',
}

export type Theme = typeof light

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light
}

export const SPECIES = [
  { key: 'goat', label: 'Goats', emoji: '🐐' },
  { key: 'cow', label: 'Cows', emoji: '🐄' },
  { key: 'chicken', label: 'Chickens', emoji: '🐔' },
] as const

export const speciesEmoji = (s?: string) => SPECIES.find((x) => x.key === s)?.emoji ?? '🐾'

export const money = (n: number) =>
  '₹' + (Math.round(n * 100) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })

export const today = () => new Date().toISOString().slice(0, 10)
