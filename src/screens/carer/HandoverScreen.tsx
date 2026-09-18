import React, { useCallback, useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import Clipboard from '@react-native-clipboard/clipboard'
import Share from 'react-native-share'
import { generatePDF } from 'react-native-html-to-pdf'
import { Inbox } from 'lucide-react-native'
import { AppText, EmptyView, ErrorView, LoadingView } from '../../components'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../../constants/theme'
import {
  CURRENT_CARER,
  endShift,
  getCurrentShift,
  getShiftHandoverData,
  ShiftHandoverData,
  subscribe,
} from '../../lib/data'
import { buildHandoverHtml, buildHandoverText } from '../../lib/handover'
import { formatLongDate, formatTime, translateVisitType, useTranslation } from '../../lib/i18n'
import type { Shift } from '../../lib/mockData'

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000

function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`
}

function fileDateString(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export default function HandoverScreen() {
  const { t, language } = useTranslation()
  const [shift, setShift] = useState<Shift | null>(null)
  const [boundaryIso, setBoundaryIso] = useState<string | null>(null)
  const [handoverData, setHandoverData] = useState<ShiftHandoverData | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [isCopied, setIsCopied] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const currentShift = await getCurrentShift()
      const boundary = currentShift
        ? currentShift.started_at
        : new Date(Date.now() - TWELVE_HOURS_MS).toISOString()
      const data = await getShiftHandoverData(boundary)
      setShift(currentShift)
      setBoundaryIso(boundary)
      setHandoverData(data)
      setLoadState('loaded')
    } catch {
      setLoadState('error')
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  useEffect(() => subscribe(load), [load])

  const onCopyText = useCallback(() => {
    if (!handoverData || !boundaryIso) return
    const text = buildHandoverText(
      {
        carerName: CURRENT_CARER.name,
        shiftStartIso: boundaryIso,
        shiftEndIso: shift?.ended_at ?? null,
        ...handoverData,
      },
      t,
      language
    )
    Clipboard.setString(text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }, [handoverData, boundaryIso, shift, t, language])

  const onExportPdf = useCallback(async () => {
    if (!handoverData || !boundaryIso) return
    setExportError(null)
    setIsExportingPdf(true)
    try {
      const html = buildHandoverHtml(
        {
          carerName: CURRENT_CARER.name,
          shiftStartIso: boundaryIso,
          shiftEndIso: shift?.ended_at ?? null,
          ...handoverData,
        },
        t,
        language
      )
      const pdf = await generatePDF({
        html,
        fileName: `Aethon_Handover_${fileDateString(boundaryIso)}`,
        base64: false,
      })
      await Share.open({ url: `file://${pdf.filePath}`, type: 'application/pdf' })
    } catch {
      setExportError(t('handover.exportError'))
    } finally {
      setIsExportingPdf(false)
    }
  }, [handoverData, boundaryIso, shift, t, language])

  const onCloseShift = useCallback(async () => {
    if (!shift) return
    await endShift(shift.id)
  }, [shift])

  if (loadState === 'error') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorView message={t('handover.loadError')} onRetry={load} />
      </SafeAreaView>
    )
  }

  if (loadState === 'loading' || !handoverData || !boundaryIso) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingView />
      </SafeAreaView>
    )
  }

  const isActiveShift = shift !== null
  const shiftRangeLabel = isActiveShift
    ? t('handover.rangeOngoing', { time: formatTime(boundaryIso) })
    : t('handover.rangeLast12Hours', { time: formatTime(boundaryIso) })

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText weight="black" style={styles.title}>
          {t('handover.title')}
        </AppText>
        <AppText style={styles.metaText}>{CURRENT_CARER.name}</AppText>
        <AppText style={styles.metaText}>{formatLongDate(boundaryIso, language)}</AppText>
        <AppText style={styles.metaText}>{shiftRangeLabel}</AppText>

        <View style={styles.summaryStrip}>
          <View style={styles.summaryBox}>
            <AppText weight="black" style={styles.summaryValue}>
              {handoverData.clientsSeenCount}
            </AppText>
            <AppText style={styles.summaryLabel}>{t('handover.clientsSeen')}</AppText>
          </View>
          <View style={styles.summaryBox}>
            <AppText weight="black" style={styles.summaryValue}>
              {handoverData.noteCount}
            </AppText>
            <AppText style={styles.summaryLabel}>{t('handover.notesRecorded')}</AppText>
          </View>
          <View style={styles.summaryBox}>
            <AppText weight="black" style={styles.summaryValue}>
              {handoverData.openEscalations.length}
            </AppText>
            <AppText style={styles.summaryLabel}>{t('handover.escalationsOpen')}</AppText>
          </View>
        </View>

        {handoverData.notes.length === 0 ? (
          <EmptyView icon={Inbox} message={t('handover.noVisitsRecorded')} />
        ) : (
          <>
            <AppText weight="bold" style={styles.sectionHeading}>
              {t('handover.clientsSeen')}
            </AppText>
            {handoverData.notes.flatMap((entry) =>
              entry.notes.map((note) => (
                <View key={note.id} style={styles.clientSeenRow}>
                  <AppText weight="bold" style={styles.clientSeenName}>
                    {entry.residentName}
                  </AppText>
                  <AppText style={styles.clientSeenMeta}>
                    {note.visit_type ? translateVisitType(note.visit_type, t) : t('handover.visitFallback')} ·{' '}
                    {formatTime(note.created_at)}
                  </AppText>
                </View>
              ))
            )}

            <AppText weight="bold" style={[styles.sectionHeading, styles.sectionSpacing]}>
              {t('handover.notes')}
            </AppText>
            {handoverData.notes.map((entry) => (
              <View key={entry.residentId} style={styles.notesGroup}>
                <AppText weight="bold" style={styles.notesGroupName}>
                  {entry.residentName}
                </AppText>
                {entry.notes.map((note) => (
                  <View key={note.id} style={styles.noteBlock}>
                    <AppText weight="bold" style={styles.noteTime}>
                      {formatTime(note.created_at)}
                    </AppText>
                    <Text selectable style={styles.noteTranscript}>
                      {note.transcript ?? ''}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

        {handoverData.openEscalations.length > 0 ? (
          <>
            <AppText weight="bold" style={[styles.sectionHeading, styles.sectionSpacing]}>
              {t('handover.openEscalations')}
            </AppText>
            {handoverData.openEscalations.map((entry) => (
              <View key={entry.escalation.id} style={styles.escalationCard}>
                <AppText weight="bold" style={styles.escalationName}>
                  {entry.residentName} · {formatTime(entry.escalation.created_at)}
                </AppText>
                <AppText style={styles.escalationReason}>{entry.escalation.reason}</AppText>
              </View>
            ))}
          </>
        ) : null}

        <AppText style={styles.footer}>{t('handover.footer')}</AppText>

        {exportError ? <AppText style={styles.exportError}>{exportError}</AppText> : null}

        <Pressable
          style={styles.secondaryButton}
          onPress={onCopyText}
          accessibilityRole="button"
          accessibilityLabel={t('handover.copyAsText')}
        >
          <AppText weight="bold" style={styles.secondaryButtonText}>
            {isCopied ? t('handover.copied') : t('handover.copyAsText')}
          </AppText>
        </Pressable>

        <Pressable
          style={styles.primaryButton}
          onPress={onExportPdf}
          disabled={isExportingPdf}
          accessibilityRole="button"
          accessibilityLabel={t('handover.exportPdf')}
        >
          <AppText weight="bold" style={styles.primaryButtonText}>
            {isExportingPdf ? t('handover.exporting') : t('handover.exportPdf')}
          </AppText>
        </Pressable>

        {isActiveShift ? (
          <Pressable
            style={styles.closeShiftButton}
            onPress={onCloseShift}
            accessibilityRole="button"
            accessibilityLabel={t('handover.closeShift')}
          >
            <AppText weight="bold" style={styles.closeShiftButtonText}>
              {t('handover.closeShift')}
            </AppText>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    padding: 20,
    paddingBottom: SPACE.xl,
  },
  title: {
    fontSize: 24,
    color: COLORS.primaryDark,
    marginBottom: SPACE.sm,
  },
  metaText: {
    fontSize: 16,
    color: COLORS.textSecond,
  },
  summaryStrip: {
    flexDirection: 'row',
    marginTop: SPACE.lg,
    marginBottom: SPACE.lg,
  },
  summaryBox: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 26,
    color: COLORS.text,
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: TYPE.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: TYPE.body,
    color: COLORS.text,
    marginBottom: SPACE.sm,
  },
  sectionSpacing: {
    marginTop: SPACE.lg,
  },
  clientSeenRow: {
    marginBottom: SPACE.sm,
  },
  clientSeenName: {
    fontSize: TYPE.body,
    color: COLORS.text,
  },
  clientSeenMeta: {
    marginTop: 2,
    fontSize: TYPE.small,
    color: COLORS.textMuted,
  },
  notesGroup: {
    marginBottom: SPACE.md,
  },
  notesGroupName: {
    fontSize: TYPE.body,
    color: COLORS.text,
    marginBottom: SPACE.sm,
  },
  noteBlock: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: SPACE.sm,
  },
  noteTime: {
    fontSize: TYPE.small,
    color: COLORS.text,
    marginBottom: 4,
  },
  noteTranscript: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
  },
  escalationCard: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: SPACE.sm,
  },
  escalationName: {
    fontSize: TYPE.small,
    color: COLORS.danger,
    marginBottom: 4,
  },
  escalationReason: {
    fontSize: 16,
    color: COLORS.text,
  },
  footer: {
    marginTop: SPACE.xl,
    fontSize: TYPE.caption,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  exportError: {
    marginTop: SPACE.md,
    fontSize: TYPE.small,
    color: COLORS.danger,
  },
  secondaryButton: {
    height: 56,
    marginTop: SPACE.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 18,
    color: COLORS.text,
  },
  primaryButton: {
    height: 56,
    marginTop: SPACE.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    color: COLORS.surface,
  },
  closeShiftButton: {
    height: TOUCH.standard,
    marginTop: SPACE.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeShiftButtonText: {
    fontSize: TYPE.body,
    color: COLORS.danger,
  },
})
