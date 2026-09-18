import { COLORS } from '../constants/theme'
import { formatLongDate, formatTime, translateVisitType, type TranslationKey } from './i18n'
import type { HandoverEscalationEntry, HandoverNoteEntry, Language } from './data'

export type HandoverData = {
  carerName: string
  shiftStartIso: string
  shiftEndIso: string | null
  notes: HandoverNoteEntry[]
  noteCount: number
  clientsSeenCount: number
  openEscalations: HandoverEscalationEntry[]
}

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string

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
export function buildHandoverHtml(data: HandoverData, t: Translate, language: Language): string {
  const shiftRange = `${formatTime(data.shiftStartIso)} – ${
    data.shiftEndIso ? formatTime(data.shiftEndIso) : t('handover.ongoing')
  }`

  const clientsSeenRows = data.notes
    .flatMap((entry) =>
      entry.notes.map(
        (note) => `
      <tr>
        <td>${escapeHtml(entry.residentName)}</td>
        <td>${escapeHtml(note.visit_type ? translateVisitType(note.visit_type, t) : '—')}</td>
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
    <h2>${escapeHtml(t('handover.pdfOpenEscalationsHeading'))}</h2>
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
  <h1>${escapeHtml(t('handover.pdfTitle'))}</h1>
  <div class="meta">
    ${escapeHtml(data.carerName)}<br/>
    ${formatLongDate(data.shiftStartIso, language)}<br/>
    ${shiftRange}
  </div>

  <table class="summary">
    <tr>
      <td><span class="stat-value">${data.clientsSeenCount}</span><span class="stat-label">${escapeHtml(t('handover.clientsSeen'))}</span></td>
      <td><span class="stat-value">${data.noteCount}</span><span class="stat-label">${escapeHtml(t('handover.notesRecorded'))}</span></td>
      <td><span class="stat-value">${data.openEscalations.length}</span><span class="stat-label">${escapeHtml(t('handover.escalationsOpen'))}</span></td>
    </tr>
  </table>

  <h2>${escapeHtml(t('handover.pdfClientsSeenHeading'))}</h2>
  <table>
    <tr><th>${escapeHtml(t('handover.clientsSeen'))}</th><th>${escapeHtml(t('noteReview.visitType'))}</th><th>${escapeHtml(t('handover.timeColumn'))}</th></tr>
    ${clientsSeenRows}
  </table>

  <h2>${escapeHtml(t('handover.pdfNotesHeading'))}</h2>
  ${notesSections}
  ${escalationsSection}

  <div class="footer">${escapeHtml(t('handover.footer'))}</div>
</body>
</html>`
}

// Plain text rendering of the same content — many services paste handovers
// into an existing system, for which text is more useful than a document.
export function buildHandoverText(data: HandoverData, t: Translate, language: Language): string {
  const shiftRange = `${formatTime(data.shiftStartIso)} - ${
    data.shiftEndIso ? formatTime(data.shiftEndIso) : t('handover.ongoing')
  }`

  const lines: string[] = [
    t('handover.pdfTitle'),
    data.carerName,
    formatLongDate(data.shiftStartIso, language),
    shiftRange,
    '',
    `${t('handover.clientsSeen')}: ${data.clientsSeenCount}`,
    `${t('handover.notesRecorded')}: ${data.noteCount}`,
    `${t('handover.escalationsOpen')}: ${data.openEscalations.length}`,
    '',
    t('handover.pdfClientsSeenHeading').toUpperCase(),
  ]

  for (const entry of data.notes) {
    for (const note of entry.notes) {
      const visit = note.visit_type ? translateVisitType(note.visit_type, t) : t('handover.visitFallback')
      lines.push(`${entry.residentName} - ${visit} - ${formatTime(note.created_at)}`)
    }
  }

  lines.push('', t('handover.pdfNotesHeading').toUpperCase())
  for (const entry of data.notes) {
    lines.push(entry.residentName)
    for (const note of entry.notes) {
      lines.push(`  ${formatTime(note.created_at)}  ${note.transcript ?? ''}`)
    }
  }

  if (data.openEscalations.length > 0) {
    lines.push('', t('handover.pdfOpenEscalationsHeading').toUpperCase())
    for (const entry of data.openEscalations) {
      lines.push(`${entry.residentName} - ${entry.escalation.reason} - ${formatTime(entry.escalation.created_at)}`)
    }
  }

  lines.push('', t('handover.footer'))

  return lines.join('\n')
}
