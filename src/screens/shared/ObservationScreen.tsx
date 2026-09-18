import React, { useCallback, useRef, useState } from 'react'
import { Animated, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Angry, ArrowLeft, Check, Frown, Laugh, Meh, Smile, Star } from 'lucide-react-native'
import { AppText } from '../../components'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../../constants/theme'
import { addHealthLog, CURRENT_CARER } from '../../lib/data'
import { painBandColor } from '../../lib/observations'
import type { CarerStackParamList } from '../../navigation/CarerNavigator'

type ObservationRoute = RouteProp<CarerStackParamList, 'Observation'>

const MOOD_OPTIONS = [
  { value: 1, Icon: Angry },
  { value: 2, Icon: Frown },
  { value: 3, Icon: Meh },
  { value: 4, Icon: Smile },
  { value: 5, Icon: Laugh },
]

const SLEEP_VALUES = [1, 2, 3, 4, 5]
const PAIN_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export default function ObservationScreen() {
  const navigation = useNavigation<NavigationProp<CarerStackParamList>>()
  const route = useRoute<ObservationRoute>()
  const { clientId, clientName, mode } = route.params
  const isResident = mode === 'resident'

  const [mood, setMood] = useState<number | null>(null)
  const [sleep, setSleep] = useState<number | null>(null)
  const [pain, setPain] = useState<number | null>(null)
  const [weightInput, setWeightInput] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [rowWidth, setRowWidth] = useState(0)

  const moodScales = useRef(MOOD_OPTIONS.map(() => new Animated.Value(1))).current

  const onSelectMood = useCallback(
    (value: number) => {
      setMood(value)
      moodScales.forEach((scale, index) => {
        Animated.spring(scale, {
          toValue: MOOD_OPTIONS[index].value === value ? 1.15 : 1,
          friction: 5,
          useNativeDriver: true,
        }).start()
      })
    },
    [moodScales]
  )

  const onSave = useCallback(async () => {
    setIsSaving(true)
    await addHealthLog({
      resident_id: clientId,
      logged_by: CURRENT_CARER.name,
      mood,
      sleep,
      pain,
      weight_kg: weightInput.trim() ? Number(weightInput) : null,
      notes: notes.trim() || null,
    })
    setIsSaving(false)
    setIsSaved(true)
    setTimeout(() => navigation.goBack(), 2000)
  }, [clientId, mood, sleep, pain, weightInput, notes, navigation])

  const moodButtonSize = isResident ? TOUCH.resident : 56
  const starTouchSize = isResident ? TOUCH.resident : 56
  const painSegmentHeight = isResident ? TOUCH.resident : 56
  const starIconSize = isResident ? 40 : 28
  const labelFontSize = isResident ? TYPE.residentBody : TYPE.body
  const noPainFontSize = isResident ? TYPE.residentBody : 18
  const notesInputHeight = isResident ? 120 : 90
  const notesFontSize = isResident ? TYPE.residentBody : 16
  const saveButtonHeight = isResident ? TOUCH.resident : 56
  const saveButtonFontSize = isResident ? TYPE.residentBody : 18

  const segmentWidth = rowWidth > 0 ? rowWidth / PAIN_VALUES.length : 0

  if (isSaved) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.savedCentered}>
          <View style={styles.savedCircle}>
            <Check size={40} color={COLORS.surface} />
          </View>
          <AppText weight="bold" style={styles.savedText}>
            Observation saved
          </AppText>
        </View>
      </SafeAreaView>
    )
  }

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
          {clientName}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText weight="bold" style={[styles.label, { fontSize: labelFontSize }]}>
          {isResident ? 'How are you feeling today?' : 'Mood'}
        </AppText>
        <View style={styles.moodRow}>
          {MOOD_OPTIONS.map((option, index) => {
            const selected = mood === option.value
            return (
              <Pressable
                key={option.value}
                onPress={() => onSelectMood(option.value)}
                accessibilityRole="button"
                accessibilityLabel={`Mood ${option.value} of 5`}
                accessibilityState={{ selected }}
              >
                <Animated.View
                  style={[
                    styles.moodButton,
                    {
                      width: moodButtonSize,
                      height: moodButtonSize,
                      borderRadius: moodButtonSize / 2,
                      transform: [{ scale: moodScales[index] }],
                    },
                    selected && styles.moodButtonSelected,
                  ]}
                >
                  <option.Icon
                    size={moodButtonSize * 0.5}
                    color={selected ? COLORS.primary : COLORS.textMuted}
                  />
                </Animated.View>
              </Pressable>
            )
          })}
        </View>

        <AppText weight="bold" style={[styles.label, styles.sectionSpacing, { fontSize: labelFontSize }]}>
          {isResident ? 'How did you sleep?' : 'Sleep quality'}
        </AppText>
        <View style={styles.starsRow}>
          {SLEEP_VALUES.map((value) => {
            const filled = sleep !== null && value <= sleep
            return (
              <Pressable
                key={value}
                onPress={() => setSleep(value)}
                style={[styles.starTouch, { width: starTouchSize, height: starTouchSize }]}
                accessibilityRole="button"
                accessibilityLabel={`Sleep quality ${value} of 5`}
              >
                <Star
                  size={starIconSize}
                  color={COLORS.amber}
                  fill={filled ? COLORS.amber : 'transparent'}
                />
              </Pressable>
            )
          })}
        </View>

        <AppText weight="bold" style={[styles.label, styles.sectionSpacing, { fontSize: labelFontSize }]}>
          Any pain today?
        </AppText>
        {pain !== null ? (
          <AppText weight="black" style={[styles.painValue, { color: painBandColor(pain) }]}>
            {pain}
          </AppText>
        ) : null}
        {pain === 0 ? (
          <AppText weight="semibold" style={[styles.noPainText, { fontSize: noPainFontSize }]}>
            No pain today
          </AppText>
        ) : null}
        <View style={styles.painRow} onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}>
          {PAIN_VALUES.map((value) => {
            const selected = pain === value
            const segmentStyle = {
              width: segmentWidth > 0 ? segmentWidth - 2 : undefined,
              flex: segmentWidth > 0 ? undefined : 1,
              height: painSegmentHeight,
              backgroundColor: painBandColor(value),
              opacity: selected ? 1 : 0.35,
            }
            return (
              <Pressable
                key={value}
                onPress={() => setPain(value)}
                disabled={segmentWidth === 0}
                style={[styles.painSegment, segmentStyle]}
                accessibilityRole="button"
                accessibilityLabel={`Pain ${value} of 10`}
                accessibilityState={{ selected }}
              />
            )
          })}
        </View>

        {!isResident ? (
          <>
            <AppText weight="bold" style={[styles.label, styles.sectionSpacing, { fontSize: labelFontSize }]}>
              Weight
            </AppText>
            <View style={styles.weightRow}>
              <TextInput
                style={styles.weightInput}
                value={weightInput}
                onChangeText={(t) => setWeightInput(t.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
              />
              <AppText weight="semibold" style={styles.weightSuffix}>
                kg
              </AppText>
            </View>
          </>
        ) : null}

        <AppText weight="bold" style={[styles.label, styles.sectionSpacing, { fontSize: labelFontSize }]}>
          {isResident ? 'Anything else?' : 'Observations'}
        </AppText>
        <TextInput
          style={[
            styles.notesInput,
            { height: notesInputHeight, fontSize: notesFontSize },
          ]}
          value={notes}
          onChangeText={setNotes}
          multiline
          textAlignVertical="top"
          placeholderTextColor={COLORS.textMuted}
        />

        <Pressable
          style={[styles.saveButton, { height: saveButtonHeight }]}
          onPress={onSave}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="Save"
        >
          <AppText weight="bold" style={[styles.saveButtonText, { fontSize: saveButtonFontSize }]}>
            {isSaving ? 'Saving…' : 'Save'}
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
  label: {
    color: COLORS.text,
    marginBottom: SPACE.sm,
  },
  sectionSpacing: {
    marginTop: SPACE.lg,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },
  moodButtonSelected: {
    borderWidth: 3,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  starsRow: {
    flexDirection: 'row',
  },
  starTouch: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  painValue: {
    fontSize: 34,
    marginBottom: 2,
  },
  noPainText: {
    color: COLORS.primary,
    marginBottom: SPACE.sm,
  },
  painRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  painSegment: {
    borderRadius: 6,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  weightInput: {
    flex: 1,
    height: 56,
    fontSize: 20,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
  },
  weightSuffix: {
    fontSize: 17,
    color: COLORS.textSecond,
  },
  notesInput: {
    color: COLORS.text,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 16,
  },
  saveButton: {
    marginTop: SPACE.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: COLORS.surface,
  },
  savedCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE.lg,
  },
  savedText: {
    fontSize: TYPE.h2,
    color: COLORS.text,
  },
})
