import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  residents as initialResidents,
  medications as initialMedications,
  medicationAcknowledgements as initialMedicationAcknowledgements,
  visitNotes as initialVisitNotes,
  escalations as initialEscalations,
  messages as initialMessages,
  healthLogs as initialHealthLogs,
  Resident,
  Medication,
  MedicationAcknowledgement,
  VisitNote,
  Escalation,
  Message,
  HealthLog,
} from './mockData'

// This is the only file screens should import to read or write data.
// Everything here runs against in-memory + AsyncStorage-backed mock data.
// When a backend is added, only the internals of this file should change.
//
// Table and field names mirror the web app (~/Developer/aethon-web), which
// reads/writes the same Supabase database this app will use later. See
// mockData.ts for which fields are additions this build needs that the web
// app doesn't have yet.

const STORAGE_KEY = '@aethon/mock_data_v2'
const VIEW_CHOICE_KEY = '@aethon/view_choice_v1'

export type ViewChoice = 'carer' | 'resident'

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
}

export async function getResidents(): Promise<Resident[]> {
  const s = await loadStore()
  return s.residents
}

export async function getResident(id: string): Promise<Resident | undefined> {
  const s = await loadStore()
  return s.residents.find((r) => r.id === id)
}

export async function getMedications(residentId: string): Promise<Medication[]> {
  const s = await loadStore()
  return s.medications.filter((m) => m.resident_id === residentId)
}

export async function getMedicationAcknowledgements(medicationId: string): Promise<MedicationAcknowledgement[]> {
  const s = await loadStore()
  return s.medicationAcknowledgements
    .filter((a) => a.medication_id === medicationId)
    .sort((a, b) => b.acknowledged_at.localeCompare(a.acknowledged_at))
}

export async function getVisitNotes(residentId: string): Promise<VisitNote[]> {
  const s = await loadStore()
  return s.visitNotes
    .filter((n) => n.resident_id === residentId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function getUnreviewedVisitNotesCount(): Promise<number> {
  const s = await loadStore()
  return s.visitNotes.filter((n) => n.reviewed_at === null).length
}

export async function addVisitNote(
  note: Omit<VisitNote, 'id' | 'created_at' | 'reviewed_at'> & Partial<Pick<VisitNote, 'created_at' | 'reviewed_at'>>
): Promise<VisitNote> {
  const s = await loadStore()
  const newNote: VisitNote = {
    id: `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    resident_id: note.resident_id,
    visit_type: note.visit_type,
    tasks_completed: note.tasks_completed,
    is_escalation: note.is_escalation,
    carer_name: note.carer_name,
    transcript: note.transcript,
    created_at: note.created_at ?? new Date().toISOString(),
    reviewed_at: note.reviewed_at ?? null,
  }
  s.visitNotes.push(newNote)
  await persist()
  return newNote
}

export async function getEscalations(residentId: string): Promise<Escalation[]> {
  const s = await loadStore()
  return s.escalations
    .filter((e) => e.resident_id === residentId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function addEscalation(
  escalation: Omit<Escalation, 'id' | 'created_at' | 'is_resolved' | 'resolved_at'> &
    Partial<Pick<Escalation, 'created_at' | 'is_resolved' | 'resolved_at'>>
): Promise<Escalation> {
  const s = await loadStore()
  const newEscalation: Escalation = {
    id: `esc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    resident_id: escalation.resident_id,
    reason: escalation.reason,
    severity: escalation.severity,
    is_resolved: escalation.is_resolved ?? false,
    created_at: escalation.created_at ?? new Date().toISOString(),
    resolved_at: escalation.resolved_at ?? null,
  }
  s.escalations.push(newEscalation)
  await persist()
  return newEscalation
}

export async function getMessages(residentId: string): Promise<Message[]> {
  const s = await loadStore()
  return s.messages
    .filter((m) => m.resident_id === residentId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export async function addMessage(
  message: Omit<Message, 'id' | 'created_at'> & Partial<Pick<Message, 'created_at'>>
): Promise<Message> {
  const s = await loadStore()
  const newMessage: Message = {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    resident_id: message.resident_id,
    sender_id: message.sender_id,
    sender_role: message.sender_role,
    content: message.content,
    created_at: message.created_at ?? new Date().toISOString(),
  }
  s.messages.push(newMessage)
  await persist()
  return newMessage
}

export async function getHealthLogs(residentId: string): Promise<HealthLog[]> {
  const s = await loadStore()
  return s.healthLogs
    .filter((h) => h.resident_id === residentId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
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
