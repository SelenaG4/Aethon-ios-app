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
import { COLORS, SPACE, TOUCH, TYPE } from '../../constants/theme'
import { confirmVisitNote, getResident, getVisitNote } from '../../lib/data'
import { formatShortDateTime, TASK_OPTIONS, TranslationKey, useTranslation, VISIT_TYPE_OPTIONS } from '../../lib/i18n'
import type { VisitNote } from '../../lib/mockData'
import type { CarerStackParamList } from '../../navigation/CarerNavigator'

type NoteReviewRoute = RouteProp<CarerStackParamList, 'NoteReview'>

// Worded as a reminder to ask, never as a statement about the person — see
// docs/BUILD_GUIDE.txt (6.3).
type PromptKey = 'hearing' | 'vision' | 'continence'

const PROMPT_ITEMS: { key: PromptKey; labelKey: TranslationKey }[] = [
  { key: 'hearing', labelKey: 'noteReview.askAboutHearing' },
  { key: 'vision', labelKey: 'noteReview.askAboutVision' },
  { key: 'continence', labelKey: 'noteReview.askAboutContinence' },
]

export default function NoteReviewScreen() {
  const navigation = useNavigation<NavigationProp<CarerStackParamList>>()
  const route = useRoute<NoteReviewRoute>()
  const { t, language } = useTranslation()
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
    const tasksCompleted = TASK_OPTIONS.filter((option) => checkedTasks[option.value])
      .map((option) => option.value)
      .join(', ')
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
          accessibilityLabel={t('common.back')}
        >
          <ArrowLeft size={22} color={COLORS.text} />
        </Pressable>
        <View style={styles.headerTitles}>
          <AppText weight="bold" style={styles.headerTitle} numberOfLines={1}>
            {clientName}
          </AppText>
          {note ? (
            <AppText style={styles.headerSubtitle}>{formatShortDateTime(note.created_at, language)}</AppText>
          ) : null}
        </View>
      </View>

      {note ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <AppText style={styles.reviewLabel}>{t('noteReview.reviewLabel')}</AppText>
          <TextInput
            style={styles.transcriptInput}
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
            placeholder={t('noteReview.transcriptPlaceholder')}
            placeholderTextColor={COLORS.textMuted}
          />

          <Pressable
            onPress={toggleDetail}
            style={styles.detailToggle}
            accessibilityRole="button"
            accessibilityLabel={t('noteReview.addDetail')}
          >
            <AppText weight="bold" style={styles.detailToggleText}>
              {t('noteReview.addDetail')}
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
                {t('noteReview.visitType')}
              </AppText>
              <View style={styles.visitTypeGrid}>
                {VISIT_TYPE_OPTIONS.map((option) => {
                  const selected = visitType === option.value
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => onSelectVisitType(option.value)}
                      style={[styles.visitTypeButton, selected && styles.visitTypeButtonSelected]}
                      accessibilityRole="button"
                      accessibilityLabel={t(option.labelKey)}
                      accessibilityState={{ selected }}
                    >
                      <AppText
                        weight="bold"
                        style={[
                          styles.visitTypeButtonText,
                          selected && styles.visitTypeButtonTextSelected,
                        ]}
                      >
                        {t(option.labelKey)}
                      </AppText>
                    </Pressable>
                  )
                })}
              </View>

              <AppText weight="bold" style={styles.detailSectionLabel}>
                {t('noteReview.tasks')}
              </AppText>
              {TASK_OPTIONS.map((option) => (
                <CheckboxRow
                  key={option.value}
                  label={t(option.labelKey)}
                  checked={!!checkedTasks[option.value]}
                  onPress={() => onToggleTask(option.value)}
                />
              ))}

              <AppText weight="bold" style={styles.detailSectionLabel}>
                {t('noteReview.worthAsking')}
              </AppText>
              <AppText style={styles.promptCaption}>{t('noteReview.worthAskingCaption')}</AppText>
              {PROMPT_ITEMS.map((item) => (
                <CheckboxRow
                  key={item.key}
                  label={t(item.labelKey)}
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
            accessibilityLabel={t('noteReview.confirmNote')}
          >
            <AppText weight="bold" style={styles.confirmButtonText}>
              {isSaving ? t('common.saving') : t('noteReview.confirmNote')}
            </AppText>
          </Pressable>
        </ScrollView>
      ) : loadError ? (
        <ErrorView message={t('noteReview.loadError')} onRetry={load} />
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
    fontSize: TYPE.small,
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
    fontSize: TYPE.small,
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
    fontSize: TYPE.small,
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
