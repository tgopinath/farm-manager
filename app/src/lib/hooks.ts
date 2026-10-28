import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { api, Rec, Summary } from './api'
import { scheduleReminders } from './notify'

/** Loads whenever the screen comes into focus, so edits elsewhere show up. */
function useLoader<T>(load: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setData(await load())
      setError(null)
    } catch (e: any) {
      setError(e?.message ?? 'Could not reach the server')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFocusEffect(useCallback(() => { refresh() }, [refresh]))
  return { data, error, loading, refresh }
}

export function useCollection(collection: string) {
  return useLoader<Rec[]>(() => api.list(collection), [])
}

export function useSummary() {
  return useLoader<Summary | null>(async () => {
    const s = await api.summary()
    scheduleReminders(s).catch(() => {})
    return s
  }, null)
}
