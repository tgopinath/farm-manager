import { router } from 'expo-router'
import { Platform, Pressable, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { IconTile, Sheet, T, type IconName } from './ui'
import { useTheme } from '../lib/theme'

const ITEMS: { label: string; hint: string; icon: IconName; tint: 'expense' | 'income' | 'primary' | 'accent'; params?: Record<string, string>; path?: string }[] = [
  { label: 'Expense', hint: 'Feed, vet, labour', icon: 'arrow-up', tint: 'expense', params: { collection: 'transactions', type: 'expense' } },
  { label: 'Income', hint: 'Milk, eggs, sales', icon: 'arrow-down', tint: 'income', params: { collection: 'transactions', type: 'income' } },
  { label: 'Animal or flock', hint: 'Goat, cow, chickens', icon: 'paw-outline', tint: 'primary', params: { collection: 'animals' } },
  { label: 'Vaccination', hint: 'Schedule a dose', icon: 'medkit-outline', tint: 'primary', params: { collection: 'vaccinations' } },
  { label: 'Health note', hint: 'Check-up, treatment', icon: 'pulse-outline', tint: 'primary', params: { collection: 'health' } },
  { label: 'Stock item', hint: 'Feed, medicine', icon: 'cube-outline', tint: 'primary', params: { collection: 'inventory' } },
  { label: 'Health check from a photo', hint: 'AI looks for visible signs of illness', icon: 'camera-outline', tint: 'accent', path: '/health-check' },
]

export function QuickAdd({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTheme()
  const color = { expense: t.expense, income: t.income, primary: t.primary, accent: t.accent }
  return (
    <Sheet open={open} onClose={onClose} title="Add a record">
      <View style={{ borderWidth: 1, borderColor: t.border, borderRadius: 12, overflow: 'hidden' }}>
        {ITEMS.map((it, i) => (
          <Pressable
            key={it.label}
            accessibilityRole="button"
            onPress={() => {
              onClose()
              if (it.path) router.push(it.path as any)
              else router.push({ pathname: '/edit/[collection]', params: it.params! })
            }}
            style={(s) => {
              const { pressed, hovered } = s as { pressed: boolean; hovered?: boolean }
              return {
                flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11,
                borderTopWidth: i ? 1 : 0, borderTopColor: t.border,
                backgroundColor: pressed || hovered ? t.sunk : t.card,
                ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
              }
            }}
          >
            <IconTile icon={it.icon} color={color[it.tint]} size={34} />
            <View style={{ flex: 1 }}>
              <T weight={600} size={14}>{it.label}</T>
              <T muted size={12.5}>{it.hint}</T>
            </View>
            <Ionicons name="chevron-forward" size={16} color={t.faint} />
          </Pressable>
        ))}
      </View>
    </Sheet>
  )
}
