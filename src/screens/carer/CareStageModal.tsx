import React, { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RouteProp, useNavigation, useRoute, NavigationProp } from '@react-navigation/native'
import { ArrowLeft, X } from 'lucide-react-native'
import { AppText } from '../../components'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../../constants/theme'
import { recordCareStageChange } from '../../lib/data'
import type { CareStage } from '../../lib/mockData'
import type { CarerStackParamList } from '../../navigation/CarerNavigator'

type CareStageModalRoute = RouteProp<CarerStackParamList, 'CareStageModal'>

const STAGE_OPTIONS: { value: CareStage; label: string }[] = [
  { value: 'independent', label: 'Living independently' },
  { value: 'family_supported', label: 'Supported by family' },
  { value: 'professionally_supported', label: 'Professional care at home' },
  { value: 'residential', label: 'In a care facility' },
]

type Timing = 'this_month' | 'last_month' | 'two_to_three_months' | 'longer_ago'

const TIMING_OPTIONS: { value: Timing; label: string }[] = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'two_to_three_months', label: 'Two to three months ago' },
  { value: 'longer_ago', label: 'Longer ago' },
]

const DAY_MS = 24 * 60 * 60 * 1000
const AVERAGE_MONTH_DAYS = 30.44

// "Roughly when did this change?" only needs an approximate date, so months
// are converted to days using an average month length rather than exact
// calendar arithmetic (which breaks down for "two and a half months").
function estimatedSinceFor(timing: Timing): string {
  const monthsAgo: Record<Timing, number> = {
    this_month: 0,
    last_month: 1,
    two_to_three_months: 2.5,
    longer_ago: 6,
  }
  const date = new Date(Date.now() - monthsAgo[timing] * AVERAGE_MONTH_DAYS * DAY_MS)
  return date.toISOString()
}

type Step = 'stage' | 'timing' | 'note'

export default function CareStageModal() {
  const navigation = useNavigation<NavigationProp<CarerStackParamList>>()
  const route = useRoute<CareStageModalRoute>()
  const { clientId } = route.params

  const [step, setStep] = useState<Step>('stage')
  const [stage, setStage] = useState<CareStage | null>(null)
  const [timing, setTiming] = useState<Timing | null>(null)
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const onBack = useCallback(() => {
    if (step === 'timing') {
      setStep('stage')
    } else if (step === 'note') {
      setStep('timing')
    } else {
      navigation.goBack()
    }
  }, [step, navigation])

  const onChooseStage = useCallback((value: CareStage) => {
    setStage(value)
    setStep('timing')
  }, [])

  const onChooseTiming = useCallback((value: Timing) => {
    setTiming(value)
    setStep('note')
  }, [])

  const onSave = useCallback(async () => {
    if (!stage || !timing) return
    setIsSaving(true)
    await recordCareStageChange(clientId, {
      to_stage: stage,
      estimated_since: estimatedSinceFor(timing),
      note: note.trim() || null,
    })
    setIsSaving(false)
    navigation.goBack()
  }, [clientId, stage, timing, note, navigation])

  const question =
    step === 'stage'
      ? 'What is the situation now?'
      : step === 'timing'
        ? 'Roughly when did this change?'
        : 'What changed?'

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel={step === 'stage' ? 'Cancel' : 'Back'}
        >
          {step === 'stage' ? (
            <X size={22} color={COLORS.text} />
          ) : (
            <ArrowLeft size={22} color={COLORS.text} />
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText weight="bold" style={styles.question}>
          {question}
        </AppText>

        {step === 'stage' ? (
          <View style={styles.stack}>
            {STAGE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => onChooseStage(option.value)}
                style={styles.stageButton}
                accessibilityRole="button"
                accessibilityLabel={option.label}
              >
                <AppText weight="bold" style={styles.stageButtonText}>
                  {option.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : null}

        {step === 'timing' ? (
          <View style={styles.stack}>
            {TIMING_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => onChooseTiming(option.value)}
                style={styles.timingButton}
                accessibilityRole="button"
                accessibilityLabel={option.label}
              >
                <AppText weight="bold" style={styles.timingButtonText}>
                  {option.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : null}

        {step === 'note' ? (
          <View>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Optional"
              placeholderTextColor={COLORS.textMuted}
              multiline
              textAlignVertical="top"
            />
            <Pressable
              style={styles.saveButton}
              onPress={onSave}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="Save"
            >
              <AppText weight="bold" style={styles.saveButtonText}>
                {isSaving ? 'Saving…' : 'Save'}
              </AppText>
            </Pressable>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  closeButton: {
    width: TOUCH.standard,
    height: TOUCH.standard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: SPACE.xl,
  },
  question: {
    fontSize: TYPE.h2,
    color: COLORS.text,
    marginBottom: SPACE.lg,
  },
  stack: {
    gap: SPACE.sm,
  },
  stageButton: {
    height: 64,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageButtonText: {
    fontSize: TYPE.body,
    color: COLORS.text,
  },
  timingButton: {
    height: 56,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timingButtonText: {
    fontSize: TYPE.body,
    color: COLORS.text,
  },
  noteInput: {
    height: 80,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: SPACE.lg,
  },
  saveButton: {
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    color: COLORS.surface,
  },
})
