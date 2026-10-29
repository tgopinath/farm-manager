import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import { Sheet, T } from './ui'
import { useTheme } from '../lib/theme'

const ITEMS: { label: string; hint: string; icon: string; params: Record<string, string> }[] = [
  { label: 'Expense', hint: 'Feed, vet, labour', icon: '➖', params: { collection: 'transactions', type: 'expense' } },
  { label: 'Income', hint: 'Milk, eggs, sales', icon: '➕', params: { collection: 'transactions', type: 'income' } },
  { label: 'Animal or flock', hint: 'Goat, cow, chickens', icon: '🐐', params: { collection: 'animals' } },
  { label: 'Vaccination', hint: 'Schedule a dose', icon: '💉', params: { collection: 'vaccinations' } },
  { label: 'Health note', hint: 'Check-up, treatment', icon: '🩺', params: { collection: 'health' } },
  { label: 'Stock item', hint: 'Feed, medicine', icon: '📦', params: { collection: 'inventory' } },
]

export function QuickAdd({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTheme()
  return (
    <Sheet open={open} onClose={onClose} title="Add to the farm">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {ITEMS.map((it) => (
          <Pressable
            key={it.label}
            accessibilityRole="button"
            onPress={() => { onClose(); router.push({ pathname: '/edit/[collection]', params: it.params }) }}
            style={(s) => {
              const { pressed, hovered } = s as { pressed: boolean; hovered?: boolean }
              return {
                flexBasis: '47%', flexGrow: 1, borderRadius: 16, padding: 14, gap: 2,
                backgroundColor: pressed || hovered ? t.soft : t.sunk,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              }
            }}
          >
            <T size={22}>{it.icon}</T>
            <T bold size={15}>{it.label}</T>
            <T muted size={12.5}>{it.hint}</T>
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => { onClose(); router.push('/health-check') }}
        style={{ marginTop: 10, borderRadius: 16, padding: 14, backgroundColor: t.accentSoft, flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <T size={22}>📷</T>
        <View style={{ flex: 1 }}>
          <T bold color={t.accentText}>Check an animal from a photo</T>
          <T size={12.5} color={t.accentText}>AI looks for visible signs of illness</T>
        </View>
      </Pressable>
    </Sheet>
  )
}
