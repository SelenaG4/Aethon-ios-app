import type { TranslationKey } from './engine'

// visit_notes.visit_type, visit_notes.tasks_completed and
// escalations.flag_outcome all store a plain English string chosen from a
// fixed set (see docs/SCHEMA_ADDITIONS.md and CLAUDE.md's data-naming
// section — the (unmodifiable) web app reads these fields as-is). Language
// switching must not change what gets stored — data.ts's own
// `outcome !== 'Raised, no response yet'` check depends on that exact
// English string never changing — so each option here carries a fixed
// `value` (always English, always what's stored/compared) alongside a
// `labelKey` (translated for display). Both the selection screens and any
// screen that later displays an already-stored value import from here, so
// there is exactly one place these English strings are spelled out.
export type LabelOption = {
  value: string
  labelKey: TranslationKey
}

export const VISIT_TYPE_OPTIONS: LabelOption[] = [
  { value: 'Medication', labelKey: 'clientProfile.visitType.medication' },
  { value: 'Personal care', labelKey: 'clientProfile.visitType.personalCare' },
  { value: 'Social visit', labelKey: 'clientProfile.visitType.socialVisit' },
  { value: 'Health check', labelKey: 'clientProfile.visitType.healthCheck' },
]

export const TASK_OPTIONS: LabelOption[] = [
  { value: 'Medication administered', labelKey: 'clientProfile.task.medicationAdministered' },
  { value: 'Meal supported', labelKey: 'clientProfile.task.mealSupported' },
  { value: 'Mobility assisted', labelKey: 'clientProfile.task.mobilityAssisted' },
  { value: 'Personal care assisted', labelKey: 'clientProfile.task.personalCareAssisted' },
  { value: 'Fluids encouraged', labelKey: 'clientProfile.task.fluidsEncouraged' },
]

// The third value is matched literally in data.ts's recordEscalationOutcome
// — never rename it here without updating that check too.
export const OUTCOME_OPTIONS: LabelOption[] = [
  { value: 'Physician reviewed, change made', labelKey: 'clientProfile.outcome.physicianReviewedChange' },
  { value: 'Physician reviewed, no change', labelKey: 'clientProfile.outcome.physicianReviewedNoChange' },
  { value: 'Raised, no response yet', labelKey: 'clientProfile.outcome.raisedNoResponse' },
  { value: 'Not raised in the end', labelKey: 'clientProfile.outcome.notRaised' },
]

function translateOption(
  value: string,
  options: LabelOption[],
  t: (key: TranslationKey) => string
): string {
  const option = options.find((o) => o.value === value)
  return option ? t(option.labelKey) : value
}

export function translateVisitType(value: string, t: (key: TranslationKey) => string): string {
  return translateOption(value, VISIT_TYPE_OPTIONS, t)
}

export function translateOutcome(value: string, t: (key: TranslationKey) => string): string {
  return translateOption(value, OUTCOME_OPTIONS, t)
}

// tasks_completed is a ", "-joined list of canonical English task labels
// (never free text) — translate each piece and rejoin the same way.
export function translateTaskList(csv: string, t: (key: TranslationKey) => string): string {
  if (!csv) return csv
  return csv
    .split(', ')
    .map((item) => translateOption(item, TASK_OPTIONS, t))
    .join(', ')
}
