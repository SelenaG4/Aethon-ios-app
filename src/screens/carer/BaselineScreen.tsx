import React, { useCallback, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { ArrowLeft } from 'lucide-react-native'
import { AppText } from '../../components'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../../constants/theme'
import { updateResidentBaseline } from '../../lib/data'
import type { MobilityAid } from '../../lib/mockData'
import type { CarerStackParamList } from '../../navigation/CarerNavigator'

type BaselineRoute = RouteProp<CarerStackParamList, 'Baseline'>

const CONDITION_COUNT_OPTIONS = [0, 1, 2, 3, 4, 5] as const

const MOBILITY_OPTIONS: { value: MobilityAid; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'stick', label: 'Walking stick' },
  { value: 'frame', label: 'Walking frame' },
  { value: 'wheelchair', label: 'Wheelchair' },
]

function conditionCountLabel(value: number): string {
  return value >= 5 ? '5+' : `${value}`
}

export default function BaselineScreen() {
  const navigation = useNavigation<NavigationProp<CarerStackParamList>>()
  const route = useRoute<BaselineRoute>()
  const { clientId, clientName } = route.params

  const [age, setAge] = useState('')
  const [livesAlone, setLivesAlone] = useState<boolean | null>(null)
  const [conditionCount, setConditionCount] = useState<number | null>(null)
  const [mobilityAid, setMobilityAid] = useState<MobilityAid | null>(null)
  const [supportNote, setSupportNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const canSave =
    age.trim().length > 0 && livesAlone !== null && conditionCount !== null && mobilityAid !== null

  const onSave = useCallback(async () => {
    if (!canSave || livesAlone === null || conditionCount === null || mobilityAid === null) return
    setIsSaving(true)
    await updateResidentBaseline(clientId, {
      baseline_age: Number(age),
      baseline_lives_alone: livesAlone,
      baseline_condition_count: conditionCount,
      baseline_mobility_aid: mobilityAid,
      baseline_support_note: supportNote.trim(),
    })
    setIsSaving(false)
    navigation.navigate('ClientProfile', { clientId, clientName, savedBaseline: true })
  }, [canSave, age, livesAlone, conditionCount, mobilityAid, supportNote, clientId, clientName, navigation])

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
        <AppText weight="bold" style={styles.headerTitle} numberOfLines={1}>
          Baseline
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Age">
          <TextInput
            style={styles.ageInput}
            value={age}
            onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="Age"
            placeholderTextColor={COLORS.textMuted}
          />
        </Field>

        <Field label="Lives alone">
          <View style={styles.row}>
            <ChoiceButton
              label="Yes"
              selected={livesAlone === true}
              onPress={() => setLivesAlone(true)}
              style={styles.flexButton}
            />
            <ChoiceButton
              label="No"
              selected={livesAlone === false}
              onPress={() => setLivesAlone(false)}
              style={styles.flexButton}
            />
          </View>
        </Field>

        <Field label="Long-term conditions">
          <View style={styles.countRow}>
            {CONDITION_COUNT_OPTIONS.map((value) => (
              <Pressable
                key={value}
                onPress={() => setConditionCount(value)}
                style={[styles.countButton, conditionCount === value && styles.selectedButton]}
                accessibilityRole="button"
                accessibilityLabel={conditionCountLabel(value)}
              >
                <AppText
                  weight="bold"
                  style={[
                    styles.countButtonText,
                    conditionCount === value && styles.selectedButtonText,
                  ]}
                >
                  {conditionCountLabel(value)}
                </AppText>
              </Pressable>
            ))}
          </View>
        </Field>

        <Field label="Mobility aid">
          <View style={styles.stack}>
            {MOBILITY_OPTIONS.map((option) => (
              <ChoiceButton
                key={option.value}
                label={option.label}
                selected={mobilityAid === option.value}
                onPress={() => setMobilityAid(option.value)}
                style={styles.stackedButton}
              />
            ))}
          </View>
        </Field>

        <Field label="Support already in place">
          <TextInput
            style={styles.supportInput}
            value={supportNote}
            onChangeText={setSupportNote}
            placeholder="Family visits twice a week"
            placeholderTextColor={COLORS.textMuted}
            multiline
            textAlignVertical="top"
          />
        </Field>

        <Pressable
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={onSave}
          disabled={!canSave || isSaving}
          accessibilityRole="button"
          accessibilityLabel="Save"
        >
          <AppText weight="bold" style={styles.saveButtonText}>
            {isSaving ? 'Saving…' : 'Save'}
          </AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <AppText weight="bold" style={styles.fieldLabel}>
        {label}
      </AppText>
      {children}
    </View>
  )
}

function ChoiceButton({
  label,
  selected,
  onPress,
  style,
}: {
  label: string
  selected: boolean
  onPress: () => void
  style?: StyleProp<ViewStyle>
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.choiceButton, selected && styles.selectedButton, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <AppText weight="bold" style={[styles.choiceButtonText, selected && styles.selectedButtonText]}>
        {label}
      </AppText>
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
  headerTitle: {
    flex: 1,
    fontSize: TYPE.h2,
    color: COLORS.text,
  },
  content: {
    padding: 20,
    paddingBottom: SPACE.xl,
  },
  field: {
    marginBottom: SPACE.lg,
  },
  fieldLabel: {
    fontSize: TYPE.body,
    color: COLORS.text,
    marginBottom: SPACE.sm,
  },
  row: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  countRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
  stack: {
    gap: SPACE.sm,
  },
  ageInput: {
    height: 56,
    fontSize: 20,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
  },
  choiceButton: {
    minHeight: TOUCH.standard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexButton: {
    flex: 1,
    height: 56,
  },
  stackedButton: {
    height: 52,
    width: '100%',
  },
  choiceButtonText: {
    fontSize: TYPE.body,
    color: COLORS.text,
  },
  countButton: {
    width: TOUCH.standard,
    height: TOUCH.standard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countButtonText: {
    fontSize: TYPE.body,
    color: COLORS.text,
  },
  selectedButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  selectedButtonText: {
    color: COLORS.surface,
  },
  supportInput: {
    height: 80,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  saveButton: {
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACE.sm,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 18,
    color: COLORS.surface,
  },
})
