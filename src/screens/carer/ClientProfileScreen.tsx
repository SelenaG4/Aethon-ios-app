import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  NavigationProp,
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native'
import { ArrowLeft, FileText, HeartPulse, Mic } from 'lucide-react-native'
import { AppText, EmptyView, ErrorView, LoadingView } from '../../components'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../../constants/theme'
import {
  getCareStageHistory,
  getEscalations,
  getHealthLogs,
  getMedications,
  getResident,
  getVisitNotes,
  recordEscalationOutcome,
  subscribe,
} from '../../lib/data'
import { moodBandColor, painBandColor } from '../../lib/observations'
import type {
  CareStage,
  CareStageHistoryEntry,
  Escalation,
  HealthLog,
  Medication,
  MobilityAid,
  Resident,
  VisitNote,
} from '../../lib/mockData'
import type { CarerStackParamList } from '../../navigation/CarerNavigator'

type ClientProfileRoute = RouteProp<CarerStackParamList, 'ClientProfile'>
type ClientProfileNavigation = NavigationProp<CarerStackParamList>

type ProfileTabKey = 'profile' | 'notes' | 'history'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const MOBILITY_AID_LABELS: Record<MobilityAid, string> = {
  none: 'None',
  stick: 'Walking stick',
  frame: 'Walking frame',
  wheelchair: 'Wheelchair',
}

// Kept as the guide's own plain labels for now — CLAUDE.md says these will
// be checked against the vocabulary carers actually use in a later pass.
const CARE_STAGE_LABELS: Record<CareStage, string> = {
  independent: 'Living independently',
  family_supported: 'Supported by family',
  professionally_supported: 'Professional care at home',
  residential: 'In a care facility',
}

function formatDob(dob: string): string {
  const d = new Date(dob)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function formatMonthYear(iso: string): string {
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function calculateAge(dob: string): number {
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const hasHadBirthdayThisYear =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate())
  if (!hasHadBirthdayThisYear) age -= 1
  return age
}

type MedicationGroup = {
  key: string
  name: string
  dosage: string
  times: string[]
}

// The guide's medications field is a single JSON array per client with a
// name, dose and list of scheduled times. Our schema instead has one row per
// (medication, time) pair, so entries with the same name and dose are
// grouped back into a single display row with multiple time chips.
function groupMedications(medications: Medication[]): MedicationGroup[] {
  const groups = new Map<string, MedicationGroup>()
  for (const medication of medications) {
    const key = `${medication.name}|${medication.dosage}`
    const existing = groups.get(key)
    if (existing) {
      existing.times.push(medication.scheduled_time)
    } else {
      groups.set(key, {
        key,
        name: medication.name,
        dosage: medication.dosage,
        times: [medication.scheduled_time],
      })
    }
  }
  return Array.from(groups.values())
}

export default function ClientProfileScreen() {
  const navigation = useNavigation<ClientProfileNavigation>()
  const route = useRoute<ClientProfileRoute>()
  const { clientId, clientName } = route.params
  const [resident, setResident] = useState<Resident | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [careStageHistory, setCareStageHistory] = useState<CareStageHistoryEntry[]>([])
  const [notes, setNotes] = useState<VisitNote[]>([])
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([])
  const [escalations, setEscalations] = useState<Escalation[]>([])
  const [tab, setTab] = useState<ProfileTabKey>(route.params.initialTab ?? 'profile')
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)
  const consumedSavedBaseline = useRef(false)
  const consumedSavedEscalation = useRef(false)

  const load = useCallback(async () => {
    try {
      const [
        loadedResident,
        loadedMedications,
        loadedCareStageHistory,
        loadedNotes,
        loadedHealthLogs,
        loadedEscalations,
      ] = await Promise.all([
        getResident(clientId),
        getMedications(clientId),
        getCareStageHistory(clientId),
        getVisitNotes(clientId),
        getHealthLogs(clientId),
        getEscalations(clientId),
      ])
      setResident(loadedResident ?? null)
      setMedications(loadedMedications)
      setCareStageHistory(loadedCareStageHistory)
      setNotes(loadedNotes)
      setHealthLogs(loadedHealthLogs)
      setEscalations(loadedEscalations)
      setLoadError(false)
    } catch {
      setLoadError(true)
    }
  }, [clientId])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  // Background transcription (VoiceNoteScreen) can complete while this
  // screen is on-screen but not regaining focus — subscribe so the Notes
  // tab (and the pending/failed/complete state below) fills in live.
  useEffect(() => subscribe(load), [load])

  useEffect(() => {
    if (route.params.savedBaseline && !consumedSavedBaseline.current) {
      consumedSavedBaseline.current = true
      setConfirmationMessage('Baseline recorded')
      const timer = setTimeout(() => setConfirmationMessage(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [route.params.savedBaseline])

  useEffect(() => {
    if (route.params.savedEscalation && !consumedSavedEscalation.current) {
      consumedSavedEscalation.current = true
      // Recorded, not sent — delivery through either control on
      // EscalationScreen is never confirmed.
      setConfirmationMessage('Escalation recorded')
      const timer = setTimeout(() => setConfirmationMessage(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [route.params.savedEscalation])

  const openBaseline = useCallback(() => {
    navigation.navigate('Baseline', { clientId, clientName })
  }, [navigation, clientId, clientName])

  const openCareStageModal = useCallback(() => {
    navigation.navigate('CareStageModal', { clientId, clientName })
  }, [navigation, clientId, clientName])

  const openVoiceNote = useCallback(() => {
    navigation.navigate('VoiceNote', { clientId, clientName })
  }, [navigation, clientId, clientName])

  const openNoteReview = useCallback(
    (noteId: string) => {
      navigation.navigate('NoteReview', { noteId })
    },
    [navigation]
  )

  const openObservation = useCallback(() => {
    navigation.navigate('Observation', { clientId, clientName, mode: 'carer' })
  }, [navigation, clientId, clientName])

  const openEscalation = useCallback(() => {
    if (!resident) return
    navigation.navigate('Escalation', {
      clientId,
      clientName,
      physicianName: resident.physician_name,
      physicianEmail: resident.physician_email,
    })
  }, [navigation, clientId, clientName, resident])

  const onRecordOutcome = useCallback(async (escalationId: string, outcome: string) => {
    await recordEscalationOutcome(escalationId, outcome)
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color={COLORS.text} />
        </Pressable>
        <AppText weight="bold" style={styles.headerTitle} numberOfLines={1}>
          {resident ? `${resident.first_name} ${resident.last_name}` : clientName}
        </AppText>
        <Pressable
          onPress={openObservation}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Log observation"
        >
          <HeartPulse size={20} color={COLORS.primary} />
        </Pressable>
        <Pressable
          onPress={openVoiceNote}
          style={styles.recordButton}
          accessibilityRole="button"
          accessibilityLabel="Record note"
        >
          <Mic size={18} color={COLORS.primary} />
          <AppText weight="semibold" style={styles.recordButtonText}>
            Record note
          </AppText>
        </Pressable>
      </View>

      {confirmationMessage ? (
        <View style={styles.confirmationBanner}>
          <AppText weight="semibold" style={styles.confirmationBannerText}>
            {confirmationMessage}
          </AppText>
        </View>
      ) : null}

      <View style={styles.tabBar}>
        <TabButton label="Profile" active={tab === 'profile'} onPress={() => setTab('profile')} />
        <TabButton label="Notes" active={tab === 'notes'} onPress={() => setTab('notes')} />
        <TabButton label="History" active={tab === 'history'} onPress={() => setTab('history')} />
      </View>

      {loadError ? (
        <ErrorView message="Could not load this client" onRetry={load} />
      ) : tab === 'profile' ? (
        resident ? (
          <ProfileTab
            resident={resident}
            medications={medications}
            careStageHistory={careStageHistory}
            healthLogs={healthLogs}
            notes={notes}
            onOpenBaseline={openBaseline}
            onOpenCareStageModal={openCareStageModal}
            onOpenEscalation={openEscalation}
          />
        ) : (
          <LoadingView />
        )
      ) : tab === 'notes' ? (
        <NotesTab
          notes={notes}
          escalations={escalations}
          onOpenNote={openNoteReview}
          onRecordOutcome={onRecordOutcome}
        />
      ) : (
        <HistoryTab careStageHistory={careStageHistory} />
      )}
    </SafeAreaView>
  )
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.tabButton}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <AppText weight={active ? 'bold' : 'regular'} style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </AppText>
      <View style={[styles.tabUnderline, active && styles.tabUnderlineActive]} />
    </Pressable>
  )
}

function Section({
  borderColor,
  children,
}: {
  borderColor: string
  children: React.ReactNode
}) {
  return <View style={[styles.section, { borderLeftColor: borderColor }]}>{children}</View>
}

function conditionCountDisplay(count: number | null): string {
  if (count === null) return '—'
  return count >= 5 ? '5+' : `${count}`
}

function BaselineRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.baselineRow}>
      <AppText style={styles.baselineRowLabel}>{label}</AppText>
      <AppText weight="semibold" style={styles.baselineRowValue}>
        {value}
      </AppText>
    </View>
  )
}

function ProfileTab({
  resident,
  medications,
  careStageHistory,
  healthLogs,
  notes,
  onOpenBaseline,
  onOpenCareStageModal,
  onOpenEscalation,
}: {
  resident: Resident
  medications: Medication[]
  careStageHistory: CareStageHistoryEntry[]
  healthLogs: HealthLog[]
  notes: VisitNote[]
  onOpenBaseline: () => void
  onOpenCareStageModal: () => void
  onOpenEscalation: () => void
}) {
  const medicationGroups = groupMedications(medications.filter((m) => m.active))
  const contacts = [...resident.emergency_contacts].sort((a, b) => a.priority - b.priority)
  const latestTransition = careStageHistory[0]

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <Section borderColor={COLORS.primary}>
        {resident.baseline_recorded_at === null ? (
          <Pressable
            onPress={onOpenBaseline}
            hitSlop={{ top: 17, bottom: 17, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Baseline not yet recorded"
          >
            <AppText weight="semibold" style={styles.baselinePrompt}>
              Baseline not yet recorded
            </AppText>
          </Pressable>
        ) : null}
        <AppText weight="black" style={styles.identityName}>
          {resident.first_name} {resident.last_name}
        </AppText>
        <AppText style={styles.detailText}>
          {formatDob(resident.date_of_birth)} · Age {calculateAge(resident.date_of_birth)}
        </AppText>
        {resident.room_number ? (
          <AppText style={styles.detailText}>Room {resident.room_number}</AppText>
        ) : null}
      </Section>

      <Section borderColor={COLORS.primary}>
        <View style={styles.careStageHeadingRow}>
          <AppText weight="bold" style={[styles.sectionHeading, styles.careStageHeadingText]}>
            Living situation
          </AppText>
          <Pressable
            onPress={onOpenCareStageModal}
            hitSlop={{ top: 17, bottom: 17, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Change living situation"
          >
            <AppText weight="semibold" style={styles.changeLink}>
              Change
            </AppText>
          </Pressable>
        </View>
        <View style={styles.stagePill}>
          <AppText weight="bold" style={styles.stagePillText}>
            {CARE_STAGE_LABELS[resident.care_stage]}
          </AppText>
        </View>
        <AppText style={styles.sinceText}>
          Since {formatMonthYear(resident.care_stage_estimated_since)}
        </AppText>
        {latestTransition?.from_stage ? (
          <AppText style={styles.sinceText}>
            Previously {CARE_STAGE_LABELS[latestTransition.from_stage]} until{' '}
            {formatMonthYear(latestTransition.estimated_since)}
          </AppText>
        ) : null}
      </Section>

      {resident.baseline_recorded_at !== null ? (
        <Section borderColor={COLORS.textMuted}>
          <AppText weight="bold" style={styles.sectionHeading}>
            Baseline at enrolment
          </AppText>
          <BaselineRow label="Age" value={`${resident.baseline_age}`} />
          <BaselineRow label="Lives alone" value={resident.baseline_lives_alone ? 'Yes' : 'No'} />
          <BaselineRow label="Long-term conditions" value={conditionCountDisplay(resident.baseline_condition_count)} />
          <BaselineRow
            label="Mobility aid"
            value={resident.baseline_mobility_aid ? MOBILITY_AID_LABELS[resident.baseline_mobility_aid] : '—'}
          />
          <BaselineRow label="Support in place" value={resident.baseline_support_note || '—'} />
          <AppText style={styles.baselineRecordedAt}>
            Recorded {formatDob(resident.baseline_recorded_at)}
          </AppText>
        </Section>
      ) : null}

      <TrendsCard healthLogs={healthLogs} notes={notes} />

      <Section borderColor={COLORS.danger}>
        <AppText weight="bold" style={[styles.sectionHeading, { color: COLORS.danger }]}>
          Allergies
        </AppText>
        {resident.allergies.length === 0 ? (
          <AppText style={styles.emptyNote}>None recorded</AppText>
        ) : (
          <View style={styles.chipRow}>
            {resident.allergies.map((allergy) => (
              <View key={allergy} style={styles.allergyChip}>
                <AppText weight="semibold" style={styles.allergyChipText}>
                  {allergy}
                </AppText>
              </View>
            ))}
          </View>
        )}
      </Section>

      <Section borderColor={COLORS.amber}>
        <AppText weight="bold" style={styles.sectionHeading}>
          In her own words
        </AppText>
        {resident.independence_goals.length === 0 ? (
          <AppText style={styles.emptyNote}>No goals recorded yet</AppText>
        ) : (
          resident.independence_goals.map((goal, index) => (
            <AppText key={index} style={styles.goalText}>
              {goal.text}
            </AppText>
          ))
        )}
      </Section>

      <Section borderColor={COLORS.primary}>
        <AppText weight="bold" style={styles.sectionHeading}>
          Medications ({medicationGroups.length})
        </AppText>
        {medicationGroups.map((group) => (
          <View key={group.key} style={styles.medicationRow}>
            <AppText weight="bold" style={styles.medicationName}>
              {group.name}
            </AppText>
            <AppText style={styles.detailText}>{group.dosage}</AppText>
            <View style={styles.chipRow}>
              {group.times.map((time) => (
                <View key={time} style={styles.timeChip}>
                  <AppText style={styles.timeChipText}>{time}</AppText>
                </View>
              ))}
            </View>
          </View>
        ))}
        <AppText style={styles.medicationFootnote}>
          Reference only. Not a medication administration record.
        </AppText>
      </Section>

      <Section borderColor={COLORS.blue}>
        <AppText weight="bold" style={styles.sectionHeading}>
          Physician
        </AppText>
        <AppText style={styles.physicianName}>{resident.physician_name}</AppText>
        <AppText style={[styles.detailText, { color: COLORS.blue }]}>{resident.physician_email}</AppText>
        <Pressable
          onPress={onOpenEscalation}
          style={styles.raiseButton}
          accessibilityRole="button"
          accessibilityLabel="Raise with physician"
        >
          <AppText weight="bold" style={styles.raiseButtonText}>
            Raise with physician
          </AppText>
        </Pressable>
      </Section>

      <Section borderColor={COLORS.blue}>
        <AppText weight="bold" style={styles.sectionHeading}>
          Contacts
        </AppText>
        {contacts.map((contact) => (
          <View key={contact.name} style={styles.contactRow}>
            <AppText weight="bold" style={styles.physicianName}>
              {contact.name}
            </AppText>
            <AppText style={styles.detailText}>
              {contact.relationship} · {contact.phone}
            </AppText>
          </View>
        ))}
      </Section>
    </ScrollView>
  )
}

function sameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10)
}

// The last 14 calendar days, oldest first, as ISO date-only strings — a day
// with no log renders as an empty circle, which only makes sense against
// fixed days rather than a compacted list of entries.
function last14Days(): string[] {
  const days: string[] = []
  const today = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

// logs is sorted most-recent-first; the first match for a day is that day's
// most recent entry with a non-null value for this field.
function valueForDay(logs: HealthLog[], day: string, field: 'mood' | 'pain'): number | null {
  for (const log of logs) {
    if (sameDay(log.created_at, day) && log[field] !== null) {
      return log[field]
    }
  }
  return null
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

// "If any prompt was set within the last 90 days" — aggregated across every
// note in that window, not just the most recent one, so a hearing prompt
// from one visit and a continence prompt from another both still show.
function flaggedPrompts(notes: VisitNote[]): string[] {
  const cutoff = Date.now() - NINETY_DAYS_MS
  const recentNotes = notes.filter((n) => new Date(n.created_at).getTime() >= cutoff)
  const flags: string[] = []
  if (recentNotes.some((n) => n.ask_about_hearing)) flags.push('hearing')
  if (recentNotes.some((n) => n.ask_about_vision)) flags.push('vision')
  if (recentNotes.some((n) => n.ask_about_continence)) flags.push('continence')
  return flags
}

function TrendsCard({ healthLogs, notes }: { healthLogs: HealthLog[]; notes: VisitNote[] }) {
  const flags = flaggedPrompts(notes)

  if (healthLogs.length === 0) {
    return (
      <Section borderColor={COLORS.border}>
        <AppText weight="bold" style={styles.sectionHeading}>
          Recent observations
        </AppText>
        {flags.length > 0 ? (
          <AppText style={styles.flaggedPromptsText}>Flagged to ask about: {flags.join(', ')}</AppText>
        ) : null}
        <AppText style={styles.emptyNote}>No observations recorded yet</AppText>
      </Section>
    )
  }

  const days = last14Days()
  const weightReadings = healthLogs
    .filter((log) => log.weight_kg !== null)
    .slice(0, 12)
    .reverse() as (HealthLog & { weight_kg: number })[]
  const weightValues = weightReadings.map((log) => log.weight_kg)
  const weightMin = Math.min(...weightValues)
  const weightMax = Math.max(...weightValues)

  return (
    <Section borderColor={COLORS.border}>
      <AppText weight="bold" style={styles.sectionHeading}>
        Recent observations
      </AppText>
      {flags.length > 0 ? (
        <AppText style={styles.flaggedPromptsText}>Flagged to ask about: {flags.join(', ')}</AppText>
      ) : null}

      <AppText style={styles.trendLabel}>Mood</AppText>
      <View style={styles.dayRow}>
        {days.map((day) => {
          const value = valueForDay(healthLogs, day, 'mood')
          return (
            <View
              key={day}
              style={value === null ? styles.dayCircleEmpty : [styles.dayCircleFilled, { backgroundColor: moodBandColor(value) }]}
            />
          )
        })}
      </View>
      <AppText style={styles.trendCaption}>Last 14 days</AppText>

      {weightReadings.length > 0 ? (
        <>
          <AppText style={[styles.trendLabel, styles.trendSpacing]}>Weight</AppText>
          <View style={styles.sparklineRow}>
            {weightReadings.map((log, index) => {
              const isLatest = index === weightReadings.length - 1
              const range = weightMax - weightMin
              const height = range === 0 ? 60 : Math.max(4, ((log.weight_kg - weightMin) / range) * 60)
              return (
                <View
                  key={log.id}
                  style={[
                    styles.sparklineBar,
                    { height, backgroundColor: isLatest ? COLORS.text : COLORS.border },
                  ]}
                />
              )
            })}
          </View>
          <AppText style={styles.trendCaption2}>
            First recorded {weightReadings[0].weight_kg} kg on {formatDob(weightReadings[0].created_at)}, most
            recent {weightReadings[weightReadings.length - 1].weight_kg} kg on{' '}
            {formatDob(weightReadings[weightReadings.length - 1].created_at)}
          </AppText>
        </>
      ) : null}

      <AppText style={[styles.trendLabel, styles.trendSpacing]}>Pain</AppText>
      <View style={styles.dayRow}>
        {days.map((day) => {
          const value = valueForDay(healthLogs, day, 'pain')
          return (
            <View
              key={day}
              style={value === null ? styles.dayCircleEmpty : [styles.dayCircleFilled, { backgroundColor: painBandColor(value) }]}
            />
          )
        })}
      </View>
      <AppText style={styles.trendCaption}>Last 14 days</AppText>
    </Section>
  )
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

const OUTCOME_OPTIONS = [
  'Physician reviewed, change made',
  'Physician reviewed, no change',
  'Raised, no response yet',
  'Not raised in the end',
]

function NotesTab({
  notes,
  escalations,
  onOpenNote,
  onRecordOutcome,
}: {
  notes: VisitNote[]
  escalations: Escalation[]
  onOpenNote: (noteId: string) => void
  onRecordOutcome: (escalationId: string, outcome: string) => void
}) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {notes.length === 0 ? (
        <EmptyView icon={FileText} message="No notes recorded yet" />
      ) : (
        notes.map((note) => (
          <NoteRow
            key={note.id}
            note={note}
            escalation={escalations.find((e) => e.visit_note_id === note.id) ?? null}
            onPress={() => onOpenNote(note.id)}
            onRecordOutcome={onRecordOutcome}
          />
        ))
      )}
    </ScrollView>
  )
}

function NoteRow({
  note,
  escalation,
  onPress,
  onRecordOutcome,
}: {
  note: VisitNote
  escalation: Escalation | null
  onPress: () => void
  onRecordOutcome: (escalationId: string, outcome: string) => void
}) {
  const isUnreviewedComplete = note.transcription_status === 'complete' && note.reviewed_at === null
  const isFailed = note.transcription_status === 'failed'
  const isTappable = isUnreviewedComplete || isFailed

  const content = (
    <>
      <AppText weight="bold" style={styles.noteMeta}>
        {formatDateTime(note.created_at)}
        {note.visit_type ? ` · ${note.visit_type}` : ''}
      </AppText>
      {note.physician_flagged && escalation ? (
        escalation.flag_outcome === null ? (
          <View style={styles.outcomeBar}>
            <AppText weight="bold" style={styles.outcomeBarTitle}>
              Raised with physician on {formatDateTime(escalation.created_at)}
            </AppText>
            <AppText style={styles.outcomeQuestion}>What happened?</AppText>
            <View style={styles.outcomeOptions}>
              {OUTCOME_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => onRecordOutcome(escalation.id, option)}
                  style={styles.outcomeButton}
                  accessibilityRole="button"
                  accessibilityLabel={option}
                >
                  <AppText style={styles.outcomeButtonText}>{option}</AppText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <AppText style={styles.outcomeSummary}>
            {escalation.flag_outcome} - {formatDateTime(escalation.flag_outcome_at as string)}
          </AppText>
        )
      ) : null}
      {note.transcription_status === 'pending' ? (
        <View style={styles.noteStatusRow}>
          <ActivityIndicator size="small" color={COLORS.textMuted} />
          <AppText style={styles.noteTranscribing}>Transcribing</AppText>
        </View>
      ) : isFailed ? (
        <AppText style={styles.noteFailed}>
          Transcription unavailable. Tap to type the note.
        </AppText>
      ) : (
        <>
          {isUnreviewedComplete ? (
            <View style={styles.needsCheckingRow}>
              <View style={styles.amberDot} />
              <AppText weight="semibold" style={styles.needsCheckingText}>
                Needs checking
              </AppText>
            </View>
          ) : null}
          <AppText style={styles.noteTranscript}>{note.transcript}</AppText>
          {note.tasks_completed ? (
            <AppText style={styles.noteTasks}>{note.tasks_completed}</AppText>
          ) : null}
        </>
      )}
    </>
  )

  if (isTappable) {
    return (
      <Pressable
        onPress={onPress}
        style={styles.noteCard}
        accessibilityRole="button"
        accessibilityLabel="Review note"
      >
        {content}
      </Pressable>
    )
  }

  return <View style={styles.noteCard}>{content}</View>
}

function HistoryTab({ careStageHistory }: { careStageHistory: CareStageHistoryEntry[] }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <Section borderColor={COLORS.textMuted}>
        <AppText weight="bold" style={styles.sectionHeading}>
          Transitions
        </AppText>
        {careStageHistory.length === 0 ? (
          <AppText style={styles.emptyNote}>No transitions recorded</AppText>
        ) : (
          careStageHistory.map((entry) => (
            <View key={entry.id} style={styles.transitionRow}>
              <AppText weight="bold" style={styles.transitionLabel}>
                {entry.from_stage ? `${CARE_STAGE_LABELS[entry.from_stage]} → ` : ''}
                {CARE_STAGE_LABELS[entry.to_stage]}
              </AppText>
              <AppText style={styles.detailText}>Since {formatDob(entry.estimated_since)}</AppText>
              {!sameDay(entry.estimated_since, entry.observed_at) ? (
                <AppText style={styles.detailText}>Recorded {formatDob(entry.observed_at)}</AppText>
              ) : null}
              {entry.note ? <AppText style={styles.transitionNote}>{entry.note}</AppText> : null}
            </View>
          ))
        )}
      </Section>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: SPACE.xs,
  },
  backButton: {
    width: TOUCH.standard,
    height: TOUCH.standard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: TYPE.h2,
    color: COLORS.text,
  },
  iconButton: {
    width: TOUCH.standard,
    height: TOUCH.standard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH.standard,
    paddingHorizontal: SPACE.sm,
    gap: 6,
  },
  recordButtonText: {
    fontSize: TYPE.small,
    color: COLORS.primary,
  },
  confirmationBanner: {
    marginHorizontal: 16,
    marginTop: SPACE.sm,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.successLight,
    alignItems: 'center',
  },
  confirmationBannerText: {
    fontSize: TYPE.small,
    color: COLORS.successDark,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 8,
  },
  tabButton: {
    minHeight: TOUCH.standard,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: TYPE.body,
    color: COLORS.textMuted,
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
  tabUnderline: {
    marginTop: 6,
    height: 2,
    width: '100%',
    backgroundColor: 'transparent',
  },
  tabUnderlineActive: {
    backgroundColor: COLORS.primary,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: SPACE.xl,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 18,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  baselinePrompt: {
    fontSize: TYPE.small,
    color: COLORS.amber,
    marginBottom: SPACE.sm,
  },
  careStageHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  careStageHeadingText: {
    color: COLORS.primaryDark,
    marginBottom: 0,
  },
  changeLink: {
    fontSize: TYPE.small,
    color: COLORS.primary,
  },
  stagePill: {
    alignSelf: 'flex-start',
    marginTop: SPACE.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight,
  },
  stagePillText: {
    fontSize: 18,
    color: COLORS.primaryDark,
  },
  sinceText: {
    marginTop: SPACE.sm,
    fontSize: TYPE.small,
    color: COLORS.textMuted,
  },
  transitionRow: {
    marginBottom: SPACE.md,
  },
  transitionLabel: {
    fontSize: TYPE.body,
    color: COLORS.text,
    marginBottom: 4,
  },
  transitionNote: {
    marginTop: 4,
    fontSize: 16,
    color: COLORS.textSecond,
    fontStyle: 'italic',
  },
  baselineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACE.xs,
  },
  baselineRowLabel: {
    fontSize: 16,
    color: COLORS.textSecond,
  },
  baselineRowValue: {
    fontSize: 16,
    color: COLORS.text,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: SPACE.md,
  },
  baselineRecordedAt: {
    marginTop: SPACE.sm,
    fontSize: TYPE.caption,
    color: COLORS.textMuted,
  },
  identityName: {
    fontSize: 24,
    color: COLORS.primaryDark,
  },
  detailText: {
    marginTop: 4,
    fontSize: 16,
    color: COLORS.textSecond,
  },
  sectionHeading: {
    fontSize: TYPE.body,
    color: COLORS.text,
    marginBottom: SPACE.sm,
  },
  emptyNote: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  goalText: {
    fontSize: TYPE.body,
    color: COLORS.text,
    marginTop: SPACE.xs,
  },
  flaggedPromptsText: {
    fontSize: TYPE.small,
    color: COLORS.textSecond,
    marginBottom: SPACE.sm,
  },
  trendLabel: {
    fontSize: TYPE.small,
    color: COLORS.text,
    marginBottom: SPACE.sm,
  },
  trendSpacing: {
    marginTop: SPACE.md,
  },
  dayRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dayCircleEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayCircleFilled: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  trendCaption: {
    marginTop: SPACE.xs,
    fontSize: TYPE.caption,
    color: COLORS.textMuted,
  },
  sparklineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
  },
  sparklineBar: {
    width: 4,
    borderRadius: 2,
  },
  trendCaption2: {
    marginTop: SPACE.xs,
    fontSize: TYPE.small,
    color: COLORS.textSecond,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
  allergyChip: {
    height: 32,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 12,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allergyChipText: {
    fontSize: TYPE.small,
    color: COLORS.danger,
  },
  medicationRow: {
    marginBottom: SPACE.md,
  },
  medicationName: {
    fontSize: TYPE.body,
    color: COLORS.text,
  },
  timeChip: {
    height: 28,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  timeChipText: {
    fontSize: TYPE.caption,
    color: COLORS.textSecond,
  },
  medicationFootnote: {
    marginTop: SPACE.xs,
    fontSize: TYPE.caption,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  physicianName: {
    fontSize: TYPE.body,
    color: COLORS.text,
  },
  raiseButton: {
    marginTop: SPACE.md,
    minHeight: TOUCH.standard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  raiseButtonText: {
    fontSize: TYPE.small,
    color: COLORS.danger,
  },
  contactRow: {
    marginBottom: SPACE.sm,
  },
  noteCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 18,
    marginBottom: 12,
  },
  noteMeta: {
    fontSize: TYPE.small,
    color: COLORS.textMuted,
    marginBottom: SPACE.sm,
  },
  outcomeBar: {
    marginBottom: SPACE.sm,
  },
  outcomeBarTitle: {
    fontSize: TYPE.small,
    color: COLORS.danger,
    marginBottom: SPACE.sm,
  },
  outcomeQuestion: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: SPACE.sm,
  },
  outcomeOptions: {
    gap: SPACE.xs,
  },
  outcomeButton: {
    // The guide specifies 44pt; bumped to the carer 52pt minimum tap
    // target per CLAUDE.md, which takes precedence over guide specifics.
    minHeight: TOUCH.standard,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.sm,
  },
  outcomeButtonText: {
    fontSize: TYPE.small,
    color: COLORS.text,
    textAlign: 'center',
  },
  outcomeSummary: {
    fontSize: TYPE.small,
    color: COLORS.textSecond,
    marginBottom: SPACE.sm,
  },
  noteStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  noteTranscribing: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  noteFailed: {
    fontSize: 16,
    color: COLORS.amber,
  },
  needsCheckingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  amberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.amber,
  },
  needsCheckingText: {
    fontSize: TYPE.small,
    color: COLORS.amber,
  },
  noteTranscript: {
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.text,
  },
  noteTasks: {
    marginTop: 6,
    fontSize: TYPE.small,
    color: COLORS.textSecond,
  },
})
