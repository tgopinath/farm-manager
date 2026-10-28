import { View } from 'react-native'
import { Card, T } from './ui'
import { useTheme } from '../lib/theme'
import type { Assessment } from '../lib/api'

const STATUS: Record<Assessment['status'], { label: string; tone: 'ok' | 'warn' | 'danger' }> = {
  looks_healthy: { label: 'Looks healthy', tone: 'ok' },
  possible_concern: { label: 'Possible concern', tone: 'warn' },
  likely_sick: { label: 'Likely sick', tone: 'danger' },
  urgent: { label: 'Urgent — call a vet', tone: 'danger' },
}

export function AssessmentCard({ result }: { result: Assessment }) {
  const t = useTheme()
  const s = STATUS[result.status] ?? STATUS.possible_concern
  const fg = s.tone === 'ok' ? t.ok : s.tone === 'warn' ? t.warn : t.danger
  const bg = s.tone === 'ok' ? t.soft : s.tone === 'warn' ? t.warnSoft : t.dangerSoft

  return (
    <Card style={{ borderLeftWidth: 4, borderLeftColor: fg }}>
      <View style={{ backgroundColor: bg, borderRadius: 8, padding: 10, marginBottom: 10 }}>
        <T bold size={17} color={fg}>{s.label}</T>
        <T size={12} color={fg}>Confidence: {result.confidence}{result.animalVisible ? '' : ' · no animal clearly visible'}</T>
      </View>
      <T>{result.summary}</T>

      {result.signs.length ? (
        <>
          <T bold style={{ marginTop: 12 }}>What it noticed</T>
          {result.signs.map((s, i) => <T key={i} size={14}>• {s.sign} <T muted size={13}>({s.where})</T></T>)}
        </>
      ) : null}

      {result.possibleConditions.length ? (
        <>
          <T bold style={{ marginTop: 12 }}>Could be</T>
          <T size={14}>{result.possibleConditions.join(', ')}</T>
        </>
      ) : null}

      {result.advice.length ? (
        <>
          <T bold style={{ marginTop: 12 }}>What to do</T>
          {result.advice.map((a, i) => <T key={i} size={14}>{i + 1}. {a}</T>)}
        </>
      ) : null}

      {result.callVet ? <T bold color={t.danger} style={{ marginTop: 12 }}>📞 Contact your veterinarian.</T> : null}
      <T muted size={11} style={{ marginTop: 12 }}>
        This is an AI screening from one photo, not a diagnosis. Always confirm with a vet before treating.
      </T>
    </Card>
  )
}
