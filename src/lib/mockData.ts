// Table and field names below match the web app (~/Developer/aethon-web), which
// reads/writes the same Supabase database this app will use later. Fields marked
// "Not in the web app yet" are additions this build needs — see the note at the
// bottom of data.ts for the list to confirm with the team before the real backend
// is wired up.

export type CareStage = 'Independent' | 'Home care' | 'Facility'

export type CareStageChange = {
  stage: CareStage
  changed_at: string
}

export type EmergencyContact = {
  name: string
  relationship: string
  phone: string
  priority: number
}

export type Resident = {
  id: string
  first_name: string
  last_name: string
  room_number: string | null
  care_stage: CareStage
  // Not in the web app yet.
  date_of_birth: string
  allergies: string[]
  physician_name: string
  physician_email: string
  emergency_contacts: EmergencyContact[]
  care_stage_history: CareStageChange[]
}

export type MedicationStatus = 'due' | 'taken' | 'missed'

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

// Not in the web app yet: an audit trail of each time a carer marked a
// medication's status, since the web app only keeps the latest status on
// the medication row itself.
export type MedicationAcknowledgement = {
  id: string
  medication_id: string
  resident_id: string
  carer_name: string
  status: MedicationStatus
  acknowledged_at: string
}

export type VisitNote = {
  id: string
  resident_id: string
  visit_type: string
  tasks_completed: string
  is_escalation: boolean
  created_at: string
  // Not in the web app yet.
  carer_name: string
  transcript: string | null
  reviewed_at: string | null
}

export type EscalationSeverity = 'low' | 'medium' | 'high'

export type Escalation = {
  id: string
  resident_id: string
  reason: string
  severity: EscalationSeverity
  is_resolved: boolean
  created_at: string
  resolved_at: string | null
}

export type MessageSenderRole = 'staff' | 'family'

export type Message = {
  id: string
  resident_id: string
  sender_id: string
  sender_role: MessageSenderRole
  content: string
  created_at: string
}

// Not in the web app yet: vitals captured during a visit.
export type HealthLog = {
  id: string
  resident_id: string
  logged_by: string
  heart_rate_bpm: number | null
  blood_pressure: string | null
  notes: string | null
  created_at: string
}

export const residents: Resident[] = [
  {
    id: 'res-1',
    first_name: 'Eleanor',
    last_name: 'Whitfield',
    room_number: '214',
    care_stage: 'Home care',
    date_of_birth: '1938-04-12',
    allergies: ['Penicillin', 'Shellfish'],
    physician_name: 'Dr. Amara Osei',
    physician_email: 'aosei@willowbrookmedical.com',
    emergency_contacts: [
      { name: 'Margaret Whitfield', relationship: 'Daughter', phone: '+1-555-0142', priority: 1 },
      { name: 'Thomas Whitfield', relationship: 'Son', phone: '+1-555-0198', priority: 2 },
    ],
    care_stage_history: [
      { stage: 'Independent', changed_at: '2024-02-01T00:00:00.000Z' },
      { stage: 'Home care', changed_at: '2025-06-15T00:00:00.000Z' },
    ],
  },
  {
    id: 'res-2',
    first_name: 'Harold',
    last_name: 'Jennings',
    room_number: '108',
    care_stage: 'Independent',
    date_of_birth: '1945-11-03',
    allergies: ['Sulfa drugs'],
    physician_name: 'Dr. Priya Chandran',
    physician_email: 'pchandran@willowbrookmedical.com',
    emergency_contacts: [
      { name: 'Susan Jennings-Cole', relationship: 'Daughter', phone: '+1-555-0176', priority: 1 },
    ],
    care_stage_history: [
      { stage: 'Independent', changed_at: '2023-09-10T00:00:00.000Z' },
    ],
  },
  {
    id: 'res-3',
    first_name: 'Rosa',
    last_name: 'Delgado',
    room_number: '301',
    care_stage: 'Facility',
    date_of_birth: '1932-07-29',
    allergies: [],
    physician_name: 'Dr. Michael Foster',
    physician_email: 'mfoster@willowbrookmedical.com',
    emergency_contacts: [
      { name: 'Carlos Delgado', relationship: 'Son', phone: '+1-555-0213', priority: 1 },
      { name: 'Ana Delgado', relationship: 'Granddaughter', phone: '+1-555-0247', priority: 2 },
    ],
    care_stage_history: [
      { stage: 'Independent', changed_at: '2021-03-01T00:00:00.000Z' },
      { stage: 'Home care', changed_at: '2023-01-20T00:00:00.000Z' },
      { stage: 'Facility', changed_at: '2025-08-05T00:00:00.000Z' },
    ],
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
  { id: 'ack-1', medication_id: 'med-1', resident_id: 'res-1', carer_name: 'Jamie Ruiz', status: 'taken', acknowledged_at: '2026-09-16T08:05:00.000Z' },
  { id: 'ack-2', medication_id: 'med-2', resident_id: 'res-1', carer_name: 'Jamie Ruiz', status: 'taken', acknowledged_at: '2026-09-16T08:05:00.000Z' },
  { id: 'ack-3', medication_id: 'med-5', resident_id: 'res-2', carer_name: 'Jamie Ruiz', status: 'taken', acknowledged_at: '2026-09-16T08:10:00.000Z' },
  { id: 'ack-4', medication_id: 'med-6', resident_id: 'res-2', carer_name: 'Priya Nair', status: 'taken', acknowledged_at: '2026-09-16T07:35:00.000Z' },
  { id: 'ack-5', medication_id: 'med-8', resident_id: 'res-3', carer_name: 'Diane Okafor', status: 'taken', acknowledged_at: '2026-09-16T08:15:00.000Z' },
  { id: 'ack-6', medication_id: 'med-10', resident_id: 'res-3', carer_name: 'Diane Okafor', status: 'missed', acknowledged_at: '2026-09-16T09:00:00.000Z' },
]

export const visitNotes: VisitNote[] = [
  {
    id: 'note-1',
    resident_id: 'res-1',
    visit_type: 'Morning Visit',
    tasks_completed: 'Breakfast and morning medications administered.',
    is_escalation: false,
    carer_name: 'Jamie Ruiz',
    transcript: 'Eleanor was in good spirits this morning. Ate full breakfast, took all medications on schedule. Mentioned mild knee stiffness, no fall risk observed.',
    created_at: '2026-09-10T08:30:00.000Z',
    reviewed_at: '2026-09-10T14:05:00.000Z',
  },
  {
    id: 'note-2',
    resident_id: 'res-1',
    visit_type: 'Evening Visit',
    tasks_completed: 'Blood pressure checked and flagged to physician.',
    is_escalation: false,
    carer_name: 'Priya Nair',
    transcript: 'Evening check-in: blood pressure slightly elevated at 142/88. Advised to monitor and flagged to physician. Eleanor was alert and oriented.',
    created_at: '2026-09-13T19:15:00.000Z',
    reviewed_at: null,
  },
  {
    id: 'note-3',
    resident_id: 'res-2',
    visit_type: 'Morning Visit',
    tasks_completed: 'Garden walk completed unassisted.',
    is_escalation: false,
    carer_name: 'Jamie Ruiz',
    transcript: 'Harold completed his morning walk in the garden unassisted. No complaints. Reminded him about upcoming physician appointment on the 20th.',
    created_at: '2026-09-11T09:00:00.000Z',
    reviewed_at: '2026-09-11T16:40:00.000Z',
  },
  {
    id: 'note-4',
    resident_id: 'res-3',
    visit_type: 'Afternoon Visit',
    tasks_completed: 'Reoriented after nap, assisted with lunch.',
    is_escalation: false,
    carer_name: 'Diane Okafor',
    transcript: 'Rosa was disoriented briefly after waking from a nap but settled once reoriented to place and time. Ate lunch with assistance. Family visited in the afternoon.',
    created_at: '2026-09-12T13:20:00.000Z',
    reviewed_at: '2026-09-12T18:00:00.000Z',
  },
  {
    id: 'note-5',
    resident_id: 'res-3',
    visit_type: 'Overnight Visit',
    tasks_completed: 'Overnight check, medications administered on schedule.',
    is_escalation: false,
    carer_name: 'Diane Okafor',
    transcript: 'Overnight check: Rosa slept through the night without incident. Medications administered on schedule.',
    created_at: '2026-09-14T06:45:00.000Z',
    reviewed_at: null,
  },
]

export const escalations: Escalation[] = [
  {
    id: 'esc-1',
    resident_id: 'res-1',
    reason: 'Blood pressure reading 142/88, above normal range.',
    severity: 'medium',
    is_resolved: true,
    created_at: '2026-09-13T19:20:00.000Z',
    resolved_at: '2026-09-14T09:00:00.000Z',
  },
  {
    id: 'esc-2',
    resident_id: 'res-3',
    reason: 'Found disoriented after waking from a nap; settled once reoriented, no injury observed.',
    severity: 'high',
    is_resolved: false,
    created_at: '2026-09-15T02:10:00.000Z',
    resolved_at: null,
  },
]

export const messages: Message[] = [
  {
    id: 'msg-1',
    resident_id: 'res-1',
    sender_id: 'family-margaret',
    sender_role: 'family',
    content: "Hi, just checking in on how Mom's knee is doing today?",
    created_at: '2026-09-10T15:00:00.000Z',
  },
  {
    id: 'msg-2',
    resident_id: 'res-1',
    sender_id: 'carer-test',
    sender_role: 'staff',
    content: 'She did well today! Ate a full breakfast and mentioned only mild stiffness. No fall risk.',
    created_at: '2026-09-10T15:12:00.000Z',
  },
  {
    id: 'msg-3',
    resident_id: 'res-3',
    sender_id: 'family-carlos',
    sender_role: 'family',
    content: 'Thank you for looking after Rosa during her nap mix-up.',
    created_at: '2026-09-12T19:00:00.000Z',
  },
  {
    id: 'msg-4',
    resident_id: 'res-3',
    sender_id: 'carer-test',
    sender_role: 'staff',
    content: 'Of course — she settled quickly and enjoyed her family visit this afternoon.',
    created_at: '2026-09-12T19:20:00.000Z',
  },
]

export const healthLogs: HealthLog[] = [
  {
    id: 'log-1',
    resident_id: 'res-1',
    logged_by: 'Jamie Ruiz',
    heart_rate_bpm: 72,
    blood_pressure: '142/88',
    notes: 'Slightly elevated blood pressure, monitoring.',
    created_at: '2026-09-13T19:15:00.000Z',
  },
  {
    id: 'log-2',
    resident_id: 'res-2',
    logged_by: 'Jamie Ruiz',
    heart_rate_bpm: 68,
    blood_pressure: '118/76',
    notes: null,
    created_at: '2026-09-11T09:05:00.000Z',
  },
  {
    id: 'log-3',
    resident_id: 'res-3',
    logged_by: 'Diane Okafor',
    heart_rate_bpm: 80,
    blood_pressure: '130/85',
    notes: 'Stable overnight.',
    created_at: '2026-09-14T06:50:00.000Z',
  },
]
