import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CompositeNavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { StackNavigationProp } from '@react-navigation/stack'
import { ChevronRight, Search, Users } from 'lucide-react-native'
import { AppText, Card, EmptyView, ErrorView, GradientAvatar, LoadingView, Logo, ScreenHeader } from '../../components'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../../constants/theme'
import {
  CURRENT_CARER,
  endShift,
  getCurrentShift,
  getEscalationsAwaitingOutcomeCount,
  getResidentListEntries,
  getUnreviewedVisitNotesCount,
  ResidentListEntry,
  startShift,
  subscribe,
} from '../../lib/data'
import type { Shift } from '../../lib/mockData'
import type { CarerStackParamList, CarerTabParamList } from '../../navigation/CarerNavigator'

type ClientsNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<CarerTabParamList, 'Clients'>,
  StackNavigationProp<CarerStackParamList>
>

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatTodayLong(): string {
  const now = new Date()
  return `${WEEKDAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`
}

function formatLastNoteLabel(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const dayDiff = Math.round((startOfToday - startOfDate) / 86400000)
  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
  if (dayDiff === 0) return `Last note: today ${time}`
  if (dayDiff === 1) return `Last note: yesterday ${time}`
  return `Last note: ${date.getDate()} ${MONTHS[date.getMonth()]}`
}

function renderSeparator() {
  return <View style={styles.separator} />
}

type LoadState = 'loading' | 'loaded' | 'error'

export default function ClientsScreen() {
  const navigation = useNavigation<ClientsNavigation>()
  const [entries, setEntries] = useState<ResidentListEntry[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [query, setQuery] = useState('')
  const [unreviewedCount, setUnreviewedCount] = useState(0)
  const [awaitingOutcomeCount, setAwaitingOutcomeCount] = useState(0)
  const [activeShift, setActiveShift] = useState<Shift | null>(null)

  const load = useCallback(async () => {
    try {
      const [result, count, outcomeCount, shift] = await Promise.all([
        getResidentListEntries(),
        getUnreviewedVisitNotesCount(),
        getEscalationsAwaitingOutcomeCount(),
        getCurrentShift(),
      ])
      setEntries(result)
      setUnreviewedCount(count)
      setAwaitingOutcomeCount(outcomeCount)
      setActiveShift(shift)
      setLoadState('loaded')
    } catch {
      setLoadState('error')
    }
  }, [])

  const onToggleShift = useCallback(async () => {
    if (activeShift) {
      await endShift(activeShift.id)
    } else {
      await startShift()
    }
  }, [activeShift])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  // A note's transcription can complete in the background while this list
  // is on screen (the carer never left it), so subscribe in addition to the
  // focus-driven refetch above.
  useEffect(() => subscribe(load), [load])

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await load()
    setIsRefreshing(false)
  }, [load])

  const filteredEntries = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return entries
    return entries.filter(({ resident }) =>
      `${resident.first_name} ${resident.last_name}`.toLowerCase().includes(needle)
    )
  }, [entries, query])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandRowLeft}>
            <Logo size={32} />
            <AppText weight="bold" style={styles.brandText}>
              Aethon
            </AppText>
          </View>
          <Pressable
            onPress={onToggleShift}
            style={[styles.shiftButton, activeShift ? styles.shiftButtonActive : styles.shiftButtonInactive]}
            accessibilityRole="button"
            accessibilityLabel={activeShift ? 'End shift' : 'Start shift'}
          >
            <AppText
              weight="bold"
              style={[styles.shiftButtonText, activeShift && styles.shiftButtonTextActive]}
            >
              {activeShift ? 'End shift' : 'Start shift'}
            </AppText>
          </Pressable>
        </View>
        <ScreenHeader
          title={`${greeting()}, ${CURRENT_CARER.name.split(' ')[0]}`}
          subtitle={formatTodayLong()}
        />
        {unreviewedCount > 0 ? (
          <Pressable
            onPress={() => navigation.navigate('ToCheck')}
            style={styles.toCheckLink}
            accessibilityRole="button"
            accessibilityLabel={`${unreviewedCount} ${unreviewedCount === 1 ? 'note' : 'notes'} to check`}
          >
            <View style={styles.amberDot} />
            <AppText weight="semibold" style={styles.toCheckLinkText}>
              {unreviewedCount} {unreviewedCount === 1 ? 'note' : 'notes'} to check
            </AppText>
          </Pressable>
        ) : null}
        {awaitingOutcomeCount > 0 ? (
          <Pressable
            onPress={() => navigation.navigate('ToCheck')}
            style={styles.outcomeLink}
            accessibilityRole="button"
            accessibilityLabel={`${awaitingOutcomeCount} ${awaitingOutcomeCount === 1 ? 'escalation' : 'escalations'} awaiting outcome`}
          >
            <AppText style={styles.outcomeLinkText}>
              {awaitingOutcomeCount} {awaitingOutcomeCount === 1 ? 'escalation' : 'escalations'} awaiting
              outcome
            </AppText>
          </Pressable>
        ) : null}
        <View style={styles.searchWrap}>
          <Search size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor={COLORS.textMuted}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      {loadState === 'loading' ? (
        <LoadingView />
      ) : loadState === 'error' ? (
        <ErrorView message="Could not load clients" onRetry={load} />
      ) : (
        <FlatList
          data={filteredEntries}
          keyExtractor={(entry) => entry.resident.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ItemSeparatorComponent={renderSeparator}
          ListEmptyComponent={<EmptyView icon={Users} message="No clients found" />}
          renderItem={({ item }) => (
            <ClientRow
              entry={item}
              onPress={() =>
                navigation.navigate('ClientProfile', {
                  clientId: item.resident.id,
                  clientName: `${item.resident.first_name} ${item.resident.last_name}`,
                })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  )
}

function ClientRow({ entry, onPress }: { entry: ResidentListEntry; onPress: () => void }) {
  const { resident, lastNoteAt, lastNoteStatus, lastNoteReviewedAt } = entry
  const fullName = `${resident.first_name} ${resident.last_name}`
  const needsChecking = lastNoteStatus === 'complete' && lastNoteReviewedAt === null

  return (
    <Card style={styles.row} onPress={onPress}>
      <GradientAvatar name={fullName} size={44} />
      <View style={styles.rowCenter}>
        <AppText weight="bold" style={styles.rowName}>
          {fullName}
        </AppText>
        {lastNoteStatus === 'pending' ? (
          <View style={styles.rowStatusRow}>
            <ActivityIndicator size="small" color={COLORS.textMuted} />
            <AppText style={styles.rowTranscribing}>Transcribing</AppText>
          </View>
        ) : lastNoteStatus === 'failed' ? (
          <AppText style={styles.rowFailed}>Transcription unavailable</AppText>
        ) : needsChecking ? (
          <View style={styles.rowStatusRow}>
            <View style={styles.amberDot} />
            <AppText weight="semibold" style={styles.rowFailed}>
              Needs checking
            </AppText>
          </View>
        ) : (
          <AppText style={styles.rowSecondary}>
            {lastNoteAt ? formatLastNoteLabel(lastNoteAt) : 'No notes yet'}
          </AppText>
        )}
      </View>
      <ChevronRight size={20} color={COLORS.textMuted} />
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACE.md,
  },
  brandRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  brandText: {
    fontSize: TYPE.h3,
    color: COLORS.text,
  },
  shiftButton: {
    minHeight: TOUCH.standard,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftButtonInactive: {
    backgroundColor: COLORS.primary,
  },
  shiftButtonActive: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  shiftButtonText: {
    fontSize: TYPE.small,
    color: COLORS.surface,
  },
  shiftButtonTextActive: {
    color: COLORS.danger,
  },
  toCheckLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: TOUCH.standard,
    marginBottom: SPACE.sm,
  },
  amberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.amber,
  },
  toCheckLinkText: {
    fontSize: TYPE.small,
    color: COLORS.amber,
  },
  outcomeLink: {
    justifyContent: 'center',
    minHeight: TOUCH.standard,
    marginBottom: SPACE.sm,
  },
  outcomeLinkText: {
    fontSize: TYPE.small,
    color: COLORS.textSecond,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TOUCH.standard,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    gap: SPACE.sm,
    marginBottom: SPACE.md,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPE.body,
    color: COLORS.text,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: SPACE.xl,
    flexGrow: 1,
  },
  separator: {
    height: SPACE.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
    gap: 14,
  },
  rowCenter: {
    flex: 1,
  },
  rowName: {
    fontSize: TYPE.h3,
    color: COLORS.text,
  },
  rowSecondary: {
    marginTop: 2,
    fontSize: TYPE.small,
    color: COLORS.textMuted,
  },
  rowStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  rowTranscribing: {
    fontSize: TYPE.small,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  rowFailed: {
    marginTop: 2,
    fontSize: TYPE.small,
    color: COLORS.amber,
  },
})
