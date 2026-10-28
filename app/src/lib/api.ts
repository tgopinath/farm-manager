/**
 * Talking to the Farm Manager server.
 *
 * The server address and the optional farm access key are kept on the device
 * and set on the Settings screen. Until they are, sensible defaults apply:
 * the web build talks to whoever served it, and a phone running the dev
 * build talks to port 4600 on the computer running Expo.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

export type Rec = { id: string; createdAt?: string; updatedAt?: string; [k: string]: any }

export type Reminder = {
  kind: 'vaccination' | 'feed' | 'stock' | 'balance' | 'maintenance' | 'health'
  level: 'overdue' | 'warning' | 'due'
  title: string
  detail: string
  date: string
  ref: { collection: string; id: string }
}

export type Summary = {
  today: string
  livestock: Record<string, { head: number; sick: number }>
  month: { month: string; income: number; expense: number; net: number; expenseByCategory: Record<string, number> }
  balances: { id: string; name: string; balance: number; minBalance: number }[]
  totalBalance: number
  reminders: Reminder[]
}

const URL_KEY = 'farm.serverUrl'
const KEY_KEY = 'farm.accessKey'

function defaultUrl() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && /:(8081|19006)$/.test(window.location.host)) return 'http://localhost:4600'
    return ''
  }
  const host = Constants.expoConfig?.hostUri?.split(':')[0]
  return host ? `http://${host}:4600` : ''
}

let cache: { url: string; key: string } | null = null

async function settings() {
  if (cache) return cache
  let url = ''
  let key = ''
  try {
    url = (await AsyncStorage.getItem(URL_KEY)) ?? ''
    key = (await AsyncStorage.getItem(KEY_KEY)) ?? ''
  } catch {}
  cache = { url: url || defaultUrl(), key }
  return cache
}

export async function getSettings() {
  return settings()
}

export async function saveSettings(url: string, key: string) {
  const clean = url.trim().replace(/\/+$/, '')
  await AsyncStorage.setItem(URL_KEY, clean)
  await AsyncStorage.setItem(KEY_KEY, key.trim())
  cache = { url: clean || defaultUrl(), key: key.trim() }
}

export async function request<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, key } = await settings()
  const res = await fetch(`${url}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(key ? { 'x-farm-key': key } : {}), ...init.headers },
  })
  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error ?? `Server said ${res.status}`)
  return body as T
}

export const api = {
  list: (c: string) => request<Rec[]>(`/${c}`),
  create: (c: string, data: object) => request<Rec>(`/${c}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (c: string, id: string, data: object) => request<Rec>(`/${c}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (c: string, id: string) => request<void>(`/${c}/${id}`, { method: 'DELETE' }),
  summary: () => request<Summary>('/summary'),
  status: () => request<{ ok: boolean; storage: string; ai: boolean; locked: boolean }>('/status'),
  diagnose: (body: { imageBase64: string; mediaType?: string; species?: string; notes?: string; animalId?: string }) =>
    request<{ result: Assessment; entry: Rec | null }>('/diagnose', { method: 'POST', body: JSON.stringify(body) }),
}

export type Assessment = {
  animalVisible: boolean
  species: string
  status: 'looks_healthy' | 'possible_concern' | 'likely_sick' | 'urgent'
  confidence: 'low' | 'medium' | 'high'
  signs: { sign: string; where: string }[]
  possibleConditions: string[]
  advice: string[]
  callVet: boolean
  summary: string
}
