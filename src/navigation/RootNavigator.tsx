import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE, WEIGHT } from '../constants/theme'
import { getViewChoice, setViewChoice, ViewChoice } from '../lib/data'
import { StyleGuideScreen } from '../screens/shared'
import CarerNavigator from './CarerNavigator'
import ResidentNavigator from './ResidentNavigator'

// There is no sign-in yet. This screen stands in for auth: the person picks
// which view they are, and that choice is remembered for next launch.
export default function RootNavigator() {
  const [view, setView] = useState<ViewChoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStyleGuideOpen, setIsStyleGuideOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    getViewChoice().then((choice) => {
      if (!cancelled) {
        setView(choice)
        setIsLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const chooseView = useCallback((choice: ViewChoice) => {
    setView(choice)
    setViewChoice(choice)
  }, [])

  const switchView = useCallback(() => {
    setView(null)
    setViewChoice(null)
  }, [])

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    )
  }

  if (view === 'carer') {
    return <CarerNavigator onSwitchView={switchView} />
  }

  if (view === 'resident') {
    return <ResidentNavigator onSwitchView={switchView} />
  }

  if (isStyleGuideOpen) {
    return <StyleGuideScreen onBack={() => setIsStyleGuideOpen(false)} />
  }

  return (
    <ChooserScreen
      onChoose={chooseView}
      onOpenStyleGuide={() => setIsStyleGuideOpen(true)}
    />
  )
}

function ChooserScreen({
  onChoose,
  onOpenStyleGuide,
}: {
  onChoose: (choice: ViewChoice) => void
  onOpenStyleGuide: () => void
}) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
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
  styleGuideButton: {
    alignSelf: 'center',
    marginTop: SPACE.lg,
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
