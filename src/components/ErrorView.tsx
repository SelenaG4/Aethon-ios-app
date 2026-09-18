import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { CircleAlert } from 'lucide-react-native'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../constants/theme'
import AppText from './AppText'

type Props = {
  message: string
  onRetry: () => void
  // Resident/onboarding screens need >=22pt text and >=80pt controls
  // (CLAUDE.md); everywhere else the guide's own 18pt/52pt already clear
  // the carer minimums.
  isResident?: boolean
}

export default function ErrorView({ message, onRetry, isResident }: Props) {
  return (
    <View style={styles.container}>
      <CircleAlert size={64} color={COLORS.danger} />
      <AppText style={[styles.message, isResident && styles.messageResident]}>{message}</AppText>
      <Pressable
        style={[styles.button, isResident ? styles.buttonResident : styles.buttonStandard]}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        <AppText weight="bold" style={[styles.buttonText, isResident && styles.buttonTextResident]}>
          Try again
        </AppText>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.xl,
  },
  message: {
    marginTop: SPACE.md,
    fontSize: TYPE.h3,
    color: COLORS.text,
    textAlign: 'center',
  },
  messageResident: {
    fontSize: TYPE.residentMin,
  },
  button: {
    marginTop: SPACE.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonStandard: {
    height: TOUCH.standard,
    width: 180,
  },
  buttonResident: {
    height: TOUCH.resident,
    minWidth: 220,
    paddingHorizontal: SPACE.xl,
  },
  buttonText: {
    fontSize: TYPE.body,
    color: COLORS.surface,
  },
  buttonTextResident: {
    fontSize: TYPE.residentMin,
  },
})
