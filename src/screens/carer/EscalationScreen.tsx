import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import Clipboard from '@react-native-clipboard/clipboard'
import { ArrowLeft } from 'lucide-react-native'
import { AppText } from '../../components'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../../constants/theme'
import { CURRENT_CARER, getVisitNotes, raisePhysicianEscalation } from '../../lib/data'
import { formatLongDate, formatShortDateTime, formatTime, translateVisitType, useTranslation } from '../../lib/i18n'
import type { VisitNote } from '../../lib/mockData'
import type { CarerStackParamList } from '../../navigation/CarerNavigator'

type EscalationRoute = RouteProp<CarerStackParamList, 'Escalation'>

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export default function EscalationScreen() {
  const navigation = useNavigation<NavigationProp<CarerStackParamList>>()
  const route = useRoute<EscalationRoute>()
  const { t, language } = useTranslation()
  const { clientId, clientName, physicianName, physicianEmail } = route.params

  const [recentNotes, setRecentNotes] = useState<VisitNote[]>([])
  const [reason, setReason] = useState('')
  const [showReasonError, setShowReasonError] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    getVisitNotes(clientId).then((notes) => {
      if (!cancelled) setRecentNotes(notes.slice(0, 3))
    })
    return () => {
      cancelled = true
    }
  }, [clientId])

  const buildSummary = useCallback(() => {
    const subject = t('escalation.emailSubject', { name: clientName })
    const body = [
      t('escalation.emailCarer', { name: CURRENT_CARER.name }),
      t('escalation.emailDate', {
        date: `${formatLongDate(new Date().toISOString(), language)}, ${formatTime(new Date().toISOString())}`,
      }),
      t('escalation.emailReason', { reason: reason.trim() }),
      '',
      t('escalation.emailRecentNotesHeading'),
      ...recentNotes.map((n) => `${formatShortDateTime(n.created_at, language)} - ${n.transcript ?? ''}`),
      '',
      t('escalation.emailFooterLine1'),
      t('escalation.emailFooterLine2'),
    ].join('\n')
    return { subject, body }
  }, [clientName, reason, recentNotes, t, language])

  // Escalation is recorded, not sent — delivery through either control is
  // never confirmed, only that the carer raised it.
  const finishAndReturn = useCallback(async () => {
    setIsSubmitting(true)
    await raisePhysicianEscalation({ residentId: clientId, reason: reason.trim() })
    navigation.navigate('ClientProfile', { clientId, clientName, savedEscalation: true })
  }, [clientId, clientName, reason, navigation])

  const onOpenEmail = useCallback(() => {
    if (isSubmittingRef.current) return
    if (!reason.trim()) {
      setShowReasonError(true)
      return
    }
    isSubmittingRef.current = true
    setShowReasonError(false)
    const { subject, body } = buildSummary()
    const url = `mailto:${physicianEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    Linking.openURL(url).catch(() => {
      // Never assume an email account exists on the device — "Copy summary"
      // is the fallback, so a failed mailto here isn't treated as an error.
    })
    finishAndReturn()
  }, [reason, buildSummary, physicianEmail, finishAndReturn])

  const onCopySummary = useCallback(() => {
    if (isSubmittingRef.current) return
    if (!reason.trim()) {
      setShowReasonError(true)
      return
    }
    isSubmittingRef.current = true
    setShowReasonError(false)
    const { body } = buildSummary()
    Clipboard.setString(body)
    setIsCopied(true)
    setTimeout(() => {
      setIsCopied(false)
      finishAndReturn()
    }, 2000)
  }, [reason, buildSummary, finishAndReturn])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <ArrowLeft size={22} color={COLORS.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerCard}>
          <AppText weight="black" style={styles.headerCardTitle}>
            {t('escalation.title')}
          </AppText>
          <AppText weight="semibold" style={styles.headerCardClient}>
            {clientName}
          </AppText>
          <AppText style={styles.headerCardPhysician}>{t('escalation.to', { name: physicianName })}</AppText>
        </View>

        <AppText weight="bold" style={styles.sectionLabel}>
          {t('escalation.recentNotes')}
        </AppText>
        {recentNotes.length === 0 ? (
          <AppText style={styles.emptyNote}>{t('escalation.noRecentNotes')}</AppText>
        ) : (
          recentNotes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <AppText weight="semibold" style={styles.noteCardMeta}>
                {formatShortDateTime(note.created_at, language)}
                {note.visit_type ? ` · ${translateVisitType(note.visit_type, t)}` : ''}
              </AppText>
              <AppText style={styles.noteCardTranscript}>
                {note.transcript ? truncate(note.transcript, 120) : t('escalation.noTranscriptYet')}
              </AppText>
            </View>
          ))
        )}

        <AppText weight="bold" style={[styles.sectionLabel, styles.reasonSpacing]}>
          {t('escalation.reason')}
        </AppText>
        <TextInput
          style={styles.reasonInput}
          value={reason}
          onChangeText={(value) => {
            setReason(value)
            if (value.trim()) setShowReasonError(false)
          }}
          multiline
          textAlignVertical="top"
          placeholder={t('escalation.reasonPlaceholder')}
          placeholderTextColor={COLORS.textMuted}
        />
        {showReasonError ? (
          <AppText weight="semibold" style={styles.reasonError}>
            {t('escalation.reasonRequired')}
          </AppText>
        ) : null}

        <Pressable
          style={styles.emailButton}
          onPress={onOpenEmail}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel={t('escalation.openEmail')}
        >
          <AppText weight="bold" style={styles.emailButtonText}>
            {t('escalation.openEmail')}
          </AppText>
        </Pressable>

        <Pressable
          style={styles.copyButton}
          onPress={onCopySummary}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel={t('escalation.copySummary')}
        >
          <AppText weight="bold" style={styles.copyButtonText}>
            {isCopied ? t('escalation.copied') : t('escalation.copySummary')}
          </AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  backButton: {
    width: TOUCH.standard,
    height: TOUCH.standard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: SPACE.xl,
  },
  headerCard: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
    padding: 18,
    marginBottom: SPACE.lg,
  },
  headerCardTitle: {
    fontSize: 20,
    color: COLORS.danger,
  },
  headerCardClient: {
    marginTop: SPACE.xs,
    fontSize: TYPE.body,
    color: COLORS.text,
  },
  headerCardPhysician: {
    marginTop: 2,
    fontSize: TYPE.small,
    color: COLORS.textSecond,
  },
  sectionLabel: {
    fontSize: TYPE.body,
    color: COLORS.text,
    marginBottom: SPACE.sm,
  },
  reasonSpacing: {
    marginTop: SPACE.lg,
  },
  emptyNote: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  noteCard: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: SPACE.sm,
  },
  noteCardMeta: {
    fontSize: TYPE.small,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  noteCardTranscript: {
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.text,
  },
  reasonInput: {
    height: 110,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  reasonError: {
    marginTop: SPACE.xs,
    fontSize: TYPE.small,
    color: COLORS.danger,
  },
  emailButton: {
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACE.lg,
  },
  emailButtonText: {
    fontSize: 18,
    color: COLORS.surface,
  },
  copyButton: {
    height: 56,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACE.sm,
  },
  copyButtonText: {
    fontSize: 18,
    color: COLORS.text,
  },
})
