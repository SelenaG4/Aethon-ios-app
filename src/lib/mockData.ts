// Table and field names below match the web app (~/Developer/aethon-web), which
// reads/writes the same Supabase database this app will use later. Fields marked
// "Not in the web app yet" are additions this build needs — see
// docs/SCHEMA_ADDITIONS.md for the list to confirm with the team before the
// real backend is wired up.

// The vocabulary carers actually use is still to be confirmed (4.4); these
// four raw values are what's stored regardless of what a later increment
// decides to label them as on screen.
export type CareStage = 'independent' | 'family_supported' | 'professionally_supported' | 'residential'

export type EmergencyContact = {
  name: string
  relationship: string
  phone: string
  priority: number
}

export type MobilityAid = 'none' | 'stick' | 'frame' | 'wheelchair'

export type Resident = {
  id: string
  first_name: string
  last_name: string
  room_number: string | null
  care_stage: CareStage
  // Not in the web app yet.
  care_stage_observed_at: string
  care_stage_estimated_since: string
  date_of_birth: string
  allergies: string[]
  physician_name: string
  physician_email: string
  emergency_contacts: EmergencyContact[]
  // Not in the web app yet. Captured once at enrolment and never edited
  // afterwards; null until a carer records it (4.3).
  baseline_age: number | null
  baseline_lives_alone: boolean | null
  baseline_condition_count: number | null
  baseline_mobility_aid: MobilityAid | null
  baseline_support_note: string | null
  baseline_recorded_at: string | null
  // Not in the web app yet. Set during resident onboarding (10.1); consumed
  // by medication reminders (10.4).
  wants_medication_reminders: boolean
  // Not in the web app yet. Recorded verbatim during resident onboarding
  // (10.2); never edited by staff, never marked achieved or at risk.
  independence_goals: IndependenceGoal[]
}

export type IndependenceGoal = {
  text: string
  family_visible: boolean
}

// Not in the web app yet: every care stage transition a resident has gone
// through, not just the current one. from_stage is null for the first row
// (arrival at the service), which isn't a transition but is still worth
// showing on the History tab.
export type CareStageHistoryEntry = {
  id: string
  resident_id: string
  from_stage: CareStage | null
  to_stage: CareStage
  observed_at: string
  estimated_since: string
  changed_by: string
  note: string | null
}

// 'skipped' is the resident's own "I skipped it" (10.4); 'missed' is
// reserved for a dose nobody acted on.
export type MedicationStatus = 'due' | 'taken' | 'skipped' | 'missed'

export type Medication = {
  id: string
  resident_id: string
  name: string
  dosage: string
  scheduled_time: string
  status: MedicationStatus
  // Not in the web app yet.
  active: boolean
}

// Not in the web app yet: an audit trail of each time a medication's status
// was recorded — by a carer, or by the resident themselves via the
// acknowledgement screen (10.4) — since the web app only keeps the latest
// status on the medication row itself.
export type MedicationAcknowledgement = {
  id: string
  medication_id: string
  resident_id: string
  acknowledged_by: string
  status: MedicationStatus
  acknowledged_at: string
}

export type TranscriptionStatus = 'pending' | 'complete' | 'failed'

export type VisitNote = {
  id: string
  resident_id: string
  // Null until set during note review (5.4) — optional, and never required
  // to confirm a note.
  visit_type: string | null
  tasks_completed: string
  is_escalation: boolean
  created_at: string
  // Not in the web app yet.
  carer_name: string
  // The guide's raw_transcript: the unedited on-device transcription output.
  raw_transcript: string | null
  transcription_status: TranscriptionStatus
  // The note as shown to carers/family — starts equal to raw_transcript and
  // may be edited during note review (5.3). Never derived from tasks_completed.
  transcript: string | null
  reviewed_at: string | null
  // Set together with reviewed_at when a carer confirms the note (5.3); null
  // until then.
  was_edited: boolean | null
  raw_length: number | null
  edit_distance: number | null
  // Optional reminders for the next visit, set during note review (6.3).
  // Never shown in the family portal.
  ask_about_hearing: boolean
  ask_about_vision: boolean
  ask_about_continence: boolean
  // Set together when a carer raises this note with the physician (7.1).
  // flag_outcome/flag_outcome_at are added in 7.2.
  physician_flagged: boolean
  flag_reason: string | null
}

// The guide's only two escalation paths: a physician review request (7.1)
// and a resident assistance request (10.5).
export type EscalationSeverity = 'physician' | 'assistance'

export type Escalation = {
  id: string
  resident_id: string
  reason: string
  severity: EscalationSeverity
  is_resolved: boolean
  created_at: string
  resolved_at: string | null
  // Not in the web app yet. The visit note that was flagged when this
  // escalation was raised. Null for an assistance-severity escalation
  // (10.5), which isn't tied to any visit note.
  visit_note_id: string | null
  // Set together when a carer records what happened (7.2). Any outcome
  // other than "Raised, no response yet" also sets is_resolved/resolved_at.
  flag_outcome: string | null
  flag_outcome_at: string | null
}

// The guide's messaging feature (8.3, web-app scope) is family-to-resident
// only: a family member sends a message from the web portal and it appears
// on the resident's device. There is no in-app staff composer, so this app
// never produces any sender_role other than 'family'.
export type MessageSenderRole = 'family'

export type Message = {
  id: string
  resident_id: string
  sender_id: string
  sender_name: string
  sender_role: MessageSenderRole
  body: string
  image_url: string | null
  acknowledged_at: string | null
  created_at: string
}

// Not in the web app yet: a short structured observation (6.1), enterable by
// a carer during a visit, a family member, or the resident themselves.
// Every field is optional — a record with only a mood value is valid.
export type HealthLog = {
  id: string
  resident_id: string
  logged_by: string
  mood: number | null // 1 to 5
  sleep: number | null // 1 to 5
  pain: number | null // 0 to 10
  weight_kg: number | null
  notes: string | null
  created_at: string
}

// Not in the web app yet: the shift boundary a handover (7.3) is built
// from. The current shift's id is also kept in AsyncStorage so it survives
// an app restart.
export type Shift = {
  id: string
  carer_name: string
  started_at: string
  ended_at: string | null
}

// The guide's own assistance_requests table (3.4, excluded — SQL scope —
// but this is the same shape). There is no push delivery in this app yet
// (CLAUDE.md), so acknowledged_at is never set by anything.
export type AssistanceRequest = {
  id: string
  resident_id: string
  contacted_name: string
  contacted_phone: string
  escalation_level: number
  acknowledged_at: string | null
  created_at: string
}

export const residents: Resident[] = [
  {
    id: 'res-1',
    first_name: 'Eleanor',
    last_name: 'Whitfield',
    room_number: '214',
    care_stage: 'professionally_supported',
    care_stage_observed_at: '2025-06-15T00:00:00.000Z',
    care_stage_estimated_since: '2025-06-01T00:00:00.000Z',
    date_of_birth: '1938-04-12',
    allergies: ['Penicillin', 'Shellfish'],
    physician_name: 'Dr. Amara Osei',
    physician_email: 'aosei@willowbrookmedical.com',
    emergency_contacts: [
      { name: 'Margaret Whitfield', relationship: 'Daughter', phone: '+1-555-0142', priority: 1 },
      { name: 'Thomas Whitfield', relationship: 'Son', phone: '+1-555-0198', priority: 2 },
    ],
    baseline_age: null,
    baseline_lives_alone: null,
    baseline_condition_count: null,
    baseline_mobility_aid: null,
    baseline_support_note: null,
    baseline_recorded_at: null,
    wants_medication_reminders: false,
    independence_goals: [],
  },
  {
    id: 'res-2',
    first_name: 'Harold',
    last_name: 'Jennings',
    room_number: '108',
    care_stage: 'independent',
    care_stage_observed_at: '2023-09-10T00:00:00.000Z',
    care_stage_estimated_since: '2023-09-10T00:00:00.000Z',
    date_of_birth: '1945-11-03',
    allergies: ['Sulfa drugs'],
    physician_name: 'Dr. Priya Chandran',
    physician_email: 'pchandran@willowbrookmedical.com',
    emergency_contacts: [
      { name: 'Susan Jennings-Cole', relationship: 'Daughter', phone: '+1-555-0176', priority: 1 },
    ],
    baseline_age: null,
    baseline_lives_alone: null,
    baseline_condition_count: null,
    baseline_mobility_aid: null,
    baseline_support_note: null,
    baseline_recorded_at: null,
    wants_medication_reminders: false,
    independence_goals: [],
  },
  {
    id: 'res-3',
    first_name: 'Rosa',
    last_name: 'Delgado',
    room_number: '301',
    care_stage: 'residential',
    care_stage_observed_at: '2025-08-05T00:00:00.000Z',
    care_stage_estimated_since: '2025-07-20T00:00:00.000Z',
    date_of_birth: '1932-07-29',
    allergies: [],
    physician_name: 'Dr. Michael Foster',
    physician_email: 'mfoster@willowbrookmedical.com',
    emergency_contacts: [
      { name: 'Carlos Delgado', relationship: 'Son', phone: '+1-555-0213', priority: 1 },
      { name: 'Ana Delgado', relationship: 'Granddaughter', phone: '+1-555-0247', priority: 2 },
    ],
    baseline_age: 88,
    baseline_lives_alone: true,
    baseline_condition_count: 3,
    baseline_mobility_aid: 'stick',
    baseline_support_note: 'Daughter visited weekly, neighbour checked in daily.',
    baseline_recorded_at: '2021-03-01T00:00:00.000Z',
    wants_medication_reminders: false,
    independence_goals: [
      { text: 'Cook my own dinner most nights', family_visible: true },
      { text: 'Get to the market on Thursdays', family_visible: false },
    ],
  },
]

export const careStageHistory: CareStageHistoryEntry[] = [
  {
    id: 'stage-1',
    resident_id: 'res-1',
    from_stage: null,
    to_stage: 'independent',
    observed_at: '2024-02-01T00:00:00.000Z',
    estimated_since: '2024-02-01T00:00:00.000Z',
    changed_by: 'Test Carer',
    note: null,
  },
  {
    id: 'stage-2',
    resident_id: 'res-1',
    from_stage: 'independent',
    to_stage: 'professionally_supported',
    observed_at: '2025-06-15T00:00:00.000Z',
    estimated_since: '2025-06-01T00:00:00.000Z',
    changed_by: 'Test Carer',
    note: 'Family requested regular home care visits after a fall scare.',
  },
  {
    id: 'stage-3',
    resident_id: 'res-2',
    from_stage: null,
    to_stage: 'independent',
    observed_at: '2023-09-10T00:00:00.000Z',
    estimated_since: '2023-09-10T00:00:00.000Z',
    changed_by: 'Test Carer',
    note: null,
  },
  {
    id: 'stage-4',
    resident_id: 'res-3',
    from_stage: null,
    to_stage: 'independent',
    observed_at: '2021-03-01T00:00:00.000Z',
    estimated_since: '2021-03-01T00:00:00.000Z',
    changed_by: 'Test Carer',
    note: null,
  },
  {
    id: 'stage-5',
    resident_id: 'res-3',
    from_stage: 'independent',
    to_stage: 'professionally_supported',
    observed_at: '2023-01-20T00:00:00.000Z',
    estimated_since: '2022-12-01T00:00:00.000Z',
    changed_by: 'Test Carer',
    note: 'Started twice-weekly home care visits.',
  },
  {
    id: 'stage-6',
    resident_id: 'res-3',
    from_stage: 'professionally_supported',
    to_stage: 'residential',
    observed_at: '2025-08-05T00:00:00.000Z',
    estimated_since: '2025-07-20T00:00:00.000Z',
    changed_by: 'Test Carer',
    note: 'Moved to Willowbrook after a period of increased confusion at home.',
  },
]

export const medications: Medication[] = [
  { id: 'med-1', resident_id: 'res-1', name: 'Lisinopril', dosage: '10mg', scheduled_time: '08:00', status: 'taken', active: true },
  { id: 'med-2', resident_id: 'res-1', name: 'Metformin', dosage: '500mg', scheduled_time: '08:00', status: 'taken', active: true },
  { id: 'med-3', resident_id: 'res-1', name: 'Metformin', dosage: '500mg', scheduled_time: '18:00', status: 'due', active: true },
  { id: 'med-4', resident_id: 'res-1', name: 'Atorvastatin', dosage: '20mg', scheduled_time: '20:00', status: 'due', active: true },

  { id: 'med-5', resident_id: 'res-2', name: 'Amlodipine', dosage: '5mg', scheduled_time: '08:00', status: 'taken', active: true },
  { id: 'med-6', resident_id: 'res-2', name: 'Omeprazole', dosage: '20mg', scheduled_time: '07:30', status: 'taken', active: true },

  { id: 'med-7', resident_id: 'res-3', name: 'Donepezil', dosage: '10mg', scheduled_time: '20:00', status: 'due', active: true },
  { id: 'med-8', resident_id: 'res-3', name: 'Memantine', dosage: '5mg', scheduled_time: '08:00', status: 'taken', active: true },
  { id: 'med-9', resident_id: 'res-3', name: 'Memantine', dosage: '5mg', scheduled_time: '20:00', status: 'due', active: true },
  { id: 'med-10', resident_id: 'res-3', name: 'Aspirin', dosage: '81mg', scheduled_time: '08:00', status: 'missed', active: false },
]

export const medicationAcknowledgements: MedicationAcknowledgement[] = [
  { id: 'ack-1', medication_id: 'med-1', resident_id: 'res-1', acknowledged_by: 'Jamie Ruiz', status: 'taken', acknowledged_at: '2026-09-16T08:05:00.000Z' },
  { id: 'ack-2', medication_id: 'med-2', resident_id: 'res-1', acknowledged_by: 'Jamie Ruiz', status: 'taken', acknowledged_at: '2026-09-16T08:05:00.000Z' },
  { id: 'ack-3', medication_id: 'med-5', resident_id: 'res-2', acknowledged_by: 'Jamie Ruiz', status: 'taken', acknowledged_at: '2026-09-16T08:10:00.000Z' },
  { id: 'ack-4', medication_id: 'med-6', resident_id: 'res-2', acknowledged_by: 'Priya Nair', status: 'taken', acknowledged_at: '2026-09-16T07:35:00.000Z' },
  { id: 'ack-5', medication_id: 'med-8', resident_id: 'res-3', acknowledged_by: 'Diane Okafor', status: 'taken', acknowledged_at: '2026-09-16T08:15:00.000Z' },
  { id: 'ack-6', medication_id: 'med-10', resident_id: 'res-3', acknowledged_by: 'Diane Okafor', status: 'missed', acknowledged_at: '2026-09-16T09:00:00.000Z' },
  // Fills out res-1's last three days so the resident home's "days in a
  // row" streak (10.3) has something to show on first run.
  { id: 'ack-7', medication_id: 'med-3', resident_id: 'res-1', acknowledged_by: 'Jamie Ruiz', status: 'taken', acknowledged_at: '2026-09-16T18:05:00.000Z' },
  { id: 'ack-8', medication_id: 'med-4', resident_id: 'res-1', acknowledged_by: 'Jamie Ruiz', status: 'taken', acknowledged_at: '2026-09-16T20:05:00.000Z' },
  { id: 'ack-9', medication_id: 'med-1', resident_id: 'res-1', acknowledged_by: 'Jamie Ruiz', status: 'taken', acknowledged_at: '2026-09-15T08:05:00.000Z' },
  { id: 'ack-10', medication_id: 'med-2', resident_id: 'res-1', acknowledged_by: 'Jamie Ruiz', status: 'taken', acknowledged_at: '2026-09-15T08:05:00.000Z' },
  { id: 'ack-11', medication_id: 'med-3', resident_id: 'res-1', acknowledged_by: 'Jamie Ruiz', status: 'taken', acknowledged_at: '2026-09-15T18:05:00.000Z' },
  { id: 'ack-12', medication_id: 'med-4', resident_id: 'res-1', acknowledged_by: 'Jamie Ruiz', status: 'taken', acknowledged_at: '2026-09-15T20:05:00.000Z' },
  { id: 'ack-13', medication_id: 'med-1', resident_id: 'res-1', acknowledged_by: 'Jamie Ruiz', status: 'taken', acknowledged_at: '2026-09-14T08:05:00.000Z' },
  { id: 'ack-14', medication_id: 'med-2', resident_id: 'res-1', acknowledged_by: 'Jamie Ruiz', status: 'taken', acknowledged_at: '2026-09-14T08:05:00.000Z' },
  { id: 'ack-15', medication_id: 'med-3', resident_id: 'res-1', acknowledged_by: 'Jamie Ruiz', status: 'taken', acknowledged_at: '2026-09-14T18:05:00.000Z' },
  { id: 'ack-16', medication_id: 'med-4', resident_id: 'res-1', acknowledged_by: 'Jamie Ruiz', status: 'taken', acknowledged_at: '2026-09-14T20:05:00.000Z' },
]

export const visitNotes: VisitNote[] = [
  {
    id: 'note-1',
    resident_id: 'res-1',
    visit_type: 'Morning Visit',
    tasks_completed: 'Breakfast and morning medications administered.',
    is_escalation: false,
    carer_name: 'Jamie Ruiz',
    raw_transcript: 'Eleanor was in good spirits this morning. Ate full breakfast, took all medications on schedule. Mentioned mild knee stiffness, no fall risk observed.',
    transcription_status: 'complete',
    transcript: 'Eleanor was in good spirits this morning. Ate full breakfast, took all medications on schedule. Mentioned mild knee stiffness, no fall risk observed.',
    created_at: '2026-09-10T08:30:00.000Z',
    reviewed_at: '2026-09-10T14:05:00.000Z',
    was_edited: false,
    raw_length: 149,
    edit_distance: 0,
    ask_about_hearing: true,
    ask_about_vision: false,
    ask_about_continence: false,
    physician_flagged: false,
    flag_reason: null,
  },
  {
    id: 'note-2',
    resident_id: 'res-1',
    visit_type: 'Evening Visit',
    tasks_completed: 'Blood pressure checked and flagged to physician.',
    is_escalation: false,
    carer_name: 'Priya Nair',
    raw_transcript: 'Evening check-in: blood pressure slightly elevated at 142/88. Advised to monitor and flagged to physician. Eleanor was alert and oriented.',
    transcription_status: 'complete',
    transcript: 'Evening check-in: blood pressure slightly elevated at 142/88. Advised to monitor and flagged to physician. Eleanor was alert and oriented.',
    created_at: '2026-09-13T19:15:00.000Z',
    reviewed_at: null,
    was_edited: null,
    raw_length: null,
    edit_distance: null,
    ask_about_hearing: false,
    ask_about_vision: false,
    ask_about_continence: false,
    physician_flagged: true,
    flag_reason: 'Blood pressure reading 142/88, above normal range.',
  },
  {
    id: 'note-3',
    resident_id: 'res-2',
    visit_type: 'Morning Visit',
    tasks_completed: 'Garden walk completed unassisted.',
    is_escalation: false,
    carer_name: 'Jamie Ruiz',
    raw_transcript: 'Harold completed his morning walk in the garden unassisted. No complaints. Reminded him about upcoming physician appointment on the 20th.',
    transcription_status: 'complete',
    transcript: 'Harold completed his morning walk in the garden unassisted. No complaints. Reminded him about upcoming physician appointment on the 20th.',
    created_at: '2026-09-11T09:00:00.000Z',
    reviewed_at: '2026-09-11T16:40:00.000Z',
    was_edited: false,
    raw_length: 137,
    edit_distance: 0,
    ask_about_hearing: false,
    ask_about_vision: false,
    ask_about_continence: false,
    physician_flagged: false,
    flag_reason: null,
  },
  {
    id: 'note-4',
    resident_id: 'res-3',
    visit_type: 'Afternoon Visit',
    tasks_completed: 'Reoriented after nap, assisted with lunch.',
    is_escalation: false,
    carer_name: 'Diane Okafor',
    raw_transcript: 'Rosa was disoriented briefly after waking from a nap but settled once reoriented to place and time. Ate lunch with assistance. Family visited in the afternoon.',
    transcription_status: 'complete',
    transcript: 'Rosa was disoriented briefly after waking from a nap but settled once reoriented to place and time. Ate lunch with assistance. Family visited in the afternoon.',
    created_at: '2026-09-12T13:20:00.000Z',
    reviewed_at: '2026-09-12T18:00:00.000Z',
    was_edited: false,
    raw_length: 159,
    edit_distance: 0,
    ask_about_hearing: false,
    ask_about_vision: true,
    ask_about_continence: true,
    physician_flagged: true,
    flag_reason: 'Found disoriented after waking from a nap; settled once reoriented, no injury observed.',
  },
  {
    id: 'note-5',
    resident_id: 'res-3',
    visit_type: 'Overnight Visit',
    tasks_completed: 'Overnight check, medications administered on schedule.',
    is_escalation: false,
    carer_name: 'Diane Okafor',
    raw_transcript: 'Overnight check: Rosa slept through the night without incident. Medications administered on schedule.',
    transcription_status: 'complete',
    transcript: 'Overnight check: Rosa slept through the night without incident. Medications administered on schedule.',
    created_at: '2026-09-14T06:45:00.000Z',
    reviewed_at: null,
    was_edited: null,
    raw_length: null,
    edit_distance: null,
    ask_about_hearing: false,
    ask_about_vision: false,
    ask_about_continence: false,
    physician_flagged: false,
    flag_reason: null,
  },
]

export const escalations: Escalation[] = [
  {
    id: 'esc-1',
    resident_id: 'res-1',
    reason: 'Blood pressure reading 142/88, above normal range.',
    severity: 'physician',
    is_resolved: true,
    created_at: '2026-09-13T19:20:00.000Z',
    resolved_at: '2026-09-14T09:00:00.000Z',
    visit_note_id: 'note-2',
    flag_outcome: 'Physician reviewed, change made',
    flag_outcome_at: '2026-09-14T09:00:00.000Z',
  },
  {
    id: 'esc-2',
    resident_id: 'res-3',
    reason: 'Found disoriented after waking from a nap; settled once reoriented, no injury observed.',
    severity: 'physician',
    is_resolved: false,
    created_at: '2026-09-15T02:10:00.000Z',
    resolved_at: null,
    visit_note_id: 'note-4',
    flag_outcome: null,
    flag_outcome_at: null,
  },
]

export const messages: Message[] = [
  {
    id: 'msg-1',
    resident_id: 'res-1',
    sender_id: 'family-margaret',
    sender_name: 'Margaret Whitfield',
    sender_role: 'family',
    body: 'Hi Mum, just checking in on how your knee is doing today. Love you!',
    image_url: null,
    acknowledged_at: null,
    created_at: '2026-09-16T15:00:00.000Z',
  },
  {
    id: 'msg-2',
    resident_id: 'res-1',
    sender_id: 'family-thomas',
    sender_name: 'Thomas Whitfield',
    sender_role: 'family',
    body: 'Thinking of you today. Will call this evening.',
    image_url: null,
    acknowledged_at: '2026-09-14T10:00:00.000Z',
    created_at: '2026-09-14T09:00:00.000Z',
  },
  {
    id: 'msg-3',
    resident_id: 'res-3',
    sender_id: 'family-carlos',
    sender_name: 'Carlos Delgado',
    sender_role: 'family',
    body: 'Thinking of you today, Mum. Call us later!',
    image_url: null,
    acknowledged_at: null,
    created_at: '2026-09-12T19:00:00.000Z',
  },
]

export const healthLogs: HealthLog[] = [
  {
    id: 'log-1',
    resident_id: 'res-1',
    logged_by: 'Jamie Ruiz',
    mood: 4,
    sleep: 4,
    pain: 1,
    weight_kg: 68.2,
    notes: 'In good spirits, mentioned mild knee stiffness.',
    created_at: '2026-09-06T08:40:00.000Z',
  },
  {
    id: 'log-2',
    resident_id: 'res-1',
    logged_by: 'Priya Nair',
    mood: 3,
    sleep: 3,
    pain: 2,
    weight_kg: 68.0,
    notes: null,
    created_at: '2026-09-10T08:30:00.000Z',
  },
  {
    id: 'log-3',
    resident_id: 'res-1',
    logged_by: 'Priya Nair',
    mood: 3,
    sleep: 2,
    pain: 3,
    weight_kg: null,
    notes: 'Blood pressure flagged to physician, otherwise alert and oriented.',
    created_at: '2026-09-13T19:15:00.000Z',
  },
  {
    id: 'log-4',
    resident_id: 'res-2',
    logged_by: 'Jamie Ruiz',
    mood: 5,
    sleep: 4,
    pain: 0,
    weight_kg: 81.5,
    notes: null,
    created_at: '2026-09-11T09:05:00.000Z',
  },
  {
    id: 'log-5',
    resident_id: 'res-3',
    logged_by: 'Diane Okafor',
    mood: 2,
    sleep: 2,
    pain: 4,
    weight_kg: 59.4,
    notes: 'Disoriented briefly after waking, settled once reoriented.',
    created_at: '2026-09-12T13:20:00.000Z',
  },
  {
    id: 'log-6',
    resident_id: 'res-3',
    logged_by: 'Diane Okafor',
    mood: 3,
    sleep: 4,
    pain: 3,
    weight_kg: 59.1,
    notes: null,
    created_at: '2026-09-14T06:50:00.000Z',
  },
]

// Starts empty — a carer starts their first shift from the Clients tab.
export const shifts: Shift[] = []

// Starts empty — a resident's first assistance request creates the first row.
export const assistanceRequests: AssistanceRequest[] = []
