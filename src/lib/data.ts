import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  residents as initialResidents,
  medications as initialMedications,
  visitNotes as initialVisitNotes,
  Resident,
  Medication,
  VisitNote,
} from './mockData'

// This is the only file screens should import to read or write data.
// Everything here runs against in-memory + AsyncStorage-backed mock data.
// When a backend is added, only the internals of this file should change.

const STORAGE_KEY = '@aethon/mock_data_v1'

type Store = {
  residents: Resident[]
  medications: Medication[]
  visitNotes: VisitNote[]
}

function cloneInitialData(): Store {
  return {
    residents: JSON.parse(JSON.stringify(initialResidents)),
    medications: JSON.parse(JSON.stringify(initialMedications)),
    visitNotes: JSON.parse(JSON.stringify(initialVisitNotes)),
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

export async function getVisitNotes(residentId: string): Promise<VisitNote[]> {
  const s = await loadStore()
  return s.visitNotes
    .filter((n) => n.resident_id === residentId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function addVisitNote(
  note: Omit<VisitNote, 'id' | 'created_at' | 'reviewed_at'> & Partial<Pick<VisitNote, 'created_at' | 'reviewed_at'>>
): Promise<VisitNote> {
  const s = await loadStore()
  const newNote: VisitNote = {
    id: `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    resident_id: note.resident_id,
    carer_name: note.carer_name,
    transcript: note.transcript,
    created_at: note.created_at ?? new Date().toISOString(),
    reviewed_at: note.reviewed_at ?? null,
  }
  s.visitNotes.push(newNote)
  await persist()
  return newNote
}

export async function resetMockData(): Promise<void> {
  store = cloneInitialData()
  await AsyncStorage.removeItem(STORAGE_KEY)
}
