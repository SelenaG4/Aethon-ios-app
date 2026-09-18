import React, { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, ErrorView, LoadingView, Logo } from '../components'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE, WEIGHT } from '../constants/theme'
import { getFirstResident, getOnboardingComplete, getViewChoice, setViewChoice, ViewChoice } from '../lib/data'
import type { Resident } from '../lib/mockData'
import { FamilyPortalScreen, StyleGuideScreen } from '../screens/shared'
import ResidentOnboarding from '../screens/onboarding/ResidentOnboarding'
import CarerNavigator from './CarerNavigator'
import ResidentNavigator from './ResidentNavigator'

// There is no sign-in yet. This screen stands in for auth: the person picks
// which view they are, and that choice is remembered for next launch.
export default function RootNavigator() {
  const [view, setView] = useState<ViewChoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [isStyleGuideOpen, setIsStyleGuideOpen] = useState(false)
  const [isFamilyPortalOpen, setIsFamilyPortalOpen] = useState(false)
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false)
  const [firstResident, setFirstResident] = useState<Resident | undefined>(undefined)

  const load = useCallback(() => {
    setIsLoading(true)
    Promise.all([getViewChoice(), getOnboardingComplete(), getFirstResident()])
      .then(([choice, onboardingComplete, resident]) => {
        setView(choice)
        setIsOnboardingComplete(onboardingComplete)
        setFirstResident(resident)
        setLoadError(false)
        setIsLoading(false)
      })
      .catch(() => {
        setLoadError(true)
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const chooseView = useCallback((choice: ViewChoice) => {
    setView(choice)
    setViewChoice(choice)
  }, [])

  const switchView = useCallback(() => {
    setView(null)
    setViewChoice(null)
  }, [])

  if (loadError) {
    return (
      <View style={styles.loadingContainer}>
        <ErrorView message="Could not load Aethon" onRetry={load} />
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingView />
      </View>
    )
  }

  if (view === 'carer') {
    return <CarerNavigator onSwitchView={switchView} />
  }

  if (view === 'resident' && firstResident) {
    if (!isOnboardingComplete) {
      return (
        <ResidentOnboarding
          resident={firstResident}
          onComplete={() => setIsOnboardingComplete(true)}
        />
      )
    }
    return <ResidentNavigator residentId={firstResident.id} onSwitchView={switchView} />
  }

  if (isStyleGuideOpen) {
    return <StyleGuideScreen onBack={() => setIsStyleGuideOpen(false)} />
  }

  if (isFamilyPortalOpen) {
    return <FamilyPortalScreen onBack={() => setIsFamilyPortalOpen(false)} />
  }

  return (
    <ChooserScreen
      onChoose={chooseView}
      onOpenStyleGuide={() => setIsStyleGuideOpen(true)}
      onOpenFamilyPortal={() => setIsFamilyPortalOpen(true)}
    />
  )
}

function ChooserScreen({
  onChoose,
  onOpenStyleGuide,
  onOpenFamilyPortal,
}: {
  onChoose: (choice: ViewChoice) => void
  onOpenStyleGuide: () => void
  onOpenFamilyPortal: () => void
}) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <Logo size={32} />
          <AppText weight="bold" style={styles.brandText}>
            Aethon
          </AppText>
        </View>
        <Text style={styles.title}>Choose a view</Text>
        <Pressable
          style={[styles.choiceButton, styles.carerButton]}
          onPress={() => onChoose('carer')}
          accessibilityRole="button"
          accessibilityLabel="Carer"
        >
          <Text style={styles.choiceButtonText}>Carer</Text>
        </Pressable>
        <Pressable
          style={[styles.choiceButton, styles.residentButton]}
          onPress={() => onChoose('resident')}
          accessibilityRole="button"
          accessibilityLabel="Resident"
        >
          <Text style={styles.choiceButtonText}>Resident</Text>
        </Pressable>
        <Pressable
          style={styles.familyPortalLink}
          onPress={onOpenFamilyPortal}
          accessibilityRole="button"
          accessibilityLabel="Family or management"
        >
          <Text style={styles.familyPortalLinkText}>Family or management</Text>
        </Pressable>
        <Pressable
          style={styles.styleGuideButton}
          onPress={onOpenStyleGuide}
          accessibilityRole="button"
          accessibilityLabel="Style guide"
        >
          <Text style={styles.styleGuideButtonText}>Style guide</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: SPACE.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    marginBottom: SPACE.xl,
  },
  brandText: {
    fontSize: TYPE.h2,
    color: COLORS.text,
  },
  title: {
    fontSize: TYPE.h1,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACE.xl,
  },
  choiceButton: {
    minHeight: TOUCH.resident,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE.md,
  },
  carerButton: {
    backgroundColor: COLORS.primary,
  },
  residentButton: {
    backgroundColor: COLORS.blue,
  },
  choiceButtonText: {
    color: COLORS.surface,
    fontSize: TYPE.h2,
    fontWeight: '700',
  },
  familyPortalLink: {
    alignSelf: 'center',
    marginTop: SPACE.lg,
    minHeight: TOUCH.standard,
    paddingHorizontal: SPACE.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyPortalLinkText: {
    color: COLORS.textSecond,
    fontSize: TYPE.body,
    fontWeight: WEIGHT.semibold,
  },
  styleGuideButton: {
    alignSelf: 'center',
    minHeight: TOUCH.standard,
    paddingHorizontal: SPACE.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleGuideButtonText: {
    color: COLORS.textMuted,
    fontSize: TYPE.body,
    fontWeight: WEIGHT.semibold,
  },
})
