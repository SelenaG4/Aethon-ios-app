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
import { ArrowLeft, Check, FileText, HeartPulse, Mic } from 'lucide-react-native'
import { AppText, EmptyView, ErrorView, LoadingView } from '../../components'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../../constants/theme'
import {
  getCareStageHistory,
  getEscalations,
  getHealthLogs,
  getMedications,
  getResident,
  getVisitNotes,
  Language,
  recordEscalationOutcome,
  subscribe,
} from '../../lib/data'
import { moodBandColor, painBandColor } from '../../lib/observations'
import {
  formatMonthYear as formatMonthYearI18n,
  formatShortDateTime,
  formatShortYearDate,
  LANGUAGE_LABELS,
  OUTCOME_OPTIONS,
  translateOutcome,
  translateTaskList,
  translateVisitType,
  TranslationKey,
  useTranslation,
} from '../../lib/i18n'
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

const MOBILITY_AID_KEYS: Record<MobilityAid, TranslationKey> = {
  none: 'clientProfile.mobility.none',
  stick: 'clientProfile.mobility.stick',
  frame: 'clientProfile.mobility.frame',
  wheelchair: 'clientProfile.mobility.wheelchair',
}

// Kept as the guide's own plain labels for now — CLAUDE.md says these will
// be checked against the vocabulary carers actually use in a later pass.
const CARE_STAGE_KEYS: Record<CareStage, TranslationKey> = {
  independent: 'clientProfile.careStage.independent',
  family_supported: 'clientProfile.careStage.family_supported',
  professionally_supported: 'clientProfile.careStage.professionally_supported',
  residential: 'clientProfile.careStage.residential',
}

function formatDob(dob: string, language: Language): string {
  return formatShortYearDate(dob, language)
}

function formatMonthYear(iso: string, language: Language): string {
  return formatMonthYearI18n(iso, language)
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
  const { t } = useTranslation()
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
      setConfirmationMessage(t('clientProfile.baselineRecorded'))
      const timer = setTimeout(() => setConfirmationMessage(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [route.params.savedBaseline, t])

  useEffect(() => {
    if (route.params.savedEscalation && !consumedSavedEscalation.current) {
      consumedSavedEscalation.current = true
      // Recorded, not sent — delivery through either control on
      // EscalationScreen is never confirmed.
      setConfirmationMessage(t('clientProfile.escalationRecorded'))
      const timer = setTimeout(() => setConfirmationMessage(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [route.params.savedEscalation, t])

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
          accessibilityLabel={t('common.back')}
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
          accessibilityLabel={t('clientProfile.logObservation')}
        >
          <HeartPulse size={20} color={COLORS.primary} />
        </Pressable>
        <Pressable
          onPress={openVoiceNote}
          style={styles.recordButton}
          accessibilityRole="button"
          accessibilityLabel={t('clientProfile.recordNote')}
        >
          <Mic size={18} color={COLORS.primary} />
          <AppText weight="semibold" style={styles.recordButtonText}>
            {t('clientProfile.recordNote')}
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
        <TabButton label={t('clientProfile.tabProfile')} active={tab === 'profile'} onPress={() => setTab('profile')} />
        <TabButton label={t('clientProfile.tabNotes')} active={tab === 'notes'} onPress={() => setTab('notes')} />
        <TabButton label={t('clientProfile.tabHistory')} active={tab === 'history'} onPress={() => setTab('history')} />
      </View>

      {loadError ? (
        <ErrorView message={t('clientProfile.loadError')} onRetry={load} />
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
  const { t, language, setLanguage } = useTranslation()
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
            accessibilityLabel={t('clientProfile.baselineNotRecorded')}
          >
            <AppText weight="semibold" style={styles.baselinePrompt}>
              {t('clientProfile.baselineNotRecorded')}
            </AppText>
          </Pressable>
        ) : null}
        <AppText weight="black" style={styles.identityName}>
          {resident.first_name} {resident.last_name}
        </AppText>
        <AppText style={styles.detailText}>
          {formatDob(resident.date_of_birth, language)} ·{' '}
          {t('clientProfile.age', { age: calculateAge(resident.date_of_birth) })}
        </AppText>
        {resident.room_number ? (
          <AppText style={styles.detailText}>{t('clientProfile.room', { room: resident.room_number })}</AppText>
        ) : null}
      </Section>

      <Section borderColor={COLORS.primary}>
        <View style={styles.careStageHeadingRow}>
          <AppText weight="bold" style={[styles.sectionHeading, styles.careStageHeadingText]}>
            {t('clientProfile.livingSituation')}
          </AppText>
          <Pressable
            onPress={onOpenCareStageModal}
            hitSlop={{ top: 17, bottom: 17, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={t('clientProfile.change')}
          >
            <AppText weight="semibold" style={styles.changeLink}>
              {t('clientProfile.change')}
            </AppText>
          </Pressable>
        </View>
        <View style={styles.stagePill}>
          <AppText weight="bold" style={styles.stagePillText}>
            {t(CARE_STAGE_KEYS[resident.care_stage])}
          </AppText>
        </View>
        <AppText style={styles.sinceText}>
          {t('clientProfile.since', { date: formatMonthYear(resident.care_stage_estimated_since, language) })}
        </AppText>
        {latestTransition?.from_stage ? (
          <AppText style={styles.sinceText}>
            {t('clientProfile.previouslyUntil', {
              stage: t(CARE_STAGE_KEYS[latestTransition.from_stage]),
              date: formatMonthYear(latestTransition.estimated_since, language),
            })}
          </AppText>
        ) : null}
      </Section>

      {resident.baseline_recorded_at !== null ? (
        <Section borderColor={COLORS.textMuted}>
          <AppText weight="bold" style={styles.sectionHeading}>
            {t('clientProfile.baselineAtEnrolment')}
          </AppText>
          <BaselineRow label={t('clientProfile.baselineFieldAge')} value={`${resident.baseline_age}`} />
          <BaselineRow
            label={t('clientProfile.baselineFieldLivesAlone')}
            value={resident.baseline_lives_alone ? t('common.yes') : t('common.no')}
          />
          <BaselineRow
            label={t('clientProfile.baselineFieldConditions')}
            value={conditionCountDisplay(resident.baseline_condition_count)}
          />
          <BaselineRow
            label={t('clientProfile.baselineFieldMobility')}
            value={
              resident.baseline_mobility_aid ? t(MOBILITY_AID_KEYS[resident.baseline_mobility_aid]) : '—'
            }
          />
          <BaselineRow label={t('clientProfile.baselineFieldSupport')} value={resident.baseline_support_note || '—'} />
          <AppText style={styles.baselineRecordedAt}>
            {t('clientProfile.baselineRecordedAt', { date: formatDob(resident.baseline_recorded_at, language) })}
          </AppText>
        </Section>
      ) : null}

      <TrendsCard healthLogs={healthLogs} notes={notes} />

      <Section borderColor={COLORS.danger}>
        <AppText weight="bold" style={[styles.sectionHeading, { color: COLORS.danger }]}>
          {t('clientProfile.allergies')}
        </AppText>
        {resident.allergies.length === 0 ? (
          <AppText style={styles.emptyNote}>{t('clientProfile.noneRecorded')}</AppText>
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
          {t('clientProfile.inHerOwnWords')}
        </AppText>
        {resident.independence_goals.length === 0 ? (
          <AppText style={styles.emptyNote}>{t('clientProfile.noGoalsYet')}</AppText>
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
          {t('clientProfile.medicationsCount', { count: medicationGroups.length })}
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
        <AppText style={styles.medicationFootnote}>{t('clientProfile.medicationFootnote')}</AppText>
      </Section>

      <Section borderColor={COLORS.blue}>
        <AppText weight="bold" style={styles.sectionHeading}>
          {t('clientProfile.physician')}
        </AppText>
        <AppText style={styles.physicianName}>{resident.physician_name}</AppText>
        <AppText style={[styles.detailText, { color: COLORS.blue }]}>{resident.physician_email}</AppText>
        <Pressable
          onPress={onOpenEscalation}
          style={styles.raiseButton}
          accessibilityRole="button"
          accessibilityLabel={t('clientProfile.raiseWithPhysician')}
        >
          <AppText weight="bold" style={styles.raiseButtonText}>
            {t('clientProfile.raiseWithPhysician')}
          </AppText>
        </Pressable>
      </Section>

      <Section borderColor={COLORS.blue}>
        <AppText weight="bold" style={styles.sectionHeading}>
          {t('clientProfile.contacts')}
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

      <Section borderColor={COLORS.border}>
        <AppText weight="bold" style={styles.sectionHeading}>
          {t('profile.language')}
        </AppText>
        {(['en', 'de', 'fr', 'it'] as Language[]).map((code) => {
          const selected = language === code
          return (
            <Pressable
              key={code}
              onPress={() => setLanguage(code)}
              style={styles.languageRow}
              accessibilityRole="button"
              accessibilityLabel={LANGUAGE_LABELS[code]}
              accessibilityState={{ selected }}
            >
              <AppText weight={selected ? 'bold' : 'regular'} style={styles.languageRowText}>
                {LANGUAGE_LABELS[code]}
              </AppText>
              {selected ? <Check size={20} color={COLORS.primary} /> : null}
            </Pressable>
          )
        })}
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
  const { t, language } = useTranslation()
  const flags = flaggedPrompts(notes)

  if (healthLogs.length === 0) {
    return (
      <Section borderColor={COLORS.border}>
        <AppText weight="bold" style={styles.sectionHeading}>
          {t('clientProfile.recentObservations')}
        </AppText>
        {flags.length > 0 ? (
          <AppText style={styles.flaggedPromptsText}>
            {t('clientProfile.flaggedToAskAbout', { items: flags.join(', ') })}
          </AppText>
        ) : null}
        <AppText style={styles.emptyNote}>{t('clientProfile.noObservationsYet')}</AppText>
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
        {t('clientProfile.recentObservations')}
      </AppText>
      {flags.length > 0 ? (
        <AppText style={styles.flaggedPromptsText}>
          {t('clientProfile.flaggedToAskAbout', { items: flags.join(', ') })}
        </AppText>
      ) : null}

      <AppText style={styles.trendLabel}>{t('clientProfile.mood')}</AppText>
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
      <AppText style={styles.trendCaption}>{t('clientProfile.last14Days')}</AppText>

      {weightReadings.length > 0 ? (
        <>
          <AppText style={[styles.trendLabel, styles.trendSpacing]}>{t('clientProfile.weight')}</AppText>
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
            {t('clientProfile.weightSummary', {
              firstValue: weightReadings[0].weight_kg,
              firstDate: formatDob(weightReadings[0].created_at, language),
              lastValue: weightReadings[weightReadings.length - 1].weight_kg,
              lastDate: formatDob(weightReadings[weightReadings.length - 1].created_at, language),
            })}
          </AppText>
        </>
      ) : null}

      <AppText style={[styles.trendLabel, styles.trendSpacing]}>{t('clientProfile.pain')}</AppText>
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
      <AppText style={styles.trendCaption}>{t('clientProfile.last14Days')}</AppText>
    </Section>
  )
}

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
  const { t } = useTranslation()
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {notes.length === 0 ? (
        <EmptyView icon={FileText} message={t('clientProfile.noNotesRecordedYet')} />
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
  const { t, language } = useTranslation()
  const isUnreviewedComplete = note.transcription_status === 'complete' && note.reviewed_at === null
  const isFailed = note.transcription_status === 'failed'
  const isTappable = isUnreviewedComplete || isFailed

  const content = (
    <>
      <AppText weight="bold" style={styles.noteMeta}>
        {formatShortDateTime(note.created_at, language)}
        {note.visit_type ? ` · ${translateVisitType(note.visit_type, t)}` : ''}
      </AppText>
      {note.physician_flagged && escalation ? (
        escalation.flag_outcome === null ? (
          <View style={styles.outcomeBar}>
            <AppText weight="bold" style={styles.outcomeBarTitle}>
              {t('clientProfile.raisedWithPhysicianOn', {
                date: formatShortDateTime(escalation.created_at, language),
              })}
            </AppText>
            <AppText style={styles.outcomeQuestion}>{t('clientProfile.whatHappened')}</AppText>
            <View style={styles.outcomeOptions}>
              {OUTCOME_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => onRecordOutcome(escalation.id, option.value)}
                  style={styles.outcomeButton}
                  accessibilityRole="button"
                  accessibilityLabel={t(option.labelKey)}
                >
                  <AppText style={styles.outcomeButtonText}>{t(option.labelKey)}</AppText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <AppText style={styles.outcomeSummary}>
            {translateOutcome(escalation.flag_outcome, t)} -{' '}
            {formatShortDateTime(escalation.flag_outcome_at as string, language)}
          </AppText>
        )
      ) : null}
      {note.transcription_status === 'pending' ? (
        <View style={styles.noteStatusRow}>
          <ActivityIndicator size="small" color={COLORS.textMuted} />
          <AppText style={styles.noteTranscribing}>{t('clientProfile.transcribing')}</AppText>
        </View>
      ) : isFailed ? (
        <AppText style={styles.noteFailed}>{t('clientProfile.transcriptionUnavailable')}</AppText>
      ) : (
        <>
          {isUnreviewedComplete ? (
            <View style={styles.needsCheckingRow}>
              <View style={styles.amberDot} />
              <AppText weight="semibold" style={styles.needsCheckingText}>
                {t('clientProfile.needsChecking')}
              </AppText>
            </View>
          ) : null}
          <AppText style={styles.noteTranscript}>{note.transcript}</AppText>
          {note.tasks_completed ? (
            <AppText style={styles.noteTasks}>{translateTaskList(note.tasks_completed, t)}</AppText>
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
        accessibilityLabel={t('clientProfile.reviewNote')}
      >
        {content}
      </Pressable>
    )
  }

  return <View style={styles.noteCard}>{content}</View>
}

function HistoryTab({ careStageHistory }: { careStageHistory: CareStageHistoryEntry[] }) {
  const { t, language } = useTranslation()
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <Section borderColor={COLORS.textMuted}>
        <AppText weight="bold" style={styles.sectionHeading}>
          {t('clientProfile.transitions')}
        </AppText>
        {careStageHistory.length === 0 ? (
          <AppText style={styles.emptyNote}>{t('clientProfile.noTransitionsRecorded')}</AppText>
        ) : (
          careStageHistory.map((entry) => (
            <View key={entry.id} style={styles.transitionRow}>
              <AppText weight="bold" style={styles.transitionLabel}>
                {entry.from_stage ? `${t(CARE_STAGE_KEYS[entry.from_stage])} → ` : ''}
                {t(CARE_STAGE_KEYS[entry.to_stage])}
              </AppText>
              <AppText style={styles.detailText}>
                {t('clientProfile.transitionSince', { date: formatDob(entry.estimated_since, language) })}
              </AppText>
              {!sameDay(entry.estimated_since, entry.observed_at) ? (
                <AppText style={styles.detailText}>
                  {t('clientProfile.transitionRecorded', { date: formatDob(entry.observed_at, language) })}
                </AppText>
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
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TOUCH.standard,
  },
  languageRowText: {
    fontSize: TYPE.body,
    color: COLORS.text,
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
