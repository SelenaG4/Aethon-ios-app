import React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { COLORS, SPACE, TYPE } from '../constants/theme'
import AppText from './AppText'

type Props = {
  message?: string
  // Resident/onboarding screens need >=22pt text (CLAUDE.md); everywhere
  // else the guide's 17pt already clears the 15pt carer minimum.
  isResident?: boolean
}

export default function LoadingView({ message, isResident }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      {message ? (
        <AppText style={[styles.message, isResident && styles.messageResident]}>{message}</AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: SPACE.md,
    fontSize: TYPE.body,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  messageResident: {
    fontSize: TYPE.residentMin,
  },
})
