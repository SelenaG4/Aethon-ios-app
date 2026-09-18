import notifee, { AndroidImportance, RepeatFrequency, TriggerType } from '@notifee/react-native'
import type { Medication } from './mockData'

const MEDICATION_CHANNEL_ID = 'medication'
const MESSAGES_CHANNEL_ID = 'messages'

// The guide's setupNotifications also fetches a Firebase push token and
// saves it to user_profiles. CLAUDE.md keeps this app to local notifications
// only (no Firebase, no backend), so this just prepares the channels and
// asks for permission.
export async function setupNotifications(): Promise<void> {
  await notifee.createChannel({
    id: MEDICATION_CHANNEL_ID,
    name: 'Medication reminders',
    importance: AndroidImportance.HIGH,
  })
  await notifee.createChannel({
    id: MESSAGES_CHANNEL_ID,
    name: 'Messages',
    importance: AndroidImportance.DEFAULT,
  })
  await notifee.requestPermission()
}

function nextOccurrence(hour: number, minute: number): number {
  const t = new Date()
  t.setHours(hour, minute, 0, 0)
  if (t.getTime() <= Date.now()) t.setDate(t.getDate() + 1)
  return t.getTime()
}

// Cancels every existing medication reminder and reschedules from the
// current medication list, so changing the list never leaves duplicates.
// The guide loops over a medication's `times` array; this app's schema
// already has one row per (medication, time) pair (see
// docs/SCHEMA_ADDITIONS.md), so each medication needs only one trigger.
export async function scheduleReminders(medications: Medication[]): Promise<void> {
  const existing = await notifee.getTriggerNotifications()
  await Promise.all(
    existing
      .filter((n) => n.notification.data?.type === 'medication')
      .map((n) => notifee.cancelNotification(n.notification.id as string))
  )

  for (const medication of medications) {
    const [hourText, minuteText] = medication.scheduled_time.split(':')
    await notifee.createTriggerNotification(
      {
        id: `med_${medication.id}`,
        title: 'Time for your medication',
        body: `${medication.name} - ${medication.dosage}`,
        data: { type: 'medication', medicationId: medication.id },
        android: { channelId: MEDICATION_CHANNEL_ID },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: nextOccurrence(Number(hourText), Number(minuteText)),
        repeatFrequency: RepeatFrequency.DAILY,
      }
    )
  }
}
