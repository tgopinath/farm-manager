/**
 * One form for every kind of record. The fields come from lib/schema.ts;
 * any query parameter that names a field pre-fills it (e.g. ?type=income).
 */
import { useEffect, useState } from 'react'
import { Alert, Platform, View } from 'react-native'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { Button, Card, Chip, Input, Row, Screen, T, useToast } from '../../components/ui'
import { api, Rec } from '../../lib/api'
import { NUMBER_FIELDS, SCHEMAS, type Field } from '../../lib/schema'
import { speciesEmoji, today, useTheme } from '../../lib/theme'

const yesterday = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10)

function confirm(message: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(message))
  return new Promise((resolve) =>
    Alert.alert(message, undefined, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
    ]),
  )
}

const refLabel = (r: Rec) => (r.species ? `${speciesEmoji(r.species)} ` : '') + (r.name || r.tag || r.title || 'Unnamed')

export default function EditRecord() {
  const t = useTheme()
  const { collection, id, ...prefill } = useLocalSearchParams<Record<string, string>>()
  const schema = SCHEMAS[collection]
  const toast = useToast()
  const [values, setValues] = useState<Record<string, string>>({})
  const [refs, setRefs] = useState<Record<string, Rec[]>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!schema) return
    const start: Record<string, string> = { ...(schema.defaults ?? {}) }
    for (const f of schema.fields) {
      if (f.type === 'date' && f.required) start[f.key] = today()
      if (prefill[f.key]) start[f.key] = String(prefill[f.key])
    }
    setValues(start)
    if (id) {
      api.list(collection).then((rows) => {
        const r = rows.find((x) => x.id === id)
        if (r) setValues(Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v == null ? '' : String(v)])))
      }).catch((e) => setError(e.message))
    }
    for (const f of schema.fields) {
      if (f.type === 'ref' && f.ref) api.list(f.ref).then((rows) => setRefs((m) => ({ ...m, [f.ref!]: rows }))).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection, id])

  if (!schema) return <Screen><T>Unknown record type.</T></Screen>

  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }))

  async function save() {
    const missing = schema.fields.filter((f) => f.required && !String(values[f.key] ?? '').trim())
    if (missing.length) return setError(`Please fill in: ${missing.map((f) => f.label).join(', ')}`)
    const body: Record<string, any> = {}
    for (const f of schema.fields) {
      const raw = String(values[f.key] ?? '').trim()
      body[f.key] = NUMBER_FIELDS.has(f.key) && raw !== '' ? Number(raw) : raw
    }
    setBusy(true)
    setError(null)
    try {
      if (id) await api.update(collection, id, body)
      else await api.create(collection, body)
      toast(id ? 'Changes saved' : `${collection === 'transactions' ? (body.type === 'income' ? 'Income' : 'Expense') : schema.title} added`)
      router.back()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!id || !(await confirm(`Delete this ${schema.title.toLowerCase()}?`))) return
    setBusy(true)
    try {
      await api.remove(collection, id)
      toast(`${schema.title} deleted`)
      router.back()
    } catch (e: any) {
      setError(e.message)
      setBusy(false)
    }
  }

  function field(f: Field) {
    const v = values[f.key] ?? ''
    const label = f.label + (f.required ? ' *' : '')
    if (f.type === 'select' || f.type === 'ref') {
      const options = f.type === 'select'
        ? f.options ?? []
        : (refs[f.ref!] ?? []).filter((r) => r.status !== 'sold' && r.status !== 'dead').map((r) => ({ value: r.id, label: refLabel(r) }))
      return (
        <View key={f.key} style={{ marginBottom: 14 }}>
          <T size={14} bold style={{ marginBottom: 8 }}>{label}</T>
          <Row>
            {!f.required ? <Chip label="None" active={!v} onPress={() => set(f.key, '')} /> : null}
            {options.map((o) => <Chip key={o.value} label={o.label} active={v === o.value} onPress={() => set(f.key, o.value)} />)}
            {f.type === 'ref' && options.length === 0 ? <T muted size={13}>Nothing added yet</T> : null}
          </Row>
          {f.help ? <T muted size={12.5} style={{ marginTop: 6 }}>{f.help}</T> : null}
        </View>
      )
    }
    if (f.type === 'date') {
      return (
        <View key={f.key}>
          <Input label={label} value={v} onChangeText={(x) => set(f.key, x)} placeholder="YYYY-MM-DD" help={f.help} autoCapitalize="none" />
          <View style={{ marginTop: -8, marginBottom: 18 }}>
            <Row gap={6}>
              <Chip label="Today" active={v === today()} onPress={() => set(f.key, today())} />
              <Chip label="Yesterday" active={v === yesterday()} onPress={() => set(f.key, yesterday())} />
            </Row>
          </View>
        </View>
      )
    }
    return (
      <Input
        key={f.key}
        label={label}
        value={v}
        onChangeText={(x) => set(f.key, x)}
        placeholder={f.placeholder}
        help={f.help}
        prefix={/(amount|Balance|Cost|cost)$/.test(f.key) ? '₹' : undefined}
        multiline={f.type === 'textarea'}
        keyboardType={f.type === 'number' ? 'decimal-pad' : 'default'}
        autoCapitalize={f.key === 'url' ? 'none' : 'sentences'}
        autoCorrect={f.key !== 'url'}
      />
    )
  }

  return (
    <Screen max={640}>
      <Stack.Screen options={{ title: `${id ? 'Edit' : 'New'} ${schema.title.toLowerCase()}` }} />
      <Card style={{ padding: 20, paddingBottom: 4, marginBottom: 16 }}>
        {schema.fields.map(field)}
      </Card>
      {error ? <T color={t.danger} style={{ marginBottom: 12 }}>{error}</T> : null}
      <Button full title={id ? 'Save changes' : `Add ${schema.title.toLowerCase()}`} icon={id ? 'checkmark' : 'add'} busy={busy} onPress={save} />
      {id ? <View style={{ marginTop: 10 }}><Button full kind="danger" icon="trash-outline" title={`Delete ${schema.title.toLowerCase()}`} onPress={remove} disabled={busy} /></View> : null}
    </Screen>
  )
}
