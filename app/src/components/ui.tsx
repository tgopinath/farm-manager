import React from 'react'
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native'
import { useTheme } from '../lib/theme'

export function Screen({ children, refreshing, onRefresh }: {
  children: React.ReactNode
  refreshing?: boolean
  onRefresh?: () => void
}) {
  const t = useTheme()
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={styles.screen}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  )
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const t = useTheme()
  if (!onPress) return <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }, style]}>{children}</View>
  // A pressable card sits in rows of tiles, so the wrapper takes the flex sizing.
  const { flex, flexGrow, flexBasis, flexShrink, ...rest } = StyleSheet.flatten(style) ?? {}
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flex, flexGrow, flexBasis, flexShrink, opacity: pressed ? 0.7 : 1 })}>
      <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }, flexGrow ? { flexGrow: 1 } : null, rest]}>{children}</View>
    </Pressable>
  )
}

export function H({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  const t = useTheme()
  return (
    <View style={styles.hRow}>
      <Text style={[styles.h, { color: t.text }]}>{children}</Text>
      {right}
    </View>
  )
}

export function T({ children, muted, size = 15, bold, color, style, numberOfLines }: {
  children: React.ReactNode; muted?: boolean; size?: number; bold?: boolean; color?: string
  style?: any; numberOfLines?: number
}) {
  const t = useTheme()
  return (
    <Text numberOfLines={numberOfLines} style={[{ color: color ?? (muted ? t.muted : t.text), fontSize: size, fontWeight: bold ? '700' : '400' }, style]}>
      {children}
    </Text>
  )
}

export function Button({ title, onPress, kind = 'primary', disabled, busy, small }: {
  title: string; onPress: () => void; kind?: 'primary' | 'ghost' | 'danger'; disabled?: boolean; busy?: boolean; small?: boolean
}) {
  const t = useTheme()
  const bg = kind === 'primary' ? t.primary : kind === 'danger' ? t.dangerSoft : t.soft
  const fg = kind === 'primary' ? t.primaryText : kind === 'danger' ? t.danger : t.primary
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [styles.btn, small && styles.btnSmall, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }]}
    >
      {busy ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontWeight: '700', fontSize: small ? 13 : 15 }}>{title}</Text>}
    </Pressable>
  )
}

export function Chip({ label, active, onPress, tone }: { label: string; active?: boolean; onPress?: () => void; tone?: 'warn' | 'danger' | 'ok' }) {
  const t = useTheme()
  const toneBg = tone === 'warn' ? t.warnSoft : tone === 'danger' ? t.dangerSoft : tone === 'ok' ? t.soft : null
  const toneFg = tone === 'warn' ? t.warn : tone === 'danger' ? t.danger : tone === 'ok' ? t.ok : null
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.chip, {
        backgroundColor: active ? t.primary : toneBg ?? t.card,
        borderColor: active ? t.primary : toneBg ?? t.border,
      }]}
    >
      <Text style={{ color: active ? t.primaryText : toneFg ?? t.text, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  )
}

export function Input(props: TextInputProps & { label?: string; help?: string }) {
  const t = useTheme()
  const { label, help, style, ...rest } = props
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={[styles.label, { color: t.muted }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={t.muted}
        style={[styles.input, { color: t.text, backgroundColor: t.card, borderColor: t.border }, rest.multiline && { minHeight: 80, textAlignVertical: 'top' }, style]}
        {...rest}
      />
      {help ? <Text style={{ color: t.muted, fontSize: 12, marginTop: 4 }}>{help}</Text> : null}
    </View>
  )
}

export function Empty({ title, detail, action }: { title: string; detail?: string; action?: React.ReactNode }) {
  const t = useTheme()
  return (
    <View style={[styles.empty, { borderColor: t.border }]}>
      <Text style={{ color: t.text, fontWeight: '700', fontSize: 16, marginBottom: 4 }}>{title}</Text>
      {detail ? <Text style={{ color: t.muted, textAlign: 'center', marginBottom: 12 }}>{detail}</Text> : null}
      {action}
    </View>
  )
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useTheme()
  return (
    <Card style={{ backgroundColor: t.dangerSoft, borderColor: t.dangerSoft }}>
      <T color={t.danger} bold>Can't reach the farm server</T>
      <T color={t.danger} size={13} style={{ marginTop: 4 }}>{message}. Check the server address in Settings.</T>
      {onRetry ? <View style={{ marginTop: 10, alignSelf: 'flex-start' }}><Button small kind="danger" title="Try again" onPress={onRetry} /></View> : null}
    </Card>
  )
}

export function Row({ children, gap = 8, style }: { children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap, alignItems: 'center' }, style]}>{children}</View>
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40, alignItems: 'center' },
  inner: { width: '100%', maxWidth: 760 },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginBottom: 10 },
  hRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 8 },
  h: { fontSize: 18, fontWeight: '700' },
  btn: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  btnSmall: { paddingVertical: 7, paddingHorizontal: 12, minHeight: 34 },
  chip: { borderRadius: 999, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, padding: 20, alignItems: 'center' },
})
