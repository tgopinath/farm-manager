import { Platform } from 'react-native'
import { useEffect, useState } from 'react'
import { Button, Card, Input, Screen, T } from '../components/ui'
import { api, DEMO, getSettings, saveSettings } from '../lib/api'
import { demo } from '../lib/demo'
import { useTheme } from '../lib/theme'

export default function Settings() {
  const t = useTheme()
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getSettings().then((s) => { setUrl(s.url); setKey(s.key) })
  }, [])

  async function test() {
    setBusy(true)
    try {
      await saveSettings(url, key)
      const h = await api.status()
      await api.summary() // fails with 401 when the key is wrong
      setStatus({ ok: true, text: `Connected · data stored in ${h.storage === 'catalyst' ? 'Zoho Catalyst' : 'a local file'} · AI health check ${h.ai ? 'on' : 'off'}` })
    } catch (e: any) {
      setStatus({ ok: false, text: e.message })
    } finally {
      setBusy(false)
    }
  }

  if (DEMO) {
    return (
      <Screen max={760}>
        <Card>
          <T bold>Online demo</T>
          <T muted size={14} style={{ marginVertical: 8 }}>
            {Platform.OS === 'web'
              ? 'This copy of Farm Manager runs entirely in your browser with a sample farm. Changes are saved on this device only.'
              : 'This copy of Farm Manager runs on your phone with a sample farm. Changes last until you close the app.'}{' '}The full app connects to a farm server, which adds shared data, the AI health check and phone reminders.
          </T>
          <Button kind="ghost" title="Reset the sample farm" onPress={() => { demo.reset(); if (typeof window !== 'undefined') window.location.reload() }} />
        </Card>
      </Screen>
    )
  }

  return (
    <Screen max={760}>
      <Input
        label="Farm server address"
        value={url}
        onChangeText={setUrl}
        placeholder="https://your-farm.catalystappsail.in"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        help="Leave empty in the web app to use the address it was opened from."
      />
      <Input
        label="Farm access key"
        value={key}
        onChangeText={setKey}
        placeholder="Only if the server has one set"
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
      />
      <Button title="Save and test connection" busy={busy} onPress={test} />
      {status ? (
        <Card style={{ marginTop: 12, backgroundColor: status.ok ? t.soft : t.dangerSoft, borderColor: 'transparent' }}>
          <T color={status.ok ? t.ok : t.danger}>{status.text}</T>
        </Card>
      ) : null}
      <T muted size={12} style={{ marginTop: 20 }}>
        Reminders for vaccinations, maintenance, low feed and low account balances are scheduled on this phone every time you open the Farm tab.
      </T>
    </Screen>
  )
}
