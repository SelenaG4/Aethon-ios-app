import AsyncStorage from '@react-native-async-storage/async-storage'
import { NativeModules } from 'react-native'
import {
  residents as initialResidents,
  medications as initialMedications,
  medicationAcknowledgements as initialMedicationAcknowledgements,
  visitNotes as initialVisitNotes,
  escalations as initialEscalations,
  messages as initialMessages,
  healthLogs as initialHealthLogs,
  careStageHistory as initialCareStageHistory,
  shifts as initialShifts,
  assistanceRequests as initialAssistanceRequests,
  Resident,
  Medication,
  MedicationAcknowledgement,
  VisitNote,
  Escalation,
  Message,
  HealthLog,
  CareStage,
  CareStageHistoryEntry,
  TranscriptionStatus,
  Shift,
  IndependenceGoal,
  AssistanceRequest,
} from './mockData'
import { levenshteinDistance } from './text'

// This is the only file screens should import to read or write data.
// Everything here runs against in-memory + AsyncStorage-backed mock data.
// When a backend is added, only the internals of this file should change.
//
// Table and field names mirror the web app (~/Developer/aethon-web), which
// reads/writes the same Supabase database this app will use later. See
// mockData.ts for which fields are additions this build needs that the web
// app doesn't have yet.

// Bump the version suffix whenever the shape of the mock data changes, so a
// device with an older cached shape falls back to cloneInitialData() instead
// of loading stale data that no longer matches the current types.
const STORAGE_KEY = '@aethon/mock_data_v16'
const VIEW_CHOICE_KEY = '@aethon/view_choice_v1'
const CURRENT_SHIFT_KEY = '@aethon/current_shift_id_v1'
const ONBOARDING_COMPLETE_KEY = '@aethon/onboarding_complete_v1'
const LANGUAGE_KEY = '@aethon/language_v1'

export type ViewChoice = 'carer' | 'resident'

// The app's display language. Independent of TRANSCRIPTION_LANGUAGE
// (src/constants/config.ts), which is what whisper.rn listens for in a
// voice note and stays pinned to German regardless of this setting.
export type Language = 'en' | 'de' | 'fr' | 'it'

// Used only until the resident/carer explicitly picks a language in
// Settings — after that, the persisted choice always wins. Reads the
// device's own locale via RN's built-in SettingsManager (iOS), so no extra
// native dependency is needed just for this.
function detectDeviceLanguage(): Language {
  const rawLocale: unknown =
    NativeModules.SettingsManager?.settings?.AppleLocale ??
    NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ??
    NativeModules.I18nManager?.localeIdentifier
  const code = typeof rawLocale === 'string' ? rawLocale.slice(0, 2).toLowerCase() : ''
  if (code === 'de' || code === 'fr' || code === 'it') return code
  return 'en'
}

export async function getLanguage(): Promise<Language> {
  const value = await AsyncStorage.getItem(LANGUAGE_KEY)
  if (value === 'en' || value === 'de' || value === 'fr' || value === 'it') return value
  return detectDeviceLanguage()
}

export async function setLanguage(language: Language): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, language)
}

// There is no sign-in yet, so every carer-facing screen runs as this fixed sample user.
export const CURRENT_CARER = {
  id: 'carer-test',
  name: 'Test Carer',
}

type Store = {
  residents: Resident[]
  medications: Medication[]
  medicationAcknowledgements: MedicationAcknowledgement[]
  visitNotes: VisitNote[]
  escalations: Escalation[]
  messages: Message[]
  healthLogs: HealthLog[]
  careStageHistory: CareStageHistoryEntry[]
  shifts: Shift[]
  assistanceRequests: AssistanceRequest[]
}

function cloneInitialData(): Store {
  return {
    residents: JSON.parse(JSON.stringify(initialResidents)),
    medications: JSON.parse(JSON.stringify(initialMedications)),
    medicationAcknowledgements: JSON.parse(JSON.stringify(initialMedicationAcknowledgements)),
    visitNotes: JSON.parse(JSON.stringify(initialVisitNotes)),
    escalations: JSON.parse(JSON.stringify(initialEscalations)),
    messages: JSON.parse(JSON.stringify(initialMessages)),
    healthLogs: JSON.parse(JSON.stringify(initialHealthLogs)),
    careStageHistory: JSON.parse(JSON.stringify(initialCareStageHistory)),
    shifts: JSON.parse(JSON.stringify(initialShifts)),
    assistanceRequests: JSON.parse(JSON.stringify(initialAssistanceRequests)),
  }
}

let store: Store | null = null
let loadPromise: Promise<Store> | null = null

async function loadStore(): Promise<Store> {
  if (store) return store
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY)
        store = raw ? (JSON.parse(raw) as Store) : cloneInitialData()
      } catch {
        store = cloneInitialData()
      }
      return store
    })()
  }
  return loadPromise
}

async function persist(): Promise<void> {
  if (!store) return
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  notify()
}

// Stands in for Supabase realtime subscriptions: any screen that wants to
// know about writes made elsewhere (for example a transcription completing
// in the background after the carer has already navigated away from
// VoiceNoteScreen) subscribes here and refetches. Combined with a
// useFocusEffect-driven refetch, this covers both "I navigated back to this
// screen" and "I'm already looking at this screen when the data changed".
type Listener = () => void
const listeners = new Set<Listener>()

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function notify(): void {
  listeners.forEach((listener) => listener())
}

export async function getResidents(): Promise<Resident[]> {
  const s = await loadStore()
  return s.residents
}

export async function getResident(id: string): Promise<Resident | undefined> {
  const s = await loadStore()
  return s.residents.find((r) => r.id === id)
}

export type BaselineInput = {
  baseline_age: number
  baseline_lives_alone: boolean
  baseline_condition_count: number
  baseline_mobility_aid: Resident['baseline_mobility_aid']
  baseline_support_note: string
}

// Captured once at enrolment; the caller enforces that this is only ever
// called when baseline_recorded_at is still null.
export async function updateResidentBaseline(
  residentId: string,
  baseline: BaselineInput
): Promise<Resident | undefined> {
  const s = await loadStore()
  const resident = s.residents.find((r) => r.id === residentId)
  if (!resident) return undefined
  resident.baseline_age = baseline.baseline_age
  resident.baseline_lives_alone = baseline.baseline_lives_alone
  resident.baseline_condition_count = baseline.baseline_condition_count
  resident.baseline_mobility_aid = baseline.baseline_mobility_aid
  resident.baseline_support_note = baseline.baseline_support_note
  resident.baseline_recorded_at = new Date().toISOString()
  await persist()
  return resident
}

export async function getCareStageHistory(residentId: string): Promise<CareStageHistoryEntry[]> {
  const s = await loadStore()
  return s.careStageHistory
    .filter((h) => h.resident_id === residentId)
    .sort((a, b) => b.observed_at.localeCompare(a.observed_at))
}

export type CareStageChangeInput = {
  to_stage: CareStage
  estimated_since: string
  note: string | null
}

// Writes both halves the guide calls for: the resident's current stage, and
// a new care_stage_history row. The history row is the important one — it's
// the only place "how long they stayed at the previous stage" is recorded.
export async function recordCareStageChange(
  residentId: string,
  input: CareStageChangeInput
): Promise<Resident | undefined> {
  const s = await loadStore()
  const resident = s.residents.find((r) => r.id === residentId)
  if (!resident) return undefined

  const observedAt = new Date().toISOString()
  const entry: CareStageHistoryEntry = {
    id: `stage-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    resident_id: residentId,
    from_stage: resident.care_stage,
    to_stage: input.to_stage,
    observed_at: observedAt,
    estimated_since: input.estimated_since,
    changed_by: CURRENT_CARER.name,
    note: input.note,
  }
  s.careStageHistory.push(entry)

  resident.care_stage = input.to_stage
  resident.care_stage_observed_at = observedAt
  resident.care_stage_estimated_since = input.estimated_since

  await persist()
  return resident
}

export type ResidentListEntry = {
  resident: Resident
  lastNoteAt: string | null
  lastNoteStatus: TranscriptionStatus | null
  lastNoteReviewedAt: string | null
}

// Residents paired with their most recent visit note, sorted by that note's
// date descending. Residents with no notes yet sort last.
export async function getResidentListEntries(): Promise<ResidentListEntry[]> {
  const s = await loadStore()
  const entries: ResidentListEntry[] = s.residents.map((resident) => {
    const notes = s.visitNotes
      .filter((n) => n.resident_id === resident.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
    return {
      resident,
      lastNoteAt: notes[0]?.created_at ?? null,
      lastNoteStatus: notes[0]?.transcription_status ?? null,
      lastNoteReviewedAt: notes[0]?.reviewed_at ?? null,
    }
  })
  return entries.sort((a, b) => {
    if (a.lastNoteAt === null && b.lastNoteAt === null) return 0
    if (a.lastNoteAt === null) return 1
    if (b.lastNoteAt === null) return -1
    return b.lastNoteAt.localeCompare(a.lastNoteAt)
  })
}

export async function getMedications(residentId: string): Promise<Medication[]> {
  const s = await loadStore()
  return s.medications.filter((m) => m.resident_id === residentId)
}

export async function getMedication(medicationId: string): Promise<Medication | undefined> {
  const s = await loadStore()
  return s.medications.find((m) => m.id === medicationId)
}

export async function getMedicationAcknowledgements(medicationId: string): Promise<MedicationAcknowledgement[]> {
  const s = await loadStore()
  return s.medicationAcknowledgements
    .filter((a) => a.medication_id === medicationId)
    .sort((a, b) => b.acknowledged_at.localeCompare(a.acknowledged_at))
}

function dateKey(iso: string): string {
  return iso.slice(0, 10)
}

// Keyed by medication_id, only today's acknowledgement (there can be at
// most one per medication per day in normal use).
export async function getTodaysMedicationAcknowledgements(
  residentId: string
): Promise<Map<string, MedicationAcknowledgement>> {
  const s = await loadStore()
  const today = dateKey(new Date().toISOString())
  const map = new Map<string, MedicationAcknowledgement>()
  s.medicationAcknowledgements
    .filter((a) => a.resident_id === residentId && dateKey(a.acknowledged_at) === today)
    .forEach((a) => map.set(a.medication_id, a))
  return map
}

// Consecutive days, most recent first, where every active medication has an
// acknowledgement of any status. Today only counts once it is itself
// complete; otherwise the streak is counted through yesterday, since a
// still-in-progress day isn't a broken one.
export async function getMedicationAcknowledgementStreak(residentId: string): Promise<number> {
  const s = await loadStore()
  const activeMedicationIds = s.medications
    .filter((m) => m.resident_id === residentId && m.active)
    .map((m) => m.id)
  if (activeMedicationIds.length === 0) return 0

  const ackedDatesByMedication = new Map<string, Set<string>>()
  activeMedicationIds.forEach((id) => ackedDatesByMedication.set(id, new Set()))
  s.medicationAcknowledgements
    .filter((a) => a.resident_id === residentId && ackedDatesByMedication.has(a.medication_id))
    .forEach((a) => ackedDatesByMedication.get(a.medication_id)!.add(dateKey(a.acknowledged_at)))

  const isDayComplete = (key: string): boolean =>
    activeMedicationIds.every((id) => ackedDatesByMedication.get(id)!.has(key))

  const cursor = new Date()
  if (!isDayComplete(dateKey(cursor.toISOString()))) {
    cursor.setDate(cursor.getDate() - 1)
  }
  let streak = 0
  while (isDayComplete(dateKey(cursor.toISOString()))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// Records that a dose was taken or skipped — from the resident, via
// AcknowledgeScreen (10.4). Writes an audit row and mirrors the status onto
// the medication itself, since the web app only keeps the latest status
// there (see docs/SCHEMA_ADDITIONS.md).
export async function acknowledgeMedication(
  medicationId: string,
  status: 'taken' | 'skipped',
  acknowledgedBy: string
): Promise<MedicationAcknowledgement | undefined> {
  const s = await loadStore()
  const medication = s.medications.find((m) => m.id === medicationId)
  if (!medication) return undefined

  const newAck: MedicationAcknowledgement = {
    id: `ack-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    medication_id: medicationId,
    resident_id: medication.resident_id,
    acknowledged_by: acknowledgedBy,
    status,
    acknowledged_at: new Date().toISOString(),
  }
  s.medicationAcknowledgements.push(newAck)
  medication.status = status
  await persist()
  return newAck
}

export async function getVisitNotes(residentId: string): Promise<VisitNote[]> {
  const s = await loadStore()
  return s.visitNotes
    .filter((n) => n.resident_id === residentId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function getVisitNote(id: string): Promise<VisitNote | undefined> {
  const s = await loadStore()
  return s.visitNotes.find((n) => n.id === id)
}

// Called when background transcription (src/lib/transcription.ts) finishes,
// whether it succeeded or not — a null result means transcription failed.
export async function completeVisitNoteTranscription(
  noteId: string,
  text: string | null
): Promise<VisitNote | undefined> {
  const s = await loadStore()
  const note = s.visitNotes.find((n) => n.id === noteId)
  if (!note) return undefined
  note.transcript = text ?? ''
  note.raw_transcript = text ?? ''
  note.transcription_status = text ? 'complete' : 'failed'
  await persist()
  return note
}

// A note is "unreviewed" once it has a transcript (successful, or manually
// typed after a failed transcription) but hasn't been confirmed yet. A note
// still transcribing has no transcript yet, so there's nothing to check.
function isUnreviewed(note: VisitNote): boolean {
  return note.transcript !== null && note.reviewed_at === null
}

export async function getUnreviewedVisitNotesCount(): Promise<number> {
  const s = await loadStore()
  return s.visitNotes.filter(isUnreviewed).length
}

export type UnreviewedVisitNoteEntry = {
  note: VisitNote
  residentId: string
  residentName: string
}

// Across all clients — feeds the carer home header's "N notes to check"
// count and the list it opens.
export async function getUnreviewedVisitNotes(): Promise<UnreviewedVisitNoteEntry[]> {
  const s = await loadStore()
  return s.visitNotes
    .filter(isUnreviewed)
    .map((note) => {
      const resident = s.residents.find((r) => r.id === note.resident_id)
      return {
        note,
        residentId: note.resident_id,
        residentName: resident ? `${resident.first_name} ${resident.last_name}` : 'Unknown',
      }
    })
    .sort((a, b) => b.note.created_at.localeCompare(a.note.created_at))
}

export type StructuredVisitDetail = {
  visitType: string | null
  // Comma-separated list of ticked task labels, per CLAUDE.md — the web
  // family portal displays tasks_completed as text, not as the guide's JSON
  // object of booleans.
  tasksCompleted: string
  // Reminders for next visit (6.3) — never shown in the family portal.
  askAboutHearing: boolean
  askAboutVision: boolean
  askAboutContinence: boolean
}

// Only ever called from the carer's explicit "Confirm note" tap
// (NoteReviewScreen) — never automatically.
export async function confirmVisitNote(
  noteId: string,
  currentText: string,
  detail?: StructuredVisitDetail
): Promise<VisitNote | undefined> {
  const s = await loadStore()
  const note = s.visitNotes.find((n) => n.id === noteId)
  if (!note) return undefined
  const rawTranscript = note.raw_transcript ?? ''
  const distance = levenshteinDistance(rawTranscript, currentText)
  note.transcript = currentText
  note.was_edited = distance > 0
  note.raw_length = rawTranscript.length
  note.edit_distance = distance
  note.reviewed_at = new Date().toISOString()
  if (detail) {
    note.visit_type = detail.visitType
    note.tasks_completed = detail.tasksCompleted
    note.ask_about_hearing = detail.askAboutHearing
    note.ask_about_vision = detail.askAboutVision
    note.ask_about_continence = detail.askAboutContinence
  }
  await persist()
  return note
}

export async function addVisitNote(
  note: Omit<
    VisitNote,
    | 'id'
    | 'created_at'
    | 'reviewed_at'
    | 'was_edited'
    | 'raw_length'
    | 'edit_distance'
    | 'ask_about_hearing'
    | 'ask_about_vision'
    | 'ask_about_continence'
    | 'physician_flagged'
    | 'flag_reason'
  > &
    Partial<Pick<VisitNote, 'created_at' | 'reviewed_at'>>
): Promise<VisitNote> {
  const s = await loadStore()
  const newNote: VisitNote = {
    id: `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    resident_id: note.resident_id,
    visit_type: note.visit_type,
    tasks_completed: note.tasks_completed,
    is_escalation: note.is_escalation,
    carer_name: note.carer_name,
    raw_transcript: note.raw_transcript,
    transcription_status: note.transcription_status,
    transcript: note.transcript,
    created_at: note.created_at ?? new Date().toISOString(),
    reviewed_at: note.reviewed_at ?? null,
    // Only set once a carer reviews the note (confirmVisitNote).
    was_edited: null,
    raw_length: null,
    edit_distance: null,
    ask_about_hearing: false,
    ask_about_vision: false,
    ask_about_continence: false,
    physician_flagged: false,
    flag_reason: null,
  }
  s.visitNotes.push(newNote)
  await persist()
  return newNote
}

export type PhysicianEscalationInput = {
  residentId: string
  reason: string
}

// Both writes happen together, per CLAUDE.md: a new escalations row, and
// physician_flagged/flag_reason on the resident's most recent visit note.
// Returns undefined only if the resident has no visit notes at all, which
// shouldn't happen in practice since EscalationScreen is reached from a
// profile that already has notes to show as context.
export async function raisePhysicianEscalation(
  input: PhysicianEscalationInput
): Promise<{ escalation: Escalation; note: VisitNote } | undefined> {
  const s = await loadStore()
  const mostRecentNote = s.visitNotes
    .filter((n) => n.resident_id === input.residentId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  if (!mostRecentNote) return undefined

  mostRecentNote.physician_flagged = true
  mostRecentNote.flag_reason = input.reason

  const escalation: Escalation = {
    id: `esc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    resident_id: input.residentId,
    reason: input.reason,
    severity: 'physician',
    is_resolved: false,
    created_at: new Date().toISOString(),
    resolved_at: null,
    visit_note_id: mostRecentNote.id,
    flag_outcome: null,
    flag_outcome_at: null,
  }
  s.escalations.push(escalation)

  await persist()
  return { escalation, note: mostRecentNote }
}

export async function getEscalations(residentId: string): Promise<Escalation[]> {
  const s = await loadStore()
  return s.escalations
    .filter((e) => e.resident_id === residentId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function addEscalation(
  escalation: Omit<
    Escalation,
    'id' | 'created_at' | 'is_resolved' | 'resolved_at' | 'flag_outcome' | 'flag_outcome_at'
  > &
    Partial<Pick<Escalation, 'created_at' | 'is_resolved' | 'resolved_at'>>
): Promise<Escalation> {
  const s = await loadStore()
  const newEscalation: Escalation = {
    id: `esc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    resident_id: escalation.resident_id,
    reason: escalation.reason,
    severity: escalation.severity,
    visit_note_id: escalation.visit_note_id,
    is_resolved: escalation.is_resolved ?? false,
    created_at: escalation.created_at ?? new Date().toISOString(),
    resolved_at: escalation.resolved_at ?? null,
    flag_outcome: null,
    flag_outcome_at: null,
  }
  s.escalations.push(newEscalation)
  await persist()
  return newEscalation
}

// Writes both rows the guide's assistance request touches, in one call: the
// request itself, and (per CLAUDE.md) an escalations row so the web
// management portal sees it too. acknowledged_at is never set — there is no
// push delivery in this app yet, so nothing can ever acknowledge it.
export async function createAssistanceRequest(input: {
  resident_id: string
  contacted_name: string
  contacted_phone: string
}): Promise<AssistanceRequest> {
  const s = await loadStore()
  const newRequest: AssistanceRequest = {
    id: `assist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    resident_id: input.resident_id,
    contacted_name: input.contacted_name,
    contacted_phone: input.contacted_phone,
    escalation_level: 1,
    acknowledged_at: null,
    created_at: new Date().toISOString(),
  }
  s.assistanceRequests.push(newRequest)
  await persist()

  await addEscalation({
    resident_id: input.resident_id,
    reason: 'Resident asked for help',
    severity: 'assistance',
    visit_note_id: null,
  })

  return newRequest
}

export type EscalationAwaitingOutcomeEntry = {
  escalation: Escalation
  residentId: string
  residentName: string
}

// Physician escalations only (7.1/7.2) — an assistance-severity escalation
// (10.5) has no visit note and no "record outcome" flow to point at, so it
// never belongs in this count or list.
export async function getEscalationsAwaitingOutcomeCount(): Promise<number> {
  const s = await loadStore()
  return s.escalations.filter((e) => e.severity === 'physician' && e.flag_outcome === null).length
}

// Across all clients — feeds the carer home header's plain-text count and
// the list it opens.
export async function getEscalationsAwaitingOutcome(): Promise<EscalationAwaitingOutcomeEntry[]> {
  const s = await loadStore()
  return s.escalations
    .filter((e) => e.severity === 'physician' && e.flag_outcome === null)
    .map((escalation) => {
      const resident = s.residents.find((r) => r.id === escalation.resident_id)
      return {
        escalation,
        residentId: escalation.resident_id,
        residentName: resident ? `${resident.first_name} ${resident.last_name}` : 'Unknown',
      }
    })
    .sort((a, b) => b.escalation.created_at.localeCompare(a.escalation.created_at))
}

// Never automatic — only from the carer's explicit tap on one of the four
// outcome controls (the bar on the Notes tab).
export async function recordEscalationOutcome(
  escalationId: string,
  outcome: string
): Promise<Escalation | undefined> {
  const s = await loadStore()
  const escalation = s.escalations.find((e) => e.id === escalationId)
  if (!escalation) return undefined
  escalation.flag_outcome = outcome
  escalation.flag_outcome_at = new Date().toISOString()
  if (outcome !== 'Raised, no response yet') {
    escalation.is_resolved = true
    escalation.resolved_at = escalation.flag_outcome_at
  }
  await persist()
  return escalation
}

// Mirrors the guide's mobile useMessages query (8.3, web-app scope): the
// five most recent messages from family that the resident hasn't seen yet.
// There is no in-app composer to write a new one — that lives in the
// separate web portal, out of scope here.
export async function getUnacknowledgedMessages(residentId: string): Promise<Message[]> {
  const s = await loadStore()
  return s.messages
    .filter((m) => m.resident_id === residentId && m.acknowledged_at === null)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5)
}

export async function acknowledgeMessage(messageId: string): Promise<Message | undefined> {
  const s = await loadStore()
  const message = s.messages.find((m) => m.id === messageId)
  if (!message) return undefined
  message.acknowledged_at = new Date().toISOString()
  await persist()
  return message
}

export async function getHealthLogs(residentId: string): Promise<HealthLog[]> {
  const s = await loadStore()
  return s.healthLogs
    .filter((h) => h.resident_id === residentId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function addHealthLog(
  log: Omit<HealthLog, 'id' | 'created_at'> & Partial<Pick<HealthLog, 'created_at'>>
): Promise<HealthLog> {
  const s = await loadStore()
  const newLog: HealthLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    resident_id: log.resident_id,
    logged_by: log.logged_by,
    mood: log.mood,
    sleep: log.sleep,
    pain: log.pain,
    weight_kg: log.weight_kg,
    notes: log.notes,
    created_at: log.created_at ?? new Date().toISOString(),
  }
  s.healthLogs.push(newLog)
  await persist()
  return newLog
}

export async function resetMockData(): Promise<void> {
  store = cloneInitialData()
  await AsyncStorage.removeItem(STORAGE_KEY)
}

export async function getViewChoice(): Promise<ViewChoice | null> {
  const value = await AsyncStorage.getItem(VIEW_CHOICE_KEY)
  return value === 'carer' || value === 'resident' ? value : null
}

export async function setViewChoice(choice: ViewChoice | null): Promise<void> {
  if (choice) {
    await AsyncStorage.setItem(VIEW_CHOICE_KEY, choice)
  } else {
    await AsyncStorage.removeItem(VIEW_CHOICE_KEY)
  }
}

// The shift boundary drives what a handover collects — a night shift
// crosses midnight, so this is used instead of a calendar date query.
export async function getCurrentShift(): Promise<Shift | null> {
  const id = await AsyncStorage.getItem(CURRENT_SHIFT_KEY)
  if (!id) return null
  const s = await loadStore()
  return s.shifts.find((shift) => shift.id === id) ?? null
}

export async function startShift(): Promise<Shift> {
  const s = await loadStore()
  const shift: Shift = {
    id: `shift-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    carer_name: CURRENT_CARER.name,
    started_at: new Date().toISOString(),
    ended_at: null,
  }
  s.shifts.push(shift)
  await AsyncStorage.setItem(CURRENT_SHIFT_KEY, shift.id)
  await persist()
  return shift
}

// Sets ended_at and clears the stored id — HandoverScreen falls back to the
// last 12 hours the next time it's opened, since no shift is active.
export async function endShift(shiftId: string): Promise<void> {
  const s = await loadStore()
  const shift = s.shifts.find((sh) => sh.id === shiftId)
  if (shift) shift.ended_at = new Date().toISOString()
  await AsyncStorage.removeItem(CURRENT_SHIFT_KEY)
  await persist()
}

export type HandoverNoteEntry = {
  residentId: string
  residentName: string
  notes: VisitNote[]
}

export type HandoverEscalationEntry = {
  escalation: Escalation
  residentName: string
}

// Named distinctly from lib/handover.ts's HandoverData, which additionally
// carries carer/shift metadata for rendering — this is just the query result.
export type ShiftHandoverData = {
  notes: HandoverNoteEntry[]
  noteCount: number
  clientsSeenCount: number
  openEscalations: HandoverEscalationEntry[]
}

// Collects everything recorded at or after `boundary` by the current carer:
// their visit notes (grouped by client, in the order each client was first
// seen) and any escalation raised in that window that's still awaiting an
// outcome.
export async function getShiftHandoverData(boundary: string): Promise<ShiftHandoverData> {
  const s = await loadStore()

  const shiftNotes = s.visitNotes
    .filter((n) => n.carer_name === CURRENT_CARER.name && n.created_at >= boundary)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))

  const notes: HandoverNoteEntry[] = []
  const byResident = new Map<string, HandoverNoteEntry>()
  for (const note of shiftNotes) {
    let entry = byResident.get(note.resident_id)
    if (!entry) {
      const resident = s.residents.find((r) => r.id === note.resident_id)
      entry = {
        residentId: note.resident_id,
        residentName: resident ? `${resident.first_name} ${resident.last_name}` : 'Unknown',
        notes: [],
      }
      byResident.set(note.resident_id, entry)
      notes.push(entry)
    }
    entry.notes.push(note)
  }

  const openEscalations: HandoverEscalationEntry[] = s.escalations
    .filter((e) => e.created_at >= boundary && e.flag_outcome === null)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((escalation) => {
      const resident = s.residents.find((r) => r.id === escalation.resident_id)
      return {
        escalation,
        residentName: resident ? `${resident.first_name} ${resident.last_name}` : 'Unknown',
      }
    })

  return {
    notes,
    noteCount: shiftNotes.length,
    clientsSeenCount: notes.length,
    openEscalations,
  }
}

// There is no sign-in yet; the resident app always runs as the first mock
// resident, per CLAUDE.md.
export async function getFirstResident(): Promise<Resident | undefined> {
  const s = await loadStore()
  return s.residents[0]
}

export async function getOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY)
  return value === 'true'
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true')
}

// Resident onboarding (10.1) step 2 — the guide's user_profiles.name is a
// single display name; this app already has one in first_name, which is
// what greetings/avatars use elsewhere, so that's what gets updated here.
export async function updateResidentName(
  residentId: string,
  firstName: string
): Promise<Resident | undefined> {
  const s = await loadStore()
  const resident = s.residents.find((r) => r.id === residentId)
  if (!resident) return undefined
  resident.first_name = firstName.trim()
  await persist()
  return resident
}

export async function setResidentWantsReminders(
  residentId: string,
  wants: boolean
): Promise<Resident | undefined> {
  const s = await loadStore()
  const resident = s.residents.find((r) => r.id === residentId)
  if (!resident) return undefined
  resident.wants_medication_reminders = wants
  await persist()
  return resident
}

// Goals are stored verbatim, in the resident's own words, and are never
// edited by staff or marked achieved/at risk/lost (10.2).
export async function updateResidentGoals(
  residentId: string,
  goals: IndependenceGoal[]
): Promise<Resident | undefined> {
  const s = await loadStore()
  const resident = s.residents.find((r) => r.id === residentId)
  if (!resident) return undefined
  resident.independence_goals = goals
  await persist()
  return resident
}
