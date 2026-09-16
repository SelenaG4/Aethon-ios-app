export type CareStage = 'independent' | 'assisted' | 'memory_care'

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
  date_of_birth: string
  room_or_address: string
  allergies: string[]
  physician_name: string
  physician_email: string
  emergency_contacts: EmergencyContact[]
  care_stage: CareStage
}

export type Medication = {
  id: string
  resident_id: string
  drug_name: string
  dose: string
  times: string[]
  active: boolean
}

export type VisitNote = {
  id: string
  resident_id: string
  carer_name: string
  transcript: string
  created_at: string
  reviewed_at: string | null
}

export const residents: Resident[] = [
  {
    id: 'res-1',
    first_name: 'Eleanor',
    last_name: 'Whitfield',
    date_of_birth: '1938-04-12',
    room_or_address: 'Room 214',
    allergies: ['Penicillin', 'Shellfish'],
    physician_name: 'Dr. Amara Osei',
    physician_email: 'aosei@willowbrookmedical.com',
    emergency_contacts: [
      { name: 'Margaret Whitfield', relationship: 'Daughter', phone: '+1-555-0142', priority: 1 },
      { name: 'Thomas Whitfield', relationship: 'Son', phone: '+1-555-0198', priority: 2 },
    ],
    care_stage: 'assisted',
  },
  {
    id: 'res-2',
    first_name: 'Harold',
    last_name: 'Jennings',
    date_of_birth: '1945-11-03',
    room_or_address: 'Room 108',
    allergies: ['Sulfa drugs'],
    physician_name: 'Dr. Priya Chandran',
    physician_email: 'pchandran@willowbrookmedical.com',
    emergency_contacts: [
      { name: 'Susan Jennings-Cole', relationship: 'Daughter', phone: '+1-555-0176', priority: 1 },
    ],
    care_stage: 'independent',
  },
  {
    id: 'res-3',
    first_name: 'Rosa',
    last_name: 'Delgado',
    date_of_birth: '1932-07-29',
    room_or_address: 'Room 301',
    allergies: [],
    physician_name: 'Dr. Michael Foster',
    physician_email: 'mfoster@willowbrookmedical.com',
    emergency_contacts: [
      { name: 'Carlos Delgado', relationship: 'Son', phone: '+1-555-0213', priority: 1 },
      { name: 'Ana Delgado', relationship: 'Granddaughter', phone: '+1-555-0247', priority: 2 },
    ],
    care_stage: 'memory_care',
  },
]

export const medications: Medication[] = [
  { id: 'med-1', resident_id: 'res-1', drug_name: 'Lisinopril', dose: '10mg', times: ['08:00'], active: true },
  { id: 'med-2', resident_id: 'res-1', drug_name: 'Metformin', dose: '500mg', times: ['08:00', '18:00'], active: true },
  { id: 'med-3', resident_id: 'res-1', drug_name: 'Atorvastatin', dose: '20mg', times: ['20:00'], active: true },

  { id: 'med-4', resident_id: 'res-2', drug_name: 'Amlodipine', dose: '5mg', times: ['08:00'], active: true },
  { id: 'med-5', resident_id: 'res-2', drug_name: 'Omeprazole', dose: '20mg', times: ['07:30'], active: true },

  { id: 'med-6', resident_id: 'res-3', drug_name: 'Donepezil', dose: '10mg', times: ['20:00'], active: true },
  { id: 'med-7', resident_id: 'res-3', drug_name: 'Memantine', dose: '5mg', times: ['08:00', '20:00'], active: true },
  { id: 'med-8', resident_id: 'res-3', drug_name: 'Aspirin', dose: '81mg', times: ['08:00'], active: false },
]

export const visitNotes: VisitNote[] = [
  {
    id: 'note-1',
    resident_id: 'res-1',
    carer_name: 'Jamie Ruiz',
    transcript: 'Eleanor was in good spirits this morning. Ate full breakfast, took all medications on schedule. Mentioned mild knee stiffness, no fall risk observed.',
    created_at: '2026-09-10T08:30:00.000Z',
    reviewed_at: '2026-09-10T14:05:00.000Z',
  },
  {
    id: 'note-2',
    resident_id: 'res-1',
    carer_name: 'Priya Nair',
    transcript: 'Evening check-in: blood pressure slightly elevated at 142/88. Advised to monitor and flagged to physician. Eleanor was alert and oriented.',
    created_at: '2026-09-13T19:15:00.000Z',
    reviewed_at: null,
  },
  {
    id: 'note-3',
    resident_id: 'res-2',
    carer_name: 'Jamie Ruiz',
    transcript: 'Harold completed his morning walk in the garden unassisted. No complaints. Reminded him about upcoming physician appointment on the 20th.',
    created_at: '2026-09-11T09:00:00.000Z',
    reviewed_at: '2026-09-11T16:40:00.000Z',
  },
  {
    id: 'note-4',
    resident_id: 'res-3',
    carer_name: 'Diane Okafor',
    transcript: 'Rosa was disoriented briefly after waking from a nap but settled once reoriented to place and time. Ate lunch with assistance. Family visited in the afternoon.',
    created_at: '2026-09-12T13:20:00.000Z',
    reviewed_at: '2026-09-12T18:00:00.000Z',
  },
  {
    id: 'note-5',
    resident_id: 'res-3',
    carer_name: 'Diane Okafor',
    transcript: 'Overnight check: Rosa slept through the night without incident. Medications administered on schedule.',
    created_at: '2026-09-14T06:45:00.000Z',
    reviewed_at: null,
  },
]
