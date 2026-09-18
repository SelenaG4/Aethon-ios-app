import React, { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import notifee, { AuthorizationStatus } from '@notifee/react-native'
import { Bell, Check } from 'lucide-react-native'
import { AppText, LanguageButtons, Logo } from '../../components'
import { EMERGENCY_NUMBER } from '../../constants/config'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../../constants/theme'
import { TranslationKey, useTranslation } from '../../lib/i18n'
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

const GOAL_PLACEHOLDER_KEYS: TranslationKey[] = [
  'residentOnboarding.goalPlaceholder1',
  'residentOnboarding.goalPlaceholder2',
  'residentOnboarding.goalPlaceholder3',
]

const EMPTY_GOAL_DRAFTS: GoalDraft[] = GOAL_PLACEHOLDER_KEYS.map(() => ({
  text: '',
  family_visible: false,
}))

const STEP_COUNT = 7

export default function ResidentOnboarding({ resident, onComplete }: Props) {
  const { t } = useTranslation()
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

  // Step 1 (language) stays neutral/white — nothing has been chosen yet, so
  // there's no "this is the language" colour to commit to. Welcome (now
  // step 2) and Done (last step) are the two vibrant bookend steps.
  const isColoredStep = step === 2 || step === STEP_COUNT

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
            accessibilityLabel={t('residentOnboarding.skip')}
          >
            <AppText
              weight="semibold"
              style={[styles.skipText, isColoredStep && styles.skipTextInverted]}
            >
              {t('residentOnboarding.skip')}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {step === 1 ? <LanguageStep onSelect={goNext} /> : null}
      {step === 2 ? <WelcomeStep onGetStarted={goNext} /> : null}
      {step === 3 ? <NameStep name={name} onChangeName={setName} onSave={onSaveName} /> : null}
      {step === 4 ? <RemindersStep onYes={onWantReminders} onNotNow={onNotNow} /> : null}
      {step === 5 ? <ContactsStep resident={resident} onConfirm={goNext} /> : null}
      {step === 6 ? (
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

function LanguageStep({ onSelect }: { onSelect: () => void }) {
  return (
    <View style={styles.centeredStep}>
      <Logo size={90} />
      <View style={styles.languageGridWrap}>
        <LanguageButtons onSelect={onSelect} />
      </View>
    </View>
  )
}

function WelcomeStep({ onGetStarted }: { onGetStarted: () => void }) {
  const { t } = useTranslation()
  return (
    <View style={styles.centeredStep}>
      <Logo size={110} />
      <AppText weight="black" style={styles.welcomeTitle}>
        {t('residentOnboarding.welcomeTitle')}
      </AppText>
      <AppText weight="semibold" style={styles.welcomeSubtitle}>
        {t('residentOnboarding.welcomeSubtitle')}
      </AppText>
      <Pressable
        style={styles.lightButton}
        onPress={onGetStarted}
        accessibilityRole="button"
        accessibilityLabel={t('residentOnboarding.getStarted')}
      >
        <AppText weight="bold" style={styles.lightButtonText}>
          {t('residentOnboarding.getStarted')}
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
  const { t } = useTranslation()
  return (
    <View style={styles.centeredStep}>
      <AppText weight="bold" style={styles.stepTitle}>
        {t('residentOnboarding.nameQuestion')}
      </AppText>
      <TextInput
        style={styles.nameInput}
        value={name}
        onChangeText={onChangeName}
        textAlign="center"
        placeholder={t('residentOnboarding.namePlaceholder')}
        placeholderTextColor={COLORS.textSecond}
      />
      <Pressable
        style={styles.primaryButton}
        onPress={onSave}
        accessibilityRole="button"
        accessibilityLabel={t('residentOnboarding.thatIsMyName')}
      >
        <AppText weight="bold" style={styles.primaryButtonText}>
          {t('residentOnboarding.thatIsMyName')}
        </AppText>
      </Pressable>
    </View>
  )
}

function RemindersStep({ onYes, onNotNow }: { onYes: () => void; onNotNow: () => void }) {
  const { t } = useTranslation()
  return (
    <View style={styles.centeredStep}>
      <Bell size={76} color={COLORS.primary} />
      <AppText weight="bold" style={[styles.stepTitle, styles.reminderSpacing]}>
        {t('residentOnboarding.remindersQuestion')}
      </AppText>
      <AppText style={styles.stepBody}>{t('residentOnboarding.remindersBody')}</AppText>
      <Pressable
        style={styles.primaryButton}
        onPress={onYes}
        accessibilityRole="button"
        accessibilityLabel={t('residentOnboarding.yesRemindMe')}
      >
        <AppText weight="bold" style={styles.primaryButtonText}>
          {t('residentOnboarding.yesRemindMe')}
        </AppText>
      </Pressable>
      <Pressable
        style={styles.outlinedButton}
        onPress={onNotNow}
        accessibilityRole="button"
        accessibilityLabel={t('residentOnboarding.notNow')}
      >
        <AppText weight="bold" style={styles.outlinedButtonText}>
          {t('residentOnboarding.notNow')}
        </AppText>
      </Pressable>
    </View>
  )
}

function ContactsStep({ resident, onConfirm }: { resident: Resident; onConfirm: () => void }) {
  const { t } = useTranslation()
  const contacts = [...resident.emergency_contacts].sort((a, b) => a.priority - b.priority)

  return (
    <ScrollView contentContainerStyle={styles.scrollStep} keyboardShouldPersistTaps="handled">
      <AppText weight="bold" style={styles.stepTitleLeft}>
        {t('residentOnboarding.contactsQuestion')}
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
      <AppText style={styles.stepBodyLeft}>{t('residentOnboarding.contactsBody')}</AppText>
      <AppText style={styles.smallPrint}>
        {t('residentOnboarding.emergencyDisclaimer', { number: EMERGENCY_NUMBER })}
      </AppText>
      <Pressable
        style={styles.primaryButton}
        onPress={onConfirm}
        accessibilityRole="button"
        accessibilityLabel={t('residentOnboarding.theseAreCorrect')}
      >
        <AppText weight="bold" style={styles.primaryButtonText}>
          {t('residentOnboarding.theseAreCorrect')}
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
  const { t } = useTranslation()

  const updateText = (index: number, text: string) => {
    onChangeGoals(goals.map((g, i) => (i === index ? { ...g, text } : g)))
  }

  const toggleVisible = (index: number) => {
    onChangeGoals(goals.map((g, i) => (i === index ? { ...g, family_visible: !g.family_visible } : g)))
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollStep} keyboardShouldPersistTaps="handled">
      <AppText weight="bold" style={styles.stepTitleLeft}>
        {t('residentOnboarding.goalsQuestion')}
      </AppText>
      <AppText style={styles.stepBodyLeft}>{t('residentOnboarding.goalsBody')}</AppText>
      {GOAL_PLACEHOLDER_KEYS.map((placeholderKey, index) => (
        <View key={placeholderKey} style={styles.goalGroup}>
          <TextInput
            style={styles.goalInput}
            value={goals[index].text}
            onChangeText={(text) => updateText(index, text)}
            placeholder={t(placeholderKey)}
            placeholderTextColor={COLORS.textSecond}
          />
          <Pressable
            style={styles.goalToggleRow}
            onPress={() => toggleVisible(index)}
            accessibilityRole="switch"
            accessibilityState={{ checked: goals[index].family_visible }}
            accessibilityLabel={t('residentOnboarding.familyCanSee')}
          >
            <AppText style={styles.goalToggleLabel}>{t('residentOnboarding.familyCanSee')}</AppText>
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
        accessibilityLabel={t('common.save')}
      >
        <AppText weight="bold" style={styles.primaryButtonText}>
          {t('common.save')}
        </AppText>
      </Pressable>
    </ScrollView>
  )
}

function DoneStep({ onOpen }: { onOpen: () => void }) {
  const { t } = useTranslation()
  return (
    <View style={styles.centeredStep}>
      <View style={styles.doneCircle}>
        <Check size={56} color={COLORS.primary} />
      </View>
      <AppText weight="black" style={styles.doneTitle}>
        {t('residentOnboarding.doneTitle')}
      </AppText>
      <Pressable
        style={styles.lightButton}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={t('residentOnboarding.openAethon')}
      >
        <AppText weight="bold" style={styles.lightButtonText}>
          {t('residentOnboarding.openAethon')}
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
    lineHeight: 31,
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
  languageGridWrap: {
    width: '100%',
    marginTop: SPACE.xl,
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
    lineHeight: 64,
    color: COLORS.surface,
    letterSpacing: 1,
  },
  welcomeSubtitle: {
    marginTop: SPACE.sm,
    fontSize: 26,
    lineHeight: 36,
    color: COLORS.surface,
    marginBottom: SPACE.xl,
  },
  stepTitle: {
    fontSize: 28,
    lineHeight: 39,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACE.xl,
  },
  stepTitleLeft: {
    fontSize: 26,
    lineHeight: 36,
    color: COLORS.text,
    marginBottom: SPACE.lg,
  },
  reminderSpacing: {
    marginTop: SPACE.lg,
    fontSize: 26,
    lineHeight: 36,
  },
  stepBody: {
    fontSize: TYPE.residentMin,
    lineHeight: 31,
    color: COLORS.textSecond,
    textAlign: 'center',
    marginBottom: SPACE.xl,
  },
  stepBodyLeft: {
    fontSize: TYPE.residentMin,
    lineHeight: 31,
    color: COLORS.textSecond,
    marginTop: SPACE.md,
  },
  smallPrint: {
    marginTop: SPACE.md,
    marginBottom: SPACE.xl,
    fontSize: TYPE.residentMin,
    lineHeight: 31,
    color: COLORS.textSecond,
    fontStyle: 'italic',
  },
  nameInput: {
    width: '100%',
    minHeight: TOUCH.resident,
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
    lineHeight: 34,
    color: COLORS.text,
    marginBottom: 4,
  },
  contactDetail: {
    fontSize: TYPE.residentMin,
    lineHeight: 31,
    color: COLORS.textSecond,
    marginTop: 2,
  },
  goalGroup: {
    width: '100%',
    marginBottom: SPACE.md,
  },
  goalInput: {
    width: '100%',
    minHeight: TOUCH.resident,
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
    flexWrap: 'wrap',
  },
  goalToggleLabel: {
    flexShrink: 1,
    fontSize: TYPE.residentMin,
    lineHeight: 31,
    color: COLORS.textSecond,
  },
  lightButton: {
    width: '100%',
    minHeight: TOUCH.resident,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACE.sm,
  },
  lightButtonText: {
    fontSize: TYPE.residentBody,
    lineHeight: 31,
    color: COLORS.primary,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    minHeight: TOUCH.resident,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACE.sm,
    paddingVertical: SPACE.sm,
  },
  primaryButtonText: {
    fontSize: TYPE.residentBody,
    lineHeight: 31,
    color: COLORS.surface,
    textAlign: 'center',
  },
  outlinedButton: {
    width: '100%',
    minHeight: TOUCH.resident,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACE.md,
    paddingVertical: SPACE.sm,
  },
  outlinedButtonText: {
    fontSize: TYPE.residentMin,
    lineHeight: 31,
    color: COLORS.primary,
    textAlign: 'center',
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
    lineHeight: 45,
    color: COLORS.surface,
    textAlign: 'center',
    marginBottom: SPACE.xl,
  },
})
