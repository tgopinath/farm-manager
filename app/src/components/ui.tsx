import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, Animated, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text,
  TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { FONT, useTheme, useWide } from '../lib/theme'

export type IconName = React.ComponentProps<typeof Ionicons>['name']
type PressState = { pressed: boolean; hovered?: boolean; focused?: boolean }
const web = Platform.OS === 'web'

/* ------------------------------------------------------------------ text */

export function T({ children, muted, faint, size = 15, weight, bold, color, style, numberOfLines, display }: {
  children: React.ReactNode; muted?: boolean; faint?: boolean; size?: number; bold?: boolean; color?: string
  weight?: TextStyle['fontWeight']; style?: StyleProp<TextStyle>; numberOfLines?: number; display?: boolean
}) {
  const t = useTheme()
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{
        color: color ?? (faint ? t.faint : muted ? t.muted : t.text),
        fontSize: size,
        lineHeight: Math.round(size * (display ? 1.15 : 1.45)),
        fontWeight: display ? undefined : weight ?? (bold ? '600' : '400'),
        fontFamily: display ? FONT.display : undefined,
        letterSpacing: display ? -0.4 : 0,
      }, style]}
    >
      {children}
    </Text>
  )
}

/* ----------------------------------------------------------------- layout */

/**
 * A scrolling page. Tab screens pass a title: it is drawn large in the page
 * itself, the way phone apps and desktop dashboards both do it.
 */
export function Screen({ children, title, subtitle, action, refreshing, onRefresh, max = 1120, fab }: {
  children: React.ReactNode; title?: string; subtitle?: React.ReactNode; action?: React.ReactNode
  refreshing?: boolean; onRefresh?: () => void; max?: number; fab?: React.ReactNode
}) {
  const t = useTheme()
  const wide = useWide()
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: wide ? 40 : 16,
          paddingTop: title ? (wide ? 36 : insets.top + 12) : 16,
          paddingBottom: 120,
          alignItems: 'center',
        }}
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={t.primary} /> : undefined}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: '100%', maxWidth: max }}>
          {title ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: wide ? 28 : 18, flexWrap: 'wrap' }}>
              <View style={{ flexShrink: 1 }}>
                <T display size={wide ? 36 : 30}>{title}</T>
                {subtitle ? <View style={{ marginTop: 4 }}>{typeof subtitle === 'string' ? <T muted size={15}>{subtitle}</T> : subtitle}</View> : null}
              </View>
              {action}
            </View>
          ) : null}
          {children}
        </View>
      </ScrollView>
      {fab}
    </View>
  )
}

export function Row({ children, gap = 8, style, wrap = true, align = 'center' }: {
  children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle>; wrap?: boolean; align?: ViewStyle['alignItems']
}) {
  return <View style={[{ flexDirection: 'row', flexWrap: wrap ? 'wrap' : 'nowrap', gap, alignItems: align }, style]}>{children}</View>
}

/** Two columns on a wide screen, stacked on a phone. */
export function Columns({ children, ratio = [1.35, 1], gap = 28 }: { children: [React.ReactNode, React.ReactNode]; ratio?: [number, number]; gap?: number }) {
  const wide = useWide()
  if (!wide) return <View>{children}</View>
  return (
    <View style={{ flexDirection: 'row', gap, alignItems: 'flex-start' }}>
      <View style={{ flex: ratio[0], minWidth: 0 }}>{children[0]}</View>
      <View style={{ flex: ratio[1], minWidth: 0 }}>{children[1]}</View>
    </View>
  )
}

export function Section({ title, action, children, style }: { title: string; action?: React.ReactNode; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ marginBottom: 28 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, minHeight: 32 }}>
        <T display size={19}>{title}</T>
        {action}
      </View>
      {children}
    </View>
  )
}

/* ------------------------------------------------------------------ cards */

export function Card({ children, style, onPress, padded = true, accessibilityLabel }: {
  children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; padded?: boolean; accessibilityLabel?: string
}) {
  const t = useTheme()
  const base: ViewStyle = {
    backgroundColor: t.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: t.border,
    padding: padded ? 16 : 0,
  }
  if (!onPress) return <View style={[base, style]}>{children}</View>
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={(s) => {
        const { pressed, hovered } = s as PressState
        return [base, style, {
          borderColor: hovered ? t.primary + '55' : t.border,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          ...(web ? { transitionDuration: '140ms', transitionProperty: 'border-color, transform, box-shadow', cursor: 'pointer',
            boxShadow: hovered ? '0 10px 28px -16px rgba(21,26,51,0.35)' : 'none' } as any : {}),
        }]
      }}
    >
      {children}
    </Pressable>
  )
}

/** Rows inside one card, separated by hairlines: lists that read as one object. */
export function List({ children }: { children: React.ReactNode }) {
  const t = useTheme()
  const items = React.Children.toArray(children).filter(Boolean)
  return (
    <View style={{ backgroundColor: t.card, borderRadius: 18, borderWidth: 1, borderColor: t.border, overflow: 'hidden' }}>
      {items.map((c, i) => (
        <View key={i} style={i ? { borderTopWidth: 1, borderTopColor: t.border } : null}>{c}</View>
      ))}
    </View>
  )
}

/**
 * A row in a List. `trailing` sits beside the tappable area rather than
 * inside it, so a row can open a record and still carry its own button.
 */
export function ListRow({ children, onPress, trailing, accessibilityLabel }: {
  children: React.ReactNode; onPress?: () => void; trailing?: React.ReactNode; accessibilityLabel?: string
}) {
  const t = useTheme()
  const body = !onPress ? <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 14 }}>{children}</View> : (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={(s) => {
        const { pressed, hovered } = s as PressState
        return { flex: 1, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: pressed ? t.sunk : hovered ? t.bg : 'transparent', ...(web ? { cursor: 'pointer' } as any : {}) }
      }}
    >
      {children}
    </Pressable>
  )
  if (!trailing) return body
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {body}
      <View style={{ paddingRight: 16, paddingLeft: 4 }}>{trailing}</View>
    </View>
  )
}

/* ---------------------------------------------------------------- buttons */

type Kind = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'

export function Button({ title, onPress, kind = 'primary', disabled, busy, small, icon, full, accessibilityLabel }: {
  title?: string; onPress: () => void; kind?: Kind; disabled?: boolean; busy?: boolean; small?: boolean
  icon?: IconName; full?: boolean; accessibilityLabel?: string
}) {
  const t = useTheme()
  const palette: Record<Kind, [string, string]> = {
    primary: [t.primary, t.primaryText],
    secondary: [t.soft, t.primary],
    ghost: ['transparent', t.primary],
    danger: [t.dangerSoft, t.danger],
    accent: [t.accent, '#1F1600'],
  }
  const [bg, fg] = palette[kind]
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      disabled={disabled || busy}
      style={(s) => {
        const { pressed, hovered } = s as PressState
        return [{
          backgroundColor: bg,
          borderRadius: small ? 10 : 12,
          paddingVertical: small ? 7 : 12,
          paddingHorizontal: title ? (small ? 12 : 18) : (small ? 8 : 12),
          minHeight: small ? 34 : 46,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        } as ViewStyle, hovered && !disabled ? { filter: 'brightness(0.95)' } as any : null,
        web ? { transitionDuration: '120ms', cursor: disabled ? 'not-allowed' : 'pointer' } as any : null]
      }}
    >
      {busy ? <ActivityIndicator color={fg} size="small" /> : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={fg} /> : null}
          {title ? <Text style={{ color: fg, fontWeight: '600', fontSize: small ? 13.5 : 15 }}>{title}</Text> : null}
        </>
      )}
    </Pressable>
  )
}

export function IconButton({ icon, onPress, label, color }: { icon: IconName; onPress: () => void; label: string; color?: string }) {
  const t = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={(s) => {
        const { pressed, hovered } = s as PressState
        return { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed || hovered ? t.sunk : 'transparent' }
      }}
    >
      <Ionicons name={icon} size={22} color={color ?? t.muted} />
    </Pressable>
  )
}

/** Filter pill. Selected is solid ink, so it never competes with indigo actions. */
export function Chip({ label, active, onPress, icon, count }: { label: string; active?: boolean; onPress?: () => void; icon?: string; count?: number }) {
  const t = useTheme()
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={(s) => {
        const { pressed, hovered } = s as PressState
        return [styles.chip, {
          backgroundColor: active ? t.text : pressed || hovered ? t.sunk : t.card,
          borderColor: active ? t.text : t.border,
        }, web ? { cursor: 'pointer', transitionDuration: '120ms' } as any : null]
      }}
    >
      {icon ? <Text style={{ fontSize: 14 }}>{icon}</Text> : null}
      <Text style={{ color: active ? t.bg : t.text, fontSize: 13.5, fontWeight: '600' }}>{label}</Text>
      {count !== undefined ? <Text style={{ color: active ? t.bg : t.faint, fontSize: 12.5, fontWeight: '600' }}>{count}</Text> : null}
    </Pressable>
  )
}

export type Tone = 'danger' | 'warn' | 'ok' | 'info' | 'neutral'

export function Badge({ label, tone = 'neutral', dot }: { label: string; tone?: Tone; dot?: boolean }) {
  const t = useTheme()
  const map: Record<Tone, [string, string]> = {
    danger: [t.dangerSoft, t.danger], warn: [t.warnSoft, t.warn], ok: [t.okSoft, t.ok],
    info: [t.soft, t.primary], neutral: [t.sunk, t.muted],
  }
  const [bg, fg] = map[tone]
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: bg, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start' }}>
      {dot ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: fg }} /> : null}
      <Text style={{ color: fg, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  )
}

/** A level bar: how full, coloured by how worried to be. */
export function Meter({ value, tone = 'info', height = 8 }: { value: number; tone?: Tone; height?: number }) {
  const t = useTheme()
  const fg = { danger: t.danger, warn: t.accent, ok: t.ok, info: t.primary, neutral: t.faint }[tone]
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: t.sunk, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(2, Math.min(100, value * 100))}%`, height, borderRadius: height / 2, backgroundColor: fg }} />
    </View>
  )
}

/* ------------------------------------------------------------------ forms */

export function Input(props: TextInputProps & { label?: string; help?: string; prefix?: string }) {
  const t = useTheme()
  const [focus, setFocus] = useState(false)
  const { label, help, prefix, style, onFocus, onBlur, ...rest } = props
  return (
    <View style={{ marginBottom: 18 }}>
      {label ? <Text style={[styles.label, { color: t.text }]}>{label}</Text> : null}
      <View style={[styles.inputWrap, { backgroundColor: t.card, borderColor: focus ? t.primary : t.border }, focus && web ? { boxShadow: `0 0 0 3px ${t.soft}` } as any : null]}>
        {prefix ? <Text style={{ color: t.muted, fontSize: 16, marginRight: 4 }}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={t.faint}
          onFocus={(e) => { setFocus(true); onFocus?.(e) }}
          onBlur={(e) => { setFocus(false); onBlur?.(e) }}
          style={[styles.input, { color: t.text }, rest.multiline && { minHeight: 84, textAlignVertical: 'top' }, web ? { outlineStyle: 'none' } as any : null, style]}
          {...rest}
        />
      </View>
      {help ? <Text style={{ color: t.muted, fontSize: 12.5, marginTop: 6 }}>{help}</Text> : null}
    </View>
  )
}

/* ---------------------------------------------------------------- states */

export function Empty({ icon = '🌾', title, detail, action }: { icon?: string; title: string; detail?: string; action?: React.ReactNode }) {
  const t = useTheme()
  return (
    <View style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.border, borderRadius: 18, padding: 28, alignItems: 'center', gap: 6 }}>
      <Text style={{ fontSize: 30 }}>{icon}</Text>
      <T display size={18} style={{ textAlign: 'center' }}>{title}</T>
      {detail ? <T muted size={14} style={{ textAlign: 'center', maxWidth: 420 }}>{detail}</T> : null}
      {action ? <View style={{ marginTop: 8 }}>{action}</View> : null}
    </View>
  )
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useTheme()
  return (
    <View style={{ backgroundColor: t.dangerSoft, borderRadius: 16, padding: 16, marginBottom: 20, gap: 4 }}>
      <T color={t.danger} bold>The farm server isn't answering</T>
      <T color={t.danger} size={13.5}>{message}. Check the server address in Settings.</T>
      {onRetry ? <View style={{ marginTop: 8 }}><Button small kind="danger" title="Try again" icon="refresh" onPress={onRetry} /></View> : null}
    </View>
  )
}

/* ----------------------------------------------------------------- toast */

type ToastMsg = { id: number; text: string; action?: { label: string; onPress: () => void } }
const ToastCtx = createContext<(text: string, action?: ToastMsg['action']) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

/** One message at a time, bottom centre, with an optional Undo. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const t = useTheme()
  const wide = useWide()
  const insets = useSafeAreaInsets()
  const [msg, setMsg] = useState<ToastMsg | null>(null)
  const anim = useRef(new Animated.Value(0)).current
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hide = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: !web }).start(() => setMsg(null))
  }, [anim])

  const show = useCallback((text: string, action?: ToastMsg['action']) => {
    if (timer.current) clearTimeout(timer.current)
    setMsg({ id: Date.now(), text, action })
    anim.setValue(0)
    Animated.spring(anim, { toValue: 1, useNativeDriver: !web, speed: 18, bounciness: 6 }).start()
    timer.current = setTimeout(hide, action ? 5000 : 2800)
  }, [anim, hide])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg ? (
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: 'absolute', left: 16, right: 16, bottom: (wide ? 28 : 92) + insets.bottom, alignItems: 'center',
            opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          }}
        >
          <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.text, borderRadius: 14, paddingVertical: 12, paddingLeft: 16, paddingRight: msg.action ? 8 : 16, maxWidth: 520 }}>
            <Ionicons name="checkmark-circle" size={18} color={t.bg} />
            <Text style={{ color: t.bg, fontSize: 14.5, flexShrink: 1 }}>{msg.text}</Text>
            {msg.action ? (
              <Pressable onPress={() => { msg.action!.onPress(); hide() }} accessibilityRole="button" style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                <Text style={{ color: t.accent, fontWeight: '700', fontSize: 14.5 }}>{msg.action.label}</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </ToastCtx.Provider>
  )
}

/* ----------------------------------------------------------------- sheet */

/** Bottom sheet on a phone, centred dialog on a wide screen. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const t = useTheme()
  const wide = useWide()
  const insets = useSafeAreaInsets()
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (open) Animated.spring(anim, { toValue: 1, useNativeDriver: !web, speed: 16, bounciness: 4 }).start()
    else anim.setValue(0)
  }, [open, anim])
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: t.overlay, justifyContent: wide ? 'center' : 'flex-end', alignItems: 'center' }} onPress={onClose} accessibilityLabel="Close">
        <Animated.View
          style={{
            width: '100%', maxWidth: wide ? 480 : undefined,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [wide ? 12 : 60, 0] }) }],
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{ backgroundColor: t.card, borderRadius: 24, borderBottomLeftRadius: wide ? 24 : 0, borderBottomRightRadius: wide ? 24 : 0, padding: 20, paddingBottom: 20 + (wide ? 0 : insets.bottom) }}
          >
            {!wide ? <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: t.border, alignSelf: 'center', marginBottom: 14 }} /> : null}
            <Row style={{ justifyContent: 'space-between', marginBottom: 12 }} wrap={false}>
              <T display size={20}>{title}</T>
              <IconButton icon="close" label="Close" onPress={onClose} />
            </Row>
            {children}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

/** Big round add button for phones. Wide screens put "Add" in the page header instead. */
export function Fab({ onPress, label = 'Add' }: { onPress: () => void; label?: string }) {
  const t = useTheme()
  const wide = useWide()
  if (wide) return null
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        position: 'absolute', right: 18, bottom: 18, width: 58, height: 58, borderRadius: 20,
        backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center',
        transform: [{ scale: pressed ? 0.94 : 1 }],
        shadowColor: '#1A2580', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6,
      })}
    >
      <Ionicons name="add" size={30} color={t.primaryText} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, paddingVertical: 7, paddingHorizontal: 13 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16 },
})
