import { COLORS } from '../constants/theme'
import type { HandoverEscalationEntry, HandoverNoteEntry } from './data'

export type HandoverData = {
  carerName: string
  shiftStartIso: string
  shiftEndIso: string | null
  notes: HandoverNoteEntry[]
  noteCount: number
  clientsSeenCount: number
  openEscalations: HandoverEscalationEntry[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')
}

// Guide's own hex values (docs/BUILD_GUIDE.txt, 7.3) are replaced with the
// matching theme.ts tokens per CLAUDE.md, so the PDF uses Aethon's actual
// brand colour instead of the guide's example green.
export function buildHandoverHtml(data: HandoverData): string {
  const shiftRange = `${formatTime(data.shiftStartIso)} – ${
    data.shiftEndIso ? formatTime(data.shiftEndIso) : 'ongoing'
  }`

  const clientsSeenRows = data.notes
    .flatMap((entry) =>
      entry.notes.map(
        (note) => `
      <tr>
        <td>${escapeHtml(entry.residentName)}</td>
        <td>${escapeHtml(note.visit_type ?? '—')}</td>
        <td>${formatTime(note.created_at)}</td>
      </tr>`
      )
    )
    .join('')

  const notesSections = data.notes
    .map(
      (entry) => `
    <h3>${escapeHtml(entry.residentName)}</h3>
    ${entry.notes
      .map(
        (note) => `
      <div class="note">
        <div class="note-time">${formatTime(note.created_at)}</div>
        <div>${escapeHtml(note.transcript ?? '')}</div>
      </div>`
      )
      .join('')}`
    )
    .join('')

  const escalationsSection =
    data.openEscalations.length === 0
      ? ''
      : `
    <h2>Open escalations</h2>
    ${data.openEscalations
      .map(
        (entry) => `
      <div class="escalation">
        <strong>${escapeHtml(entry.residentName)}</strong> — ${formatTime(entry.escalation.created_at)}<br/>
        ${escapeHtml(entry.escalation.reason)}
      </div>`
      )
      .join('')}`

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: Arial, sans-serif; padding: 32px; font-size: 14px; color: ${COLORS.text}; }
  h1 { font-size: 26px; font-weight: bold; color: ${COLORS.primaryDark}; margin-bottom: 4px; }
  h2 { background: ${COLORS.primary}; color: ${COLORS.surface}; padding: 8px 14px; border-radius: 6px; font-size: 16px; margin-top: 32px; }
  h3 { font-size: 15px; margin-top: 16px; margin-bottom: 8px; }
  .meta { color: ${COLORS.textSecond}; margin-bottom: 24px; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; }
  th { background: ${COLORS.primaryLight}; color: ${COLORS.primaryDark}; padding: 8px; text-align: left; }
  td { padding: 8px; border-bottom: 1px solid ${COLORS.border}; }
  .summary { width: 100%; margin-bottom: 24px; }
  .summary td { border-bottom: none; text-align: center; }
  .stat-value { font-size: 26px; font-weight: bold; display: block; }
  .stat-label { font-size: 13px; color: ${COLORS.textMuted}; }
  .note { background: ${COLORS.surfaceAlt}; padding: 12px; border-radius: 6px; margin-bottom: 8px; }
  .note-time { font-weight: bold; margin-bottom: 4px; }
  .escalation { background: ${COLORS.dangerLight}; border-left: 4px solid ${COLORS.danger}; padding: 12px; border-radius: 6px; margin-bottom: 8px; }
  .footer { margin-top: 48px; font-size: 11px; color: ${COLORS.textMuted}; font-style: italic; }
</style>
</head>
<body>
  <h1>Shift handover</h1>
  <div class="meta">
    ${escapeHtml(data.carerName)}<br/>
    ${formatDate(data.shiftStartIso)}<br/>
    ${shiftRange}
  </div>

  <table class="summary">
    <tr>
      <td><span class="stat-value">${data.clientsSeenCount}</span><span class="stat-label">Clients seen</span></td>
      <td><span class="stat-value">${data.noteCount}</span><span class="stat-label">Notes recorded</span></td>
      <td><span class="stat-value">${data.openEscalations.length}</span><span class="stat-label">Escalations open</span></td>
    </tr>
  </table>

  <h2>Clients seen</h2>
  <table>
    <tr><th>Client</th><th>Visit type</th><th>Time</th></tr>
    ${clientsSeenRows}
  </table>

  <h2>Notes</h2>
  ${notesSections}
  ${escalationsSection}

  <div class="footer">Care coordination summary. Not an official medical record.</div>
</body>
</html>`
}

// Plain text rendering of the same content — many services paste handovers
// into an existing system, for which text is more useful than a document.
export function buildHandoverText(data: HandoverData): string {
  const shiftRange = `${formatTime(data.shiftStartIso)} - ${
    data.shiftEndIso ? formatTime(data.shiftEndIso) : 'ongoing'
  }`

  const lines: string[] = [
    'Shift handover',
    data.carerName,
    formatDate(data.shiftStartIso),
    shiftRange,
    '',
    `Clients seen: ${data.clientsSeenCount}`,
    `Notes recorded: ${data.noteCount}`,
    `Escalations open: ${data.openEscalations.length}`,
    '',
    'CLIENTS SEEN',
  ]

  for (const entry of data.notes) {
    for (const note of entry.notes) {
      lines.push(`${entry.residentName} - ${note.visit_type ?? 'Visit'} - ${formatTime(note.created_at)}`)
    }
  }

  lines.push('', 'NOTES')
  for (const entry of data.notes) {
    lines.push(entry.residentName)
    for (const note of entry.notes) {
      lines.push(`  ${formatTime(note.created_at)}  ${note.transcript ?? ''}`)
    }
  }

  if (data.openEscalations.length > 0) {
    lines.push('', 'OPEN ESCALATIONS')
    for (const entry of data.openEscalations) {
      lines.push(`${entry.residentName} - ${entry.escalation.reason} - ${formatTime(entry.escalation.created_at)}`)
    }
  }

  lines.push('', 'Care coordination summary. Not an official medical record.')

  return lines.join('\n')
}
