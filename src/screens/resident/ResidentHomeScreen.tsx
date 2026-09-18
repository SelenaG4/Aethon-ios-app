import React, { useCallback, useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native'
import {
  Angry,
  Check,
  Circle,
  Frown,
  Heart,
  Laugh,
  Mail,
  Meh,
  Phone,
  Smile,
} from 'lucide-react-native'
import { AppText, EmptyView, ErrorView, LoadingView } from '../../components'
import { COLORS, RADIUS, SHADOW, SPACE, TOUCH, TYPE } from '../../constants/theme'
import {
  acknowledgeMessage,
  addHealthLog,
  getMedicationAcknowledgementStreak,
  getMedications,
  getResident,
  getTodaysMedicationAcknowledgements,
  getUnacknowledgedMessages,
  subscribe,
} from '../../lib/data'
import type { Medication, MedicationAcknowledgement, Message, Resident } from '../../lib/mockData'
import type { ResidentStackParamList } from '../../navigation/ResidentNavigator'
import AssistanceModal from './AssistanceModal'

type Props = {
  residentId: string
  onSwitchView: () => void
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MOOD_OPTIONS = [
  { value: 1, Icon: Angry },
  { value: 2, Icon: Frown },
  { value: 3, Icon: Meh },
  { value: 4, Icon: Smile },
  { value: 5, Icon: Laugh },
]

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatFullDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

export default function ResidentHomeScreen({ residentId, onSwitchView }: Props) {
  const navigation = useNavigation<NavigationProp<ResidentStackParamList>>()
  const insets = useSafeAreaInsets()
  const [resident, setResident] = useState<Resident | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [todaysAcks, setTodaysAcks] = useState<Map<string, MedicationAcknowledgement>>(new Map())
  const [streak, setStreak] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [ackingMessageIds, setAckingMessageIds] = useState<Set<string>>(new Set())
  const [moodLogged, setMoodLogged] = useState(false)
  const [isAssistanceModalOpen, setIsAssistanceModalOpen] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const load = useCallback(async () => {
    try {
      const [loadedResident, loadedMedications, loadedAcks, loadedStreak, loadedMessages] =
        await Promise.all([
          getResident(residentId),
          getMedications(residentId),
          getTodaysMedicationAcknowledgements(residentId),
          getMedicationAcknowledgementStreak(residentId),
          getUnacknowledgedMessages(residentId),
        ])
      setResident(loadedResident ?? null)
      setMedications(loadedMedications.filter((m) => m.active))
      setTodaysAcks(loadedAcks)
      setStreak(loadedStreak)
      setMessages(loadedMessages)
      setLoadError(false)
    } catch {
      setLoadError(true)
    }
  }, [residentId])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  useEffect(() => subscribe(load), [load])

  const onAcknowledgeMessage = useCallback(async (messageId: string) => {
    setAckingMessageIds((prev) => new Set(prev).add(messageId))
    await acknowledgeMessage(messageId)
  }, [])

  const onSelectMood = useCallback(
    async (value: number) => {
      if (!resident) return
      await addHealthLog({
        resident_id: resident.id,
        logged_by: resident.first_name,
        mood: value,
        sleep: null,
        pain: null,
        weight_kg: null,
        notes: null,
      })
      setMoodLogged(true)
    },
    [resident]
  )

  if (loadError) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ErrorView message="Could not load your home screen" onRetry={load} isResident />
      </SafeAreaView>
    )
  }

  if (!resident) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LoadingView isResident />
      </SafeAreaView>
    )
  }

  const allAcknowledgedToday = medications.length > 0 && medications.every((m) => todaysAcks.has(m.id))

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <AppText weight="black" style={styles.greeting}>
          {greetingForHour(new Date().getHours())}, {resident.first_name}
        </AppText>
        <AppText style={styles.fullDate}>{formatFullDate(new Date())}</AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AccentCard accentColor={COLORS.primary}>
          <View style={styles.cardHeadingRow}>
            <AppText weight="bold" style={styles.medicationHeading}>
              Your medications today
            </AppText>
            {streak >= 3 ? (
              <View style={styles.streakPill}>
                <AppText weight="semibold" style={styles.streakPillText}>
                  {streak} days in a row
                </AppText>
              </View>
            ) : null}
          </View>

          {allAcknowledgedToday ? (
            <AppText weight="semibold" style={styles.allDoneText}>
              All done today
            </AppText>
          ) : (
            medications.map((medication) => {
              const ack = todaysAcks.get(medication.id)
              const taken = ack?.status === 'taken'
              return (
                <Pressable
                  key={medication.id}
                  style={styles.medicationRow}
                  onPress={() => navigation.navigate('Acknowledge', { medicationId: medication.id })}
                  accessibilityRole="button"
                  accessibilityLabel={`${medication.name}, ${medication.dosage}${taken ? ', taken today' : ''}`}
                >
                  <View style={styles.medicationInfo}>
                    <AppText weight="bold" style={styles.medicationName}>
                      {medication.name}
                    </AppText>
                    <AppText style={styles.medicationDose}>{medication.dosage}</AppText>
                  </View>
                  {taken ? (
                    <Check size={34} color={COLORS.primary} />
                  ) : (
                    <Circle size={34} color={COLORS.textMuted} />
                  )}
                </Pressable>
              )
            })
          )}

          <AppText style={styles.medicationFootnote}>
            Reference only. Not a medication administration record.
          </AppText>
        </AccentCard>

        <AccentCard accentColor={COLORS.blue}>
          <AppText weight="bold" style={styles.cardHeading}>
            Messages from your family
          </AppText>
          {messages.length === 0 ? (
            <EmptyView icon={Mail} message="No new messages" isResident />
          ) : (
            messages.map((message) => {
              const isAcking = ackingMessageIds.has(message.id)
              return (
                <View key={message.id} style={styles.messageRow}>
                  <View style={styles.messageBody}>
                    <AppText weight="bold" style={styles.messageSender}>
                      {message.sender_name}
                    </AppText>
                    <AppText style={styles.messageText}>{message.body}</AppText>
                    {message.image_url ? (
                      <Image source={{ uri: message.image_url }} style={styles.messageImage} />
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => onAcknowledgeMessage(message.id)}
                    disabled={isAcking}
                    style={[styles.messageAckControl, isAcking && styles.messageAckControlDone]}
                    accessibilityRole="button"
                    accessibilityLabel={`Mark message from ${message.sender_name} as seen`}
                    accessibilityState={{ disabled: isAcking }}
                  >
                    <Heart
                      size={32}
                      color={isAcking ? COLORS.textMuted : COLORS.danger}
                      fill={isAcking ? COLORS.textMuted : COLORS.danger}
                    />
                  </Pressable>
                </View>
              )
            })
          )}
        </AccentCard>

        <AccentCard accentColor={COLORS.blue}>
          <AppText weight="bold" style={styles.cardHeading}>
            How are you today?
          </AppText>
          {moodLogged ? (
            <AppText weight="semibold" style={styles.thankYouText}>
              Thank you
            </AppText>
          ) : (
            <View style={styles.moodRow}>
              {MOOD_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => onSelectMood(option.value)}
                  style={styles.moodButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Mood ${option.value} of 5`}
                >
                  <option.Icon size={40} color={COLORS.textMuted} />
                </Pressable>
              ))}
            </View>
          )}
        </AccentCard>

        {resident.independence_goals.length > 0 ? (
          <AccentCard accentColor={COLORS.amber}>
            <AppText weight="bold" style={styles.cardHeading}>
              What matters to you
            </AppText>
            {resident.independence_goals.map((goal, index) => (
              <AppText key={index} style={styles.goalText}>
                {goal.text}
              </AppText>
            ))}
          </AccentCard>
        ) : null}

        <Pressable
          onPress={onSwitchView}
          style={styles.switchViewLink}
          accessibilityRole="button"
          accessibilityLabel="Switch view"
        >
          <AppText style={styles.switchViewLinkText}>Switch view</AppText>
        </Pressable>
      </ScrollView>

      <Pressable
        style={[styles.assistanceControl, { bottom: insets.bottom + 16 }]}
        onPress={() => setIsAssistanceModalOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="I need help"
      >
        <Phone size={30} color={COLORS.surface} />
        <AppText weight="bold" style={styles.assistanceControlText}>
          I need help
        </AppText>
      </Pressable>

      <AssistanceModal
        visible={isAssistanceModalOpen}
        residentId={resident.id}
        contacts={resident.emergency_contacts}
        onClose={() => setIsAssistanceModalOpen(false)}
      />
    </View>
  )
}

// The guide's own Card component spec for this screen (white, borderLeftWidth
// 5, accentColor prop) differs from the shared src/components/Card.tsx, which
// three other carer screens already depend on for its plain-bordered look.
// Kept local to this screen instead of changing the shared component.
function AccentCard({
  accentColor,
  children,
}: {
  accentColor: string
  children: React.ReactNode
}) {
  return <View style={[styles.card, { borderLeftColor: accentColor }]}>{children}</View>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: TYPE.residentH1,
    color: COLORS.surface,
  },
  fullDate: {
    marginTop: SPACE.xs,
    fontSize: TYPE.residentMin,
    color: 'rgba(255,255,255,0.85)',
  },
  scrollContent: {
    padding: SPACE.md,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginBottom: SPACE.md,
    borderLeftWidth: 5,
    padding: 18,
    ...SHADOW.card,
  },
  cardHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACE.md,
  },
  cardHeading: {
    fontSize: 24,
    color: COLORS.text,
    marginBottom: SPACE.md,
  },
  medicationHeading: {
    fontSize: 24,
    color: COLORS.primaryDark,
  },
  streakPill: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
  },
  streakPillText: {
    fontSize: TYPE.residentMin,
    color: COLORS.primaryDark,
  },
  allDoneText: {
    fontSize: TYPE.residentMin,
    color: COLORS.primary,
  },
  medicationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TOUCH.resident,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 26,
    color: COLORS.text,
  },
  medicationDose: {
    marginTop: 2,
    fontSize: TYPE.residentMin,
    color: COLORS.textMuted,
  },
  medicationFootnote: {
    marginTop: SPACE.md,
    fontSize: TYPE.residentMin,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.md,
    marginBottom: SPACE.md,
  },
  messageBody: {
    flex: 1,
  },
  messageSender: {
    fontSize: TYPE.residentMin,
    color: COLORS.text,
  },
  messageText: {
    marginTop: 4,
    fontSize: TYPE.residentMin,
    lineHeight: 30,
    color: COLORS.textSecond,
  },
  messageImage: {
    marginTop: SPACE.sm,
    width: '100%',
    height: 180,
    borderRadius: 10,
  },
  messageAckControl: {
    width: TOUCH.resident,
    height: TOUCH.resident,
    borderRadius: TOUCH.resident / 2,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageAckControlDone: {
    backgroundColor: COLORS.surfaceAlt,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    width: TOUCH.resident,
    height: TOUCH.resident,
    borderRadius: TOUCH.resident / 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thankYouText: {
    fontSize: TYPE.residentMin,
    color: COLORS.primary,
  },
  goalText: {
    fontSize: TYPE.residentMin,
    color: COLORS.text,
    marginTop: SPACE.xs,
  },
  switchViewLink: {
    alignSelf: 'center',
    minHeight: TOUCH.resident,
    paddingHorizontal: SPACE.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchViewLinkText: {
    fontSize: TYPE.residentMin,
    color: COLORS.textMuted,
  },
  assistanceControl: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: TOUCH.resident,
    borderRadius: 14,
    backgroundColor: COLORS.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
  },
  assistanceControlText: {
    fontSize: 26,
    color: COLORS.surface,
  },
})
