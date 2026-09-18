import React, { useCallback, useEffect, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native'
import { CircleCheck } from 'lucide-react-native'
import { AppText, Card, EmptyView, ErrorView, LoadingView, ScreenHeader } from '../../components'
import { COLORS, SPACE, TYPE } from '../../constants/theme'
import {
  EscalationAwaitingOutcomeEntry,
  getEscalationsAwaitingOutcome,
  getUnreviewedVisitNotes,
  subscribe,
  UnreviewedVisitNoteEntry,
} from '../../lib/data'
import { formatShortDateTime, useTranslation } from '../../lib/i18n'
import type { CarerStackParamList } from '../../navigation/CarerNavigator'

export default function ToCheckScreen() {
  const navigation = useNavigation<NavigationProp<CarerStackParamList>>()
  const { t } = useTranslation()
  const [noteEntries, setNoteEntries] = useState<UnreviewedVisitNoteEntry[]>([])
  const [escalationEntries, setEscalationEntries] = useState<EscalationAwaitingOutcomeEntry[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const [notes, escalations] = await Promise.all([
        getUnreviewedVisitNotes(),
        getEscalationsAwaitingOutcome(),
      ])
      setNoteEntries(notes)
      setEscalationEntries(escalations)
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

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await load()
    setIsRefreshing(false)
  }, [load])

  const isEmpty = noteEntries.length === 0 && escalationEntries.length === 0

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <ScreenHeader title={t('toCheck.title')} subtitle={t('toCheck.subtitle')} />
      </View>

      {loadState === 'loading' ? (
        <LoadingView />
      ) : loadState === 'error' ? (
        <ErrorView message={t('toCheck.loadError')} onRetry={load} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          {isEmpty ? (
            <EmptyView icon={CircleCheck} message={t('toCheck.nothingToCheck')} />
          ) : (
            <>
              {escalationEntries.length > 0 ? (
                <>
                  <AppText weight="bold" style={styles.sectionLabel}>
                    {t('toCheck.escalationsAwaitingOutcome')}
                  </AppText>
                  {escalationEntries.map((entry) => (
                    <EscalationToCheckRow
                      key={entry.escalation.id}
                      entry={entry}
                      onPress={() =>
                        navigation.navigate('ClientProfile', {
                          clientId: entry.residentId,
                          clientName: entry.residentName,
                          initialTab: 'notes',
                        })
                      }
                    />
                  ))}
                </>
              ) : null}

              {noteEntries.length > 0 ? (
                <>
                  <AppText weight="bold" style={[styles.sectionLabel, styles.sectionSpacing]}>
                    {t('toCheck.notesWaiting')}
                  </AppText>
                  {noteEntries.map((entry) => (
                    <NoteToCheckRow
                      key={entry.note.id}
                      entry={entry}
                      onPress={() => navigation.navigate('NoteReview', { noteId: entry.note.id })}
                    />
                  ))}
                </>
              ) : null}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function EscalationToCheckRow({
  entry,
  onPress,
}: {
  entry: EscalationAwaitingOutcomeEntry
  onPress: () => void
}) {
  const { language } = useTranslation()
  const { escalation, residentName } = entry
  return (
    <Card style={[styles.row, styles.rowSpacing]} onPress={onPress}>
      <View style={styles.rowHeader}>
        <AppText weight="bold" style={styles.rowName}>
          {residentName}
        </AppText>
        <AppText style={styles.rowMeta}>{formatShortDateTime(escalation.created_at, language)}</AppText>
      </View>
      <AppText style={styles.rowTranscript} numberOfLines={2}>
        {escalation.reason}
      </AppText>
    </Card>
  )
}

function NoteToCheckRow({ entry, onPress }: { entry: UnreviewedVisitNoteEntry; onPress: () => void }) {
  const { t, language } = useTranslation()
  const { note, residentName } = entry
  const isFailed = note.transcription_status === 'failed'

  return (
    <Card style={[styles.row, styles.rowSpacing]} onPress={onPress}>
      <View style={styles.rowHeader}>
        <AppText weight="bold" style={styles.rowName}>
          {residentName}
        </AppText>
        <AppText style={styles.rowMeta}>{formatShortDateTime(note.created_at, language)}</AppText>
      </View>
      {isFailed ? (
        <AppText style={styles.rowFailed}>{t('toCheck.transcriptionUnavailable')}</AppText>
      ) : (
        <>
          <View style={styles.needsCheckingRow}>
            <View style={styles.amberDot} />
            <AppText weight="semibold" style={styles.needsCheckingText}>
              {t('toCheck.needsChecking')}
            </AppText>
          </View>
          <AppText style={styles.rowTranscript} numberOfLines={2}>
            {note.transcript}
          </AppText>
        </>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: SPACE.xl,
    flexGrow: 1,
  },
  sectionLabel: {
    fontSize: TYPE.body,
    color: COLORS.text,
    marginBottom: SPACE.sm,
  },
  sectionSpacing: {
    marginTop: SPACE.lg,
  },
  row: {
    gap: 4,
  },
  rowSpacing: {
    marginBottom: SPACE.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowName: {
    fontSize: TYPE.h3,
    color: COLORS.text,
  },
  rowMeta: {
    fontSize: TYPE.small,
    color: COLORS.textMuted,
  },
  needsCheckingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  amberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.amber,
  },
  needsCheckingText: {
    fontSize: TYPE.small,
    color: COLORS.amber,
  },
  rowTranscript: {
    marginTop: 4,
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.textSecond,
  },
  rowFailed: {
    marginTop: 2,
    fontSize: 16,
    color: COLORS.amber,
  },
})
