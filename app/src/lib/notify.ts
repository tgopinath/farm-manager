/**
 * Phone reminders.
 *
 * Every time the dashboard loads, the schedule is rebuilt from the server's
 * reminder list: one 8 am notification on each upcoming vaccination or
 * maintenance due date, and a next-morning digest of anything that needs
 * attention now (low feed, low balance, overdue doses, sick animals).
 *
 * These are local notifications, so they fire without a push server. The web
 * app shows the same list on its dashboard instead.
 */
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import type { Summary } from './api'

const native = Platform.OS === 'ios' || Platform.OS === 'android'
const HOUR = 8

if (native) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  })
}

let permitted: boolean | null = null

async function allowed() {
  if (permitted !== null) return permitted
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Farm reminders',
      importance: Notifications.AndroidImportance.HIGH,
    })
  }
  const current = await Notifications.getPermissionsAsync()
  permitted = current.granted || (await Notifications.requestPermissionsAsync()).granted
  return permitted
}

function at8am(day: string) {
  const d = new Date(`${day}T00:00:00`)
  d.setHours(HOUR, 0, 0, 0)
  return d
}

export async function scheduleReminders(summary: Summary) {
  if (!native || !(await allowed())) return
  await Notifications.cancelAllScheduledNotificationsAsync()
  const now = Date.now()
  const trigger = (date: Date) => ({
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date,
    channelId: 'reminders',
  } as const)

  for (const r of summary.reminders) {
    if (r.kind !== 'vaccination' && r.kind !== 'maintenance') continue
    const when = at8am(r.date)
    if (when.getTime() <= now) continue
    await Notifications.scheduleNotificationAsync({
      content: { title: r.title, body: r.kind === 'vaccination' ? 'Vaccination due today' : 'Maintenance due today' },
      trigger: trigger(when),
    })
  }

  const urgent = summary.reminders.filter((r) => r.level !== 'due')
  if (urgent.length) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(HOUR, 0, 0, 0)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${urgent.length} thing${urgent.length > 1 ? 's' : ''} on the farm need attention`,
        body: urgent.slice(0, 3).map((r) => r.title).join(' · '),
      },
      trigger: trigger(tomorrow),
    })
  }
}
