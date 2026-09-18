import { createAssistanceRequest } from './data'
import type { EmergencyContact } from './mockData'

const NIGHT_START_HOUR = 22
const NIGHT_END_HOUR = 8

export function isNightHour(hour: number): boolean {
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR
}

// Priority two at night, priority one otherwise, falling back to whichever
// contact exists if the resident doesn't have one at that priority.
export function pickAssistanceContact(contacts: EmergencyContact[]): EmergencyContact | undefined {
  if (contacts.length === 0) return undefined
  const night = isNightHour(new Date().getHours())
  return contacts.find((c) => c.priority === (night ? 2 : 1)) ?? contacts[0]
}

export type AssistanceResult = {
  delivered: boolean
  contactName: string
}

// There is no push delivery in this app yet (CLAUDE.md: no backend, no
// Firebase) — delivered is always false. The guide's own escalate-after-
// three-minutes logic depends on checking whether a push was acknowledged,
// which can never happen here, so it isn't implemented; see
// docs/SCHEMA_ADDITIONS.md.
export async function requestAssistance(
  residentId: string,
  contact: EmergencyContact
): Promise<AssistanceResult> {
  await createAssistanceRequest({
    resident_id: residentId,
    contacted_name: contact.name,
    contacted_phone: contact.phone,
  })
  return { delivered: false, contactName: contact.name }
}
