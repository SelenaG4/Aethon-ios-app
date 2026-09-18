import React, { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import notifee, { AuthorizationStatus } from '@notifee/react-native'
import { Bell, Check } from 'lucide-react-native'
import { AppText, Logo } from '../../components'
import { EMERGENCY_NUMBER } from '../../constants/config'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../../constants/theme'
import {
  setOnboardingComplete,
  setResidentWantsReminders,
  updateResidentGoals,
  updateResidentName,
} from '../../lib/data'
import type { Resident } from '../../lib/mockData'

type Props = {
  resident: Resident
  onComplete: () => void
}

type GoalDraft = {
  text: string
  family_visible: boolean
}

const GOAL_PLACEHOLDERS = [
  'Cook my own dinner',
  'Get to the market on Thursdays',
  'Look after my own tablets',
]

const EMPTY_GOAL_DRAFTS: GoalDraft[] = GOAL_PLACEHOLDERS.map(() => ({
  text: '',
  family_visible: false,
}))

const STEP_COUNT = 6

export default function ResidentOnboarding({ resident, onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState(resident.first_name)
  const [goalDrafts, setGoalDrafts] = useState<GoalDraft[]>(EMPTY_GOAL_DRAFTS)

  const goNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, STEP_COUNT))
  }, [])

  const onSaveName = useCallback(async () => {
    await updateResidentName(resident.id, name.trim() || resident.first_name)
    goNext()
  }, [resident.id, resident.first_name, name, goNext])

  const onWantReminders = useCallback(async () => {
    try {
      const settings = await notifee.requestPermission()
      const granted =
        settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
        settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
      await setResidentWantsReminders(resident.id, granted)
    } catch {
      // A failed permission request shouldn't block onboarding — the
      // resident can still be asked again later (10.4).
    }
    goNext()
  }, [resident.id, goNext])

  const onNotNow = useCallback(async () => {
    await setResidentWantsReminders(resident.id, false)
    goNext()
  }, [resident.id, goNext])

  const onSaveGoals = useCallback(async () => {
    const nonEmpty = goalDrafts
      .map((g) => ({ text: g.text.trim(), family_visible: g.family_visible }))
      .filter((g) => g.text.length > 0)
    await updateResidentGoals(resident.id, nonEmpty)
    goNext()
  }, [resident.id, goalDrafts, goNext])

  const onFinish = useCallback(async () => {
    await setOnboardingComplete()
    onComplete()
  }, [onComplete])

  const isColoredStep = step === 1 || step === STEP_COUNT

  return (
    <SafeAreaView
      style={[styles.container, isColoredStep && styles.containerPrimary]}
      edges={['top', 'bottom']}
    >
      <View style={styles.topRow}>
        <ProgressDots step={step} inverted={isColoredStep} />
        {step !== STEP_COUNT ? (
          <Pressable
            onPress={goNext}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel="Skip"
          >
            <AppText
              weight="semibold"
              style={[styles.skipText, isColoredStep && styles.skipTextInverted]}
            >
              Skip
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {step === 1 ? <WelcomeStep onGetStarted={goNext} /> : null}
      {step === 2 ? <NameStep name={name} onChangeName={setName} onSave={onSaveName} /> : null}
      {step === 3 ? <RemindersStep onYes={onWantReminders} onNotNow={onNotNow} /> : null}
      {step === 4 ? <ContactsStep resident={resident} onConfirm={goNext} /> : null}
      {step === 5 ? (
        <GoalsStep goals={goalDrafts} onChangeGoals={setGoalDrafts} onSave={onSaveGoals} />
      ) : null}
      {step === STEP_COUNT ? <DoneStep onOpen={onFinish} /> : null}
    </SafeAreaView>
  )
}

function ProgressDots({ step, inverted }: { step: number; inverted: boolean }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: STEP_COUNT }).map((_, index) => {
        const filled = index < step
        const color = filled
          ? inverted
            ? COLORS.surface
            : COLORS.primary
          : inverted
            ? 'rgba(255,255,255,0.35)'
            : COLORS.border
        return <View key={index} style={[styles.dot, { backgroundColor: color }]} />
      })}
    </View>
  )
}

function WelcomeStep({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <View style={styles.centeredStep}>
      <Logo size={110} />
      <AppText weight="black" style={styles.welcomeTitle}>
        AETHON
      </AppText>
      <AppText weight="semibold" style={styles.welcomeSubtitle}>
        Welcome
      </AppText>
      <Pressable
        style={styles.lightButton}
        onPress={onGetStarted}
        accessibilityRole="button"
        accessibilityLabel="Get started"
      >
        <AppText weight="bold" style={styles.lightButtonText}>
          Get started
        </AppText>
      </Pressable>
    </View>
  )
}

function NameStep({
  name,
  onChangeName,
  onSave,
}: {
  name: string
  onChangeName: (value: string) => void
  onSave: () => void
}) {
  return (
    <View style={styles.centeredStep}>
      <AppText weight="bold" style={styles.stepTitle}>
        What is your name?
      </AppText>
      <TextInput
        style={styles.nameInput}
        value={name}
        onChangeText={onChangeName}
        textAlign="center"
        placeholder="Your name"
        placeholderTextColor={COLORS.textMuted}
      />
      <Pressable
        style={styles.primaryButton}
        onPress={onSave}
        accessibilityRole="button"
        accessibilityLabel="That is my name"
      >
        <AppText weight="bold" style={styles.primaryButtonText}>
          That is my name
        </AppText>
      </Pressable>
    </View>
  )
}

function RemindersStep({ onYes, onNotNow }: { onYes: () => void; onNotNow: () => void }) {
  return (
    <View style={styles.centeredStep}>
      <Bell size={76} color={COLORS.primary} />
      <AppText weight="bold" style={[styles.stepTitle, styles.reminderSpacing]}>
        Shall we remind you about your medication?
      </AppText>
      <AppText style={styles.stepBody}>A gentle reminder at the right time each day.</AppText>
      <Pressable
        style={styles.primaryButton}
        onPress={onYes}
        accessibilityRole="button"
        accessibilityLabel="Yes, remind me"
      >
        <AppText weight="bold" style={styles.primaryButtonText}>
          Yes, remind me
        </AppText>
      </Pressable>
      <Pressable
        style={styles.outlinedButton}
        onPress={onNotNow}
        accessibilityRole="button"
        accessibilityLabel="Not now"
      >
        <AppText weight="bold" style={styles.outlinedButtonText}>
          Not now
        </AppText>
      </Pressable>
    </View>
  )
}

function ContactsStep({ resident, onConfirm }: { resident: Resident; onConfirm: () => void }) {
  const contacts = [...resident.emergency_contacts].sort((a, b) => a.priority - b.priority)

  return (
    <ScrollView contentContainerStyle={styles.scrollStep} keyboardShouldPersistTaps="handled">
      <AppText weight="bold" style={styles.stepTitleLeft}>
        Who should we contact if you need help?
      </AppText>
      {contacts.map((contact) => (
        <View key={contact.name} style={styles.contactCard}>
          <AppText weight="bold" style={styles.contactName}>
            {contact.name}
          </AppText>
          <AppText style={styles.contactDetail}>{contact.relationship}</AppText>
          <AppText style={styles.contactDetail}>{contact.phone}</AppText>
        </View>
      ))}
      <AppText style={styles.stepBodyLeft}>If you use the assistance button, we contact them.</AppText>
      <AppText style={styles.smallPrint}>
        This is not an emergency service. In a medical emergency call {EMERGENCY_NUMBER}.
      </AppText>
      <Pressable
        style={styles.primaryButton}
        onPress={onConfirm}
        accessibilityRole="button"
        accessibilityLabel="These are correct"
      >
        <AppText weight="bold" style={styles.primaryButtonText}>
          These are correct
        </AppText>
      </Pressable>
    </ScrollView>
  )
}

function GoalsStep({
  goals,
  onChangeGoals,
  onSave,
}: {
  goals: GoalDraft[]
  onChangeGoals: (goals: GoalDraft[]) => void
  onSave: () => void
}) {
  const updateText = (index: number, text: string) => {
    onChangeGoals(goals.map((g, i) => (i === index ? { ...g, text } : g)))
  }

  const toggleVisible = (index: number) => {
    onChangeGoals(goals.map((g, i) => (i === index ? { ...g, family_visible: !g.family_visible } : g)))
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollStep} keyboardShouldPersistTaps="handled">
      <AppText weight="bold" style={styles.stepTitleLeft}>
        What do you want to keep doing yourself?
      </AppText>
      <AppText style={styles.stepBodyLeft}>There are no wrong answers.</AppText>
      {GOAL_PLACEHOLDERS.map((placeholder, index) => (
        <View key={placeholder} style={styles.goalGroup}>
          <TextInput
            style={styles.goalInput}
            value={goals[index].text}
            onChangeText={(text) => updateText(index, text)}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textMuted}
          />
          <Pressable
            style={styles.goalToggleRow}
            onPress={() => toggleVisible(index)}
            accessibilityRole="switch"
            accessibilityState={{ checked: goals[index].family_visible }}
            accessibilityLabel="My family can see this"
          >
            <AppText style={styles.goalToggleLabel}>My family can see this</AppText>
            <View pointerEvents="none">
              <Switch
                value={goals[index].family_visible}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={goals[index].family_visible ? COLORS.primary : COLORS.surface}
              />
            </View>
          </Pressable>
        </View>
      ))}
      <Pressable
        style={styles.primaryButton}
        onPress={onSave}
        accessibilityRole="button"
        accessibilityLabel="Save"
      >
        <AppText weight="bold" style={styles.primaryButtonText}>
          Save
        </AppText>
      </Pressable>
    </ScrollView>
  )
}

function DoneStep({ onOpen }: { onOpen: () => void }) {
  return (
    <View style={styles.centeredStep}>
      <View style={styles.doneCircle}>
        <Check size={56} color={COLORS.primary} />
      </View>
      <AppText weight="black" style={styles.doneTitle}>
        Aethon is ready
      </AppText>
      <Pressable
        style={styles.lightButton}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel="Open Aethon"
      >
        <AppText weight="bold" style={styles.lightButtonText}>
          Open Aethon
        </AppText>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  containerPrimary: {
    backgroundColor: COLORS.primary,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.sm,
    minHeight: TOUCH.standard,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  skipButton: {
    minWidth: TOUCH.resident,
    minHeight: TOUCH.resident,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: TYPE.residentMin,
    color: COLORS.primary,
  },
  skipTextInverted: {
    color: COLORS.surface,
  },
  centeredStep: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.xl,
  },
  scrollStep: {
    flexGrow: 1,
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.lg,
    paddingBottom: SPACE.xl,
  },
  welcomeTitle: {
    marginTop: SPACE.lg,
    fontSize: 46,
    color: COLORS.surface,
    letterSpacing: 1,
  },
  welcomeSubtitle: {
    marginTop: SPACE.sm,
    fontSize: 26,
    color: COLORS.surface,
    marginBottom: SPACE.xl,
  },
  stepTitle: {
    fontSize: 28,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACE.xl,
  },
  stepTitleLeft: {
    fontSize: 26,
    color: COLORS.text,
    marginBottom: SPACE.lg,
  },
  reminderSpacing: {
    marginTop: SPACE.lg,
    fontSize: 26,
  },
  stepBody: {
    fontSize: TYPE.residentMin,
    color: COLORS.textSecond,
    textAlign: 'center',
    marginBottom: SPACE.xl,
  },
  stepBodyLeft: {
    fontSize: TYPE.residentMin,
    color: COLORS.textSecond,
    marginTop: SPACE.md,
  },
  smallPrint: {
    marginTop: SPACE.md,
    marginBottom: SPACE.xl,
    fontSize: TYPE.residentMin,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  nameInput: {
    width: '100%',
    height: TOUCH.resident,
    fontSize: 28,
    color: COLORS.text,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    marginBottom: SPACE.xl,
  },
  contactCard: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACE.lg,
    marginBottom: SPACE.md,
  },
  contactName: {
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 4,
  },
  contactDetail: {
    fontSize: TYPE.residentMin,
    color: COLORS.textSecond,
    marginTop: 2,
  },
  goalGroup: {
    width: '100%',
    marginBottom: SPACE.md,
  },
  goalInput: {
    width: '100%',
    height: TOUCH.resident,
    fontSize: TYPE.residentMin,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: SPACE.sm,
  },
  goalToggleRow: {
    width: '100%',
    minHeight: TOUCH.resident,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalToggleLabel: {
    fontSize: TYPE.residentMin,
    color: COLORS.textSecond,
  },
  lightButton: {
    width: '100%',
    height: TOUCH.resident,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightButtonText: {
    fontSize: TYPE.residentBody,
    color: COLORS.primary,
  },
  primaryButton: {
    width: '100%',
    height: TOUCH.resident,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACE.sm,
  },
  primaryButtonText: {
    fontSize: TYPE.residentBody,
    color: COLORS.surface,
  },
  outlinedButton: {
    width: '100%',
    height: TOUCH.resident,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACE.md,
  },
  outlinedButtonText: {
    fontSize: TYPE.residentMin,
    color: COLORS.primary,
  },
  doneCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE.xl,
  },
  doneTitle: {
    fontSize: 32,
    color: COLORS.surface,
    textAlign: 'center',
    marginBottom: SPACE.xl,
  },
})
