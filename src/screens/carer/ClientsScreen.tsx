import React, { useCallback, useMemo, useState } from 'react'
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
import { useFocusEffect } from '@react-navigation/native'
import { ChevronRight, Search } from 'lucide-react-native'
import { AppText, Card, GradientAvatar, ScreenHeader } from '../../components'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../../constants/theme'
import { CURRENT_CARER, getResidentListEntries, ResidentListEntry } from '../../lib/data'

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
  const [entries, setEntries] = useState<ResidentListEntry[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    try {
      const result = await getResidentListEntries()
      setEntries(result)
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
        <ScreenHeader
          title={`${greeting()}, ${CURRENT_CARER.name.split(' ')[0]}`}
          subtitle={formatTodayLong()}
        />
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
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : loadState === 'error' ? (
        <View style={styles.centered}>
          <AppText weight="semibold" style={styles.errorText}>
            Could not load clients
          </AppText>
          <Pressable
            style={styles.retryButton}
            onPress={load}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <AppText weight="bold" style={styles.retryButtonText}>
              Try again
            </AppText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredEntries}
          keyExtractor={(entry) => entry.resident.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ItemSeparatorComponent={renderSeparator}
          ListEmptyComponent={
            <View style={styles.centered}>
              <AppText weight="semibold" style={styles.emptyText}>
                No clients found
              </AppText>
            </View>
          }
          renderItem={({ item }) => <ClientRow entry={item} />}
        />
      )}
    </SafeAreaView>
  )
}

function ClientRow({ entry }: { entry: ResidentListEntry }) {
  const { resident, lastNoteAt } = entry
  const fullName = `${resident.first_name} ${resident.last_name}`

  return (
    <Card style={styles.row}>
      <GradientAvatar name={fullName} size={44} />
      <View style={styles.rowCenter}>
        <AppText weight="bold" style={styles.rowName}>
          {fullName}
        </AppText>
        <AppText style={styles.rowSecondary}>
          {lastNoteAt ? formatLastNoteLabel(lastNoteAt) : 'No notes yet'}
        </AppText>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACE.xl,
  },
  errorText: {
    fontSize: TYPE.body,
    color: COLORS.textSecond,
    marginBottom: SPACE.md,
  },
  retryButton: {
    minHeight: TOUCH.standard,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: COLORS.surface,
    fontSize: TYPE.body,
  },
  emptyText: {
    fontSize: TYPE.body,
    color: COLORS.textMuted,
  },
})
