import { COLORS } from '../constants/theme'

// Display, do not evaluate (CLAUDE.md): mapping a recorded pain or mood
// value to a band colour is the one explicit exception to that rule, not a
// threshold-driven alert or recommendation.
export function moodBandColor(value: number): string {
  if (value >= 4) return COLORS.primary
  if (value === 3) return COLORS.amber
  return COLORS.danger
}

export function painBandColor(value: number): string {
  if (value <= 3) return COLORS.primary
  if (value <= 6) return COLORS.amber
  return COLORS.danger
}
