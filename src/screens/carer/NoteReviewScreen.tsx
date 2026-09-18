import React, { useCallback, useEffect, useState } from 'react'
import {
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { ArrowLeft, Check, ChevronDown, ChevronUp } from 'lucide-react-native'
import { AppText, ErrorView, LoadingView } from '../../components'
import { COLORS, SPACE, TOUCH } from '../../constants/theme'
import { confirmVisitNote, getResident, getVisitNote } from '../../lib/data'
import type { VisitNote } from '../../lib/mockData'
import type { CarerStackParamList } from '../../navigation/CarerNavigator'

type NoteReviewRoute = RouteProp<CarerStackParamList, 'NoteReview'>

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Every field here is optional and appears after the spoken note — a
// required field ahead of the recording would slow down the one action
// that must stay fast (docs/BUILD_GUIDE.txt, 5.4).
const VISIT_TYPE_OPTIONS = ['Medication', 'Personal care', 'Social visit', 'Health check']

const TASK_LABELS = [
  'Medication administered',
  'Meal supported',
  'Mobility assisted',
  'Personal care assisted',
  'Fluids encouraged',
]

// Worded as a reminder to ask, never as a statement about the person — see
// docs/BUILD_GUIDE.txt (6.3).
type PromptKey = 'hearing' | 'vision' | 'continence'

const PROMPT_ITEMS: { key: PromptKey; label: string }[] = [
  { key: 'hearing', label: 'Ask about hearing' },
  { key: 'vision', label: 'Ask about vision' },
  { key: 'continence', label: 'Ask about continence' },
]

function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`
}

function formatRecordedAt(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export default function NoteReviewScreen() {
  const navigation = useNavigation<NavigationProp<CarerStackParamList>>()
  const route = useRoute<NoteReviewRoute>()
  const { noteId } = route.params

  const [note, setNote] = useState<VisitNote | null>(null)
  const [clientName, setClientName] = useState('')
  const [text, setText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDetailExpanded, setIsDetailExpanded] = useState(false)
  const [visitType, setVisitType] = useState<string | null>(null)
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({})
  const [prompts, setPrompts] = useState<Record<PromptKey, boolean>>({
    hearing: false,
    vision: false,
    continence: false,
  })

  const [loadError, setLoadError] = useState(false)

  const load = useCallback(async () => {
    try {
      const loadedNote = await getVisitNote(noteId)
      if (!loadedNote) {
        setLoadError(true)
        return
      }
      setNote(loadedNote)
      setText(loadedNote.transcript ?? '')
      const resident = await getResident(loadedNote.resident_id)
      setClientName(resident ? `${resident.first_name} ${resident.last_name}` : '')
      setLoadError(false)
    } catch {
      setLoadError(true)
    }
  }, [noteId])

  useEffect(() => {
    load()
  }, [load])

  const toggleDetail = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setIsDetailExpanded((prev) => !prev)
  }, [])

  const onSelectVisitType = useCallback((option: string) => {
    setVisitType((prev) => (prev === option ? null : option))
  }, [])

  const onToggleTask = useCallback((label: string) => {
    setCheckedTasks((prev) => ({ ...prev, [label]: !prev[label] }))
  }, [])

  const onTogglePrompt = useCallback((key: PromptKey) => {
    setPrompts((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const onConfirm = useCallback(async () => {
    setIsSaving(true)
    const tasksCompleted = TASK_LABELS.filter((label) => checkedTasks[label]).join(', ')
    await confirmVisitNote(noteId, text, {
      visitType,
      tasksCompleted,
      askAboutHearing: prompts.hearing,
      askAboutVision: prompts.vision,
      askAboutContinence: prompts.continence,
    })
    setIsSaving(false)
    navigation.goBack()
  }, [noteId, text, visitType, checkedTasks, prompts, navigation])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color={COLORS.text} />
        </Pressable>
        <View style={styles.headerTitles}>
          <AppText weight="bold" style={styles.headerTitle} numberOfLines={1}>
            {clientName}
          </AppText>
          {note ? (
            <AppText style={styles.headerSubtitle}>{formatRecordedAt(note.created_at)}</AppText>
          ) : null}
        </View>
      </View>

      {note ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <AppText style={styles.reviewLabel}>Check and correct if needed</AppText>
          <TextInput
            style={styles.transcriptInput}
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
            placeholder="Type the note"
            placeholderTextColor={COLORS.textMuted}
          />

          <Pressable
            onPress={toggleDetail}
            style={styles.detailToggle}
            accessibilityRole="button"
            accessibilityLabel="Add detail, optional"
          >
            <AppText weight="bold" style={styles.detailToggleText}>
              Add detail (optional)
            </AppText>
            {isDetailExpanded ? (
              <ChevronUp size={20} color={COLORS.text} />
            ) : (
              <ChevronDown size={20} color={COLORS.text} />
            )}
          </Pressable>

          {isDetailExpanded ? (
            <View style={styles.detailSection}>
              <AppText weight="bold" style={styles.detailSectionLabel}>
                Visit type
              </AppText>
              <View style={styles.visitTypeGrid}>
                {VISIT_TYPE_OPTIONS.map((option) => {
                  const selected = visitType === option
                  return (
                    <Pressable
                      key={option}
                      onPress={() => onSelectVisitType(option)}
                      style={[styles.visitTypeButton, selected && styles.visitTypeButtonSelected]}
                      accessibilityRole="button"
                      accessibilityLabel={option}
                      accessibilityState={{ selected }}
                    >
                      <AppText
                        weight="bold"
                        style={[
                          styles.visitTypeButtonText,
                          selected && styles.visitTypeButtonTextSelected,
                        ]}
                      >
                        {option}
                      </AppText>
                    </Pressable>
                  )
                })}
              </View>

              <AppText weight="bold" style={styles.detailSectionLabel}>
                Tasks
              </AppText>
              {TASK_LABELS.map((label) => (
                <CheckboxRow
                  key={label}
                  label={label}
                  checked={!!checkedTasks[label]}
                  onPress={() => onToggleTask(label)}
                />
              ))}

              <AppText weight="bold" style={styles.detailSectionLabel}>
                Worth asking about next visit
              </AppText>
              <AppText style={styles.promptCaption}>
                Not an assessment. These are common, usually treatable, and rarely raised by the
                person themselves.
              </AppText>
              {PROMPT_ITEMS.map((item) => (
                <CheckboxRow
                  key={item.key}
                  label={item.label}
                  checked={prompts[item.key]}
                  onPress={() => onTogglePrompt(item.key)}
                />
              ))}
            </View>
          ) : null}

          <Pressable
            style={styles.confirmButton}
            onPress={onConfirm}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Confirm note"
          >
            <AppText weight="bold" style={styles.confirmButtonText}>
              {isSaving ? 'Saving…' : 'Confirm note'}
            </AppText>
          </Pressable>
        </ScrollView>
      ) : loadError ? (
        <ErrorView message="Could not load this note" onRetry={load} />
      ) : (
        <LoadingView />
      )}
    </SafeAreaView>
  )
}

function CheckboxRow({
  label,
  checked,
  onPress,
}: {
  label: string
  checked: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.taskRow}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <Check size={16} color={COLORS.surface} /> : null}
      </View>
      <AppText style={styles.taskLabel}>{label}</AppText>
    </Pressable>
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
    gap: SPACE.xs,
  },
  backButton: {
    width: TOUCH.standard,
    height: TOUCH.standard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    color: COLORS.text,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: SPACE.xl,
  },
  reviewLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: SPACE.sm,
  },
  transcriptInput: {
    minHeight: 200,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 17,
    lineHeight: 26,
    color: COLORS.text,
  },
  detailToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TOUCH.standard,
    marginTop: SPACE.sm,
  },
  detailToggleText: {
    fontSize: 16,
    color: COLORS.text,
  },
  detailSection: {
    marginTop: SPACE.xs,
  },
  detailSectionLabel: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: SPACE.sm,
    marginBottom: SPACE.sm,
  },
  promptCaption: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: SPACE.sm,
  },
  visitTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  visitTypeButton: {
    width: '48%',
    height: 64,
    margin: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitTypeButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  visitTypeButtonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  visitTypeButtonTextSelected: {
    color: COLORS.surface,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginBottom: 4,
    gap: SPACE.sm,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  taskLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  confirmButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACE.md,
  },
  confirmButtonText: {
    fontSize: 18,
    color: COLORS.surface,
  },
})
