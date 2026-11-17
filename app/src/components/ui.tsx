import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, Animated, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text,
  TextInput, View, useWindowDimensions, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { M3, font, ripple, speciesOf, tabular, useTheme, useWide } from '../lib/theme'

export type IconName = React.ComponentProps<typeof Ionicons>['name']
type PressState = { pressed: boolean; hovered?: boolean; focused?: boolean }
const web = Platform.OS === 'web'
const pointer = web ? ({ cursor: 'pointer' } as any) : null

/* ------------------------------------------------------------------ text */

export function T({ children, muted, faint, size = 14, weight, bold, color, style, numberOfLines, display, num }: {
  children: React.ReactNode; muted?: boolean; faint?: boolean; size?: number; bold?: boolean; color?: string
  weight?: 400 | 500 | 600 | 700; style?: StyleProp<TextStyle>; numberOfLines?: number
  /** Headings and big figures: semibold with tighter tracking. */
  display?: boolean
  /** Tabular figures, for amounts and counts that sit in columns. */
  num?: boolean
}) {
  const t = useTheme()
  const w = weight ?? (display ? 600 : bold ? 600 : 400)
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{
        color: color ?? (faint ? t.faint : muted ? t.muted : t.text),
        fontSize: size,
        lineHeight: Math.round(size * (display ? 1.2 : 1.45)),
        letterSpacing: size >= 20 ? -0.4 : size >= 16 ? -0.15 : 0,
        ...font(w),
      }, num ? tabular : null, style]}
    >
      {children}
    </Text>
  )
}

/* ------------------------------------------------------------------ icons */

/** A species, drawn as an icon in its own colour, optionally on a tinted square. */
export function SpeciesIcon({ species, size = 20, boxed = 0 }: { species?: string; size?: number; boxed?: number }) {
  const t = useTheme()
  const s = speciesOf(species)
  const icon = <MaterialCommunityIcons name={(s?.icon ?? 'paw') as any} size={size} color={s?.color ?? t.muted} />
  if (!boxed) return icon
  return (
    <View style={{ width: boxed, height: boxed, borderRadius: Math.round(boxed / 4), alignItems: 'center', justifyContent: 'center', backgroundColor: (s?.color ?? t.faint) + '17' }}>
      {icon}
    </View>
  )
}

/** A line icon on a tinted square, the leading mark of a row. */
export function IconTile({ icon, color, size = 36 }: { icon: IconName; color?: string; size?: number }) {
  const t = useTheme()
  const c = color ?? t.muted
  return (
    <View style={{ width: size, height: size, borderRadius: Math.round(size / 4), alignItems: 'center', justifyContent: 'center', backgroundColor: c + '17' }}>
      <Ionicons name={icon} size={Math.round(size * 0.5)} color={c} />
    </View>
  )
}

/* ----------------------------------------------------------------- layout */

/** Side padding for a page: 16 on a phone, growing with the window up to 48 on a large screen. */
export function useGutter() {
  const { width } = useWindowDimensions()
  const wide = useWide()
  return wide ? Math.round(Math.min(48, Math.max(24, width * 0.025))) : 16
}

/**
 * A page. Data pages fill the window on a large screen; pass `max` to keep a
 * form or reading page to a comfortable width. On a wide screen the title
 * sits in a top bar with the page's
 * actions, like any web app; on a phone it is a large heading in the page.
 */
export function Screen({ children, title, subtitle, action, refreshing, onRefresh, max, fab, back }: {
  children: React.ReactNode; title?: string; subtitle?: React.ReactNode; action?: React.ReactNode
  refreshing?: boolean; onRefresh?: () => void; max?: number; fab?: React.ReactNode
  back?: { label: string; onPress: () => void }
}) {
  const t = useTheme()
  const wide = useWide()
  const gutter = useGutter()
  const insets = useSafeAreaInsets()
  const sub = subtitle ? (typeof subtitle === 'string' ? <T muted size={wide ? 13.5 : 14}>{subtitle}</T> : subtitle) : null
  // Android (M3): a small top app bar carries the title and the page's action; it tints once content scrolls under it.
  const [scrolled, setScrolled] = useState(false)
  const m3Bar = M3 && !wide && !!title

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {m3Bar ? <M3AppBar title={title!} action={action} scrolled={scrolled} /> : null}
      {wide && (title || back) ? (
        <View style={{ height: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingHorizontal: gutter, backgroundColor: t.card, borderBottomWidth: 1, borderBottomColor: t.border }}>
          <View style={{ flexShrink: 1, gap: 1 }}>
            {back ? (
              <Pressable onPress={back.onPress} accessibilityRole="link" style={[{ flexDirection: 'row', alignItems: 'center', gap: 4 }, pointer]}>
                <Ionicons name="chevron-back" size={14} color={t.muted} />
                <T muted size={13} weight={500}>{back.label}</T>
              </Pressable>
            ) : null}
            {title ? <T display size={20} numberOfLines={1}>{title}</T> : null}
            {!back ? sub : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{action}</View>
        </View>
      ) : null}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: gutter,
          paddingTop: wide ? 28 : m3Bar ? 4 : title ? insets.top + 14 : 14,
          paddingBottom: 120,
          alignItems: 'center',
        }}
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={t.primary} /> : undefined}
        keyboardShouldPersistTaps="handled"
        onScroll={m3Bar ? (e) => setScrolled(e.nativeEvent.contentOffset.y > 0) : undefined}
        scrollEventThrottle={m3Bar ? 32 : undefined}
      >
        <View style={{ width: '100%', maxWidth: max }}>
          {m3Bar && sub ? <View style={{ marginBottom: 16 }}>{sub}</View> : null}
          {!wide && title && !m3Bar ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
              <View style={{ flexShrink: 1, gap: 2 }}>
                <T display size={26}>{title}</T>
                {sub}
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

/** M3 small top app bar: 64dp, title-large, surface that turns surface-container when content scrolls under it. */
export function M3AppBar({ title, action, scrolled, onBack }: { title: string; action?: React.ReactNode; scrolled?: boolean; onBack?: () => void }) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View style={{ paddingTop: insets.top, backgroundColor: scrolled ? t.m3?.surfaceContainer ?? t.card : t.bg }}>
      <View style={{ height: 64, flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: onBack ? 4 : 16, paddingRight: 8 }}>
        {onBack ? <IconButton icon="arrow-back" label="Back" onPress={onBack} color={t.text} /> : null}
        <Text accessibilityRole="header" numberOfLines={1} style={{ flex: 1, color: t.text, fontSize: 22, lineHeight: 28, ...font(400) }}>{title}</Text>
        {action ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>{action}</View> : null}
      </View>
    </View>
  )
}

export function Row({ children, gap = 8, style, wrap = true, align = 'center' }: {
  children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle>; wrap?: boolean; align?: ViewStyle['alignItems']
}) {
  return <View style={[{ flexDirection: 'row', flexWrap: wrap ? 'wrap' : 'nowrap', gap, alignItems: align }, style]}>{children}</View>
}

/**
 * Cards in a grid that adds columns as the space grows: each column is at
 * least `min` wide, so a phone gets one and a large screen gets several.
 */
export function Grid({ children, min = 300, gap = 16 }: { children: React.ReactNode; min?: number; gap?: number }) {
  const [w, setW] = useState(0)
  const cols = w ? Math.max(1, Math.floor((w + gap) / (min + gap))) : 1
  const item = w ? Math.floor((w - gap * (cols - 1)) / cols) : undefined
  return (
    <View onLayout={(e) => setW(Math.floor(e.nativeEvent.layout.width))} style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
      {React.Children.map(children, (c) => (c == null || c === false ? null : <View style={{ width: item ?? '100%' }}>{c}</View>))}
    </View>
  )
}

/** Two columns on a wide screen, stacked on a phone. */
export function Columns({ children, ratio = [1.5, 1], gap = 24 }: { children: [React.ReactNode, React.ReactNode]; ratio?: [number, number]; gap?: number }) {
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
    <View style={[{ marginBottom: 24 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, minHeight: 32 }}>
        <T display size={15}>{title}</T>
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
  const base: ViewStyle = { backgroundColor: t.card, borderRadius: 12, borderWidth: M3 ? 0 : 1, borderColor: t.border, padding: padded ? 16 : 0, overflow: M3 ? 'hidden' : undefined }
  if (!onPress) return <View style={[base, web ? { boxShadow: `0 1px 2px ${t.shadow}` } as any : null, style]}>{children}</View>
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      {...ripple(t)}
      style={(s) => {
        const { pressed, hovered } = s as PressState
        if (M3) return [base, style, web && pressed ? { backgroundColor: t.sunk } : null]
        return [base, style, {
          borderColor: hovered ? t.strong : t.border,
          backgroundColor: pressed ? t.sunk : t.card,
          ...(web ? { transitionDuration: '120ms', transitionProperty: 'border-color, box-shadow, background-color', cursor: 'pointer',
            boxShadow: hovered ? '0 4px 12px -4px rgba(16,24,40,0.12)' : `0 1px 2px ${t.shadow}` } as any : {}),
        }]
      }}
    >
      {children}
    </Pressable>
  )
}

/**
 * A titled box whose body is a list or a figure: the building block of the
 * dashboard. The header carries the section's own link or action.
 */
export function Panel({ title, subtitle, action, children, style }: {
  title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  return (
    <View style={[{ backgroundColor: t.card, borderRadius: 12, borderWidth: M3 ? 0 : 1, borderColor: t.border, overflow: 'hidden', marginBottom: 20 }, web ? { boxShadow: `0 1px 2px ${t.shadow}` } as any : null, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border }}>
        <View style={{ flexShrink: 1 }}>
          <T display size={14.5}>{title}</T>
          {subtitle ? <T muted size={12.5}>{subtitle}</T> : null}
        </View>
        {action}
      </View>
      {children}
    </View>
  )
}

/** Rows inside one bordered box, separated by hairlines. */
export function List({ children, bare }: { children: React.ReactNode; bare?: boolean }) {
  const t = useTheme()
  const items = React.Children.toArray(children).filter(Boolean)
  return (
    <View style={bare ? null : [{ backgroundColor: t.card, borderRadius: 12, borderWidth: M3 ? 0 : 1, borderColor: t.border, overflow: 'hidden' }, web ? { boxShadow: `0 1px 2px ${t.shadow}` } as any : null]}>
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
  const pad = { paddingHorizontal: 16, paddingVertical: 12 }
  const body = !onPress ? <View style={{ flex: 1, ...pad }}>{children}</View> : (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      {...ripple(t)}
      style={(s) => {
        const { pressed, hovered } = s as PressState
        if (M3 && !web) return { flex: 1, ...pad }
        return { flex: 1, ...pad, backgroundColor: pressed ? t.sunk : hovered ? t.bg : 'transparent', ...(web ? { cursor: 'pointer', transitionDuration: '100ms' } as any : {}) }
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

/** A headline figure: label, value, and a short line of context. */
export function Stat({ label, value, hint, tone, icon, onPress }: {
  label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: Tone; icon?: React.ReactNode; onPress?: () => void
}) {
  const t = useTheme()
  const hintColor = tone === 'danger' ? t.danger : tone === 'warn' ? t.warn : tone === 'ok' ? t.ok : t.muted
  return (
    <Card onPress={onPress} style={{ flexGrow: 1, flexBasis: 0, minWidth: 150, gap: 6, padding: 16 }}>
      <Row gap={8} wrap={false}>
        {icon}
        <T muted size={13} weight={500} numberOfLines={1}>{label}</T>
      </Row>
      <T display size={24} num>{value}</T>
      {hint ? <T size={12.5} color={hintColor} numberOfLines={1}>{hint}</T> : null}
    </Card>
  )
}

/* ---------------------------------------------------------------- buttons */

type Kind = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'

export function Button({ title, onPress, kind = 'primary', disabled, busy, small, icon, full, accessibilityLabel }: {
  title?: string; onPress: () => void; kind?: Kind; disabled?: boolean; busy?: boolean; small?: boolean
  icon?: IconName; full?: boolean; accessibilityLabel?: string
}) {
  const t = useTheme()
  const palette: Record<Kind, [string, string, string]> = {
    primary: [t.primary, t.primaryText, t.primary],
    secondary: [t.card, t.text, t.strong],
    ghost: ['transparent', t.primary, 'transparent'],
    danger: [t.card, t.danger, t.strong],
    accent: [t.accent, '#1F1300', t.accent],
  }
  const [bg, fg, edge] = palette[kind]
  if (M3) return <M3Button {...{ title, onPress, kind, disabled, busy, small, icon, full, accessibilityLabel }} />
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      disabled={disabled || busy}
      style={(s) => {
        const { pressed, hovered } = s as PressState
        const hover = (hovered || pressed) && !disabled
        return [{
          backgroundColor: hover ? (kind === 'primary' || kind === 'accent' ? bg : kind === 'ghost' ? t.soft : t.sunk) : bg,
          borderWidth: 1,
          borderColor: edge,
          borderRadius: 8,
          paddingVertical: small ? 5 : 8,
          paddingHorizontal: title ? (small ? 10 : 14) : (small ? 6 : 9),
          minHeight: small ? 32 : 38,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.45 : 1,
        } as ViewStyle,
        hover && (kind === 'primary' || kind === 'accent') ? { filter: 'brightness(0.92)' } as any : null,
        web ? { transitionDuration: '100ms', cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: kind === 'secondary' || kind === 'danger' ? `0 1px 2px ${t.shadow}` : 'none' } as any : null]
      }}
    >
      {busy ? <ActivityIndicator color={fg} size="small" /> : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 15 : 16} color={fg} /> : null}
          {title ? <Text style={{ color: fg, fontSize: small ? 13 : 14, ...font(600) }}>{title}</Text> : null}
        </>
      )}
    </Pressable>
  )
}

/** M3 buttons: filled (primary), outlined (secondary, danger), text (ghost), tonal (accent); 40dp, full radius. */
function M3Button({ title, onPress, kind = 'primary', disabled, busy, small, icon, full, accessibilityLabel }: {
  title?: string; onPress: () => void; kind?: Kind; disabled?: boolean; busy?: boolean; small?: boolean
  icon?: IconName; full?: boolean; accessibilityLabel?: string
}) {
  const t = useTheme()
  const r = t.m3!
  const look: Record<Kind, { bg: string; fg: string; edge?: string }> = {
    primary: { bg: r.primary, fg: r.onPrimary },
    secondary: { bg: 'transparent', fg: r.primary, edge: r.outline },
    ghost: { bg: 'transparent', fg: r.primary },
    danger: { bg: 'transparent', fg: r.error, edge: r.outline },
    accent: { bg: r.secondaryContainer, fg: r.onSecondaryContainer },
  }
  const { bg, fg, edge } = look[kind]
  const h = small ? 32 : 40
  return (
    <View style={{ borderRadius: h / 2, overflow: 'hidden', alignSelf: full ? 'stretch' : 'flex-start', opacity: disabled ? 0.38 : 1 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: !!(disabled || busy) }}
        onPress={onPress}
        disabled={disabled || busy}
        {...ripple(t, false, fg + '29')}
        style={(s) => ({
          backgroundColor: web && (s as PressState).hovered ? (kind === 'primary' ? bg : r.primary + '14') : bg,
          borderWidth: edge ? 1 : 0, borderColor: edge, borderRadius: h / 2, minHeight: h,
          paddingHorizontal: title ? (kind === 'ghost' ? 12 : small ? 16 : 24) : (small ? 8 : 10),
          paddingLeft: title && icon && kind !== 'ghost' ? (small ? 12 : 16) : undefined,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          ...(web ? { cursor: disabled ? 'not-allowed' : 'pointer' } as any : {}),
        })}
      >
        {busy ? <ActivityIndicator color={fg} size="small" /> : (
          <>
            {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
            {title ? <Text style={{ color: fg, fontSize: 14, lineHeight: 20, letterSpacing: 0.1, ...font(600) }}>{title}</Text> : null}
          </>
        )}
      </Pressable>
    </View>
  )
}

export function IconButton({ icon, onPress, label, color }: { icon: IconName; onPress: () => void; label: string; color?: string }) {
  const t = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      {...ripple(t, true)}
      style={(s) => {
        const { pressed, hovered } = s as PressState
        if (M3) return [{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: web && (pressed || hovered) ? t.sunk : 'transparent' }, pointer]
        return [{ width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed || hovered ? t.sunk : 'transparent' }, pointer]
      }}
    >
      <Ionicons name={icon} size={M3 ? 24 : 19} color={color ?? t.muted} />
    </Pressable>
  )
}

/** A filter or choice. Selected is indigo-tinted with an indigo edge. */
export function Chip({ label, active, onPress, lead, count }: { label: string; active?: boolean; onPress?: () => void; lead?: React.ReactNode; count?: number }) {
  const t = useTheme()
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      {...ripple(t)}
      style={(s) => {
        const { pressed, hovered } = s as PressState
        if (M3) return [styles.chip, { height: 32, paddingVertical: 0, paddingHorizontal: active ? 8 : 16, overflow: 'hidden',
          backgroundColor: active ? t.m3!.secondaryContainer : web && (pressed || hovered) ? t.sunk : 'transparent',
          borderColor: active ? 'transparent' : t.m3!.outline }, pointer]
        return [styles.chip, {
          backgroundColor: active ? t.soft : pressed || hovered ? t.sunk : t.card,
          borderColor: active ? t.primary : t.border,
        }, web ? { cursor: 'pointer', transitionDuration: '100ms' } as any : null]
      }}
    >
      {M3 && active ? <Ionicons name="checkmark" size={18} color={t.m3!.onSecondaryContainer} /> : lead}
      <Text style={{ color: M3 ? (active ? t.m3!.onSecondaryContainer : t.m3!.onSurfaceVariant) : active ? t.primary : t.text, fontSize: M3 ? 14 : 13, ...font(500) }}>{label}</Text>
      {count !== undefined ? <Text style={{ color: M3 ? (active ? t.m3!.onSecondaryContainer : t.m3!.onSurfaceVariant) : active ? t.primary : t.faint, fontSize: 12.5, ...font(500), ...tabular }}>{count}</Text> : null}
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: bg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' }}>
      {dot ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: fg }} /> : null}
      <Text style={{ color: fg, fontSize: 12, ...font(500) }}>{label}</Text>
    </View>
  )
}

/** A level bar: how full, coloured by how worried to be. */
export function Meter({ value, tone = 'info', height = 6 }: { value: number; tone?: Tone; height?: number }) {
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
      <View style={[styles.inputWrap, { backgroundColor: t.card, borderColor: focus ? t.primary : t.strong }, M3 ? { backgroundColor: 'transparent', borderRadius: 4, borderWidth: focus ? 2 : 1, paddingHorizontal: focus ? 15 : 16, minHeight: 56, borderColor: focus ? t.primary : t.m3!.outline } : null, web && !M3 ? { boxShadow: focus ? `0 0 0 3px ${t.soft}` : `0 1px 2px ${t.shadow}`, transitionDuration: '100ms' } as any : null]}>
        {prefix ? <Text style={{ color: t.muted, fontSize: 15, marginRight: 4, ...font(500) }}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={t.faint}
          onFocus={(e) => { setFocus(true); onFocus?.(e) }}
          onBlur={(e) => { setFocus(false); onBlur?.(e) }}
          style={[styles.input, { color: t.text }, rest.multiline && { minHeight: 84, textAlignVertical: 'top' }, web ? { outlineStyle: 'none' } as any : null, style]}
          {...rest}
        />
      </View>
      {help ? <Text style={{ color: t.muted, fontSize: 12.5, marginTop: 6, ...font(400) }}>{help}</Text> : null}
    </View>
  )
}

/* ---------------------------------------------------------------- states */

export function Empty({ icon = 'leaf-outline', title, detail, action }: { icon?: IconName; title: string; detail?: string; action?: React.ReactNode }) {
  const t = useTheme()
  return (
    <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: t.strong, borderRadius: 12, padding: 28, alignItems: 'center', gap: 6 }}>
      <IconTile icon={icon} size={40} />
      <T display size={15} style={{ textAlign: 'center', marginTop: 4 }}>{title}</T>
      {detail ? <T muted size={13.5} style={{ textAlign: 'center', maxWidth: 420 }}>{detail}</T> : null}
      {action ? <View style={{ marginTop: 8 }}>{action}</View> : null}
    </View>
  )
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useTheme()
  return (
    <View style={{ backgroundColor: t.dangerSoft, borderRadius: 12, padding: 16, marginBottom: 20, gap: 4 }}>
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
    Animated.spring(anim, { toValue: 1, useNativeDriver: !web, speed: 20, bounciness: 4 }).start()
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
            position: 'absolute', left: 16, right: 16, bottom: (wide ? 24 : 92) + insets.bottom, alignItems: 'center',
            opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }}
        >
          <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: M3 ? t.m3!.inverseSurface : '#101828', borderRadius: M3 ? 4 : 10, minHeight: M3 ? 48 : undefined, paddingVertical: 10, paddingLeft: 14, paddingRight: msg.action ? 6 : 16, maxWidth: 520 }}>
            {M3 ? null : <Ionicons name="checkmark-circle" size={18} color="#47CD89" />}
            <Text style={{ color: M3 ? t.m3!.inverseOnSurface : '#F2F4F7', fontSize: 14, flexShrink: 1, ...font(M3 ? 400 : 500) }}>{msg.text}</Text>
            {msg.action ? (
              <Pressable onPress={() => { msg.action!.onPress(); hide() }} accessibilityRole="button" style={[{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }, pointer]}>
                <Text style={{ color: M3 ? t.m3!.inversePrimary : '#A4B0FF', fontSize: 14, ...font(600) }}>{msg.action.label}</Text>
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
    if (open) Animated.spring(anim, { toValue: 1, useNativeDriver: !web, speed: 18, bounciness: 2 }).start()
    else anim.setValue(0)
  }, [open, anim])
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: t.overlay, justifyContent: wide ? 'center' : 'flex-end', alignItems: 'center' }} onPress={onClose} accessibilityLabel="Close">
        <Animated.View style={{ width: '100%', maxWidth: wide ? 460 : undefined, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [wide ? 8 : 48, 0] }) }] }}>
          <Pressable
            onPress={() => {}}
            style={{ backgroundColor: M3 ? t.m3!.surfaceContainerLow : t.card, borderRadius: M3 ? 28 : 16, borderBottomLeftRadius: wide ? 16 : 0, borderBottomRightRadius: wide ? 16 : 0, padding: 20, paddingBottom: 20 + (wide ? 0 : insets.bottom) }}
          >
            {!wide ? <View style={{ width: M3 ? 32 : 36, height: 4, borderRadius: 2, backgroundColor: M3 ? t.m3!.onSurfaceVariant + '66' : t.strong, alignSelf: 'center', marginBottom: 14, marginTop: M3 ? -4 : 0 }} /> : null}
            <Row style={{ justifyContent: 'space-between', marginBottom: 14 }} wrap={false}>
              <T display size={17}>{title}</T>
              <IconButton icon="close" label="Close" onPress={onClose} />
            </Row>
            {children}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

/** Round add button for phones. Wide screens put the action in the top bar instead. */
export function Fab({ onPress, label = 'Add' }: { onPress: () => void; label?: string }) {
  const t = useTheme()
  const wide = useWide()
  if (wide) return null
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...ripple(t, false, t.m3 ? t.m3.onPrimaryContainer + '29' : undefined)}
      style={({ pressed }) => ({
        position: 'absolute', right: M3 ? 16 : 18, bottom: M3 ? 16 : 18, width: 56, height: 56, borderRadius: 16, overflow: M3 ? 'hidden' : undefined,
        backgroundColor: M3 ? t.m3!.primaryContainer : t.primary, alignItems: 'center', justifyContent: 'center',
        transform: [{ scale: pressed && !M3 ? 0.95 : 1 }],
        shadowColor: '#101828', shadowOpacity: M3 ? 0.18 : 0.25, shadowRadius: M3 ? 8 : 12, shadowOffset: { width: 0, height: M3 ? 4 : 6 }, elevation: M3 ? 3 : 6,
      })}
    >
      <Ionicons name="add" size={M3 ? 24 : 28} color={M3 ? t.m3!.onPrimaryContainer : t.primaryText} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 11 },
  label: { fontSize: 13.5, marginBottom: 6, ...font(500) },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12 },
  input: { flex: 1, paddingVertical: 10, fontSize: 15, ...font(400) },
})
