import React from 'react'
import { StyleSheet, View } from 'react-native'
import { COLORS, SPACE, TYPE } from '../constants/theme'
import AppText from './AppText'

type IconComponent = React.ComponentType<{ size?: number; color?: string }>

type Props = {
  icon: IconComponent
  message: string
  detail?: string
  // Resident/onboarding screens need >=22pt text (CLAUDE.md); everywhere
  // else the guide's own 18pt/15pt already clear the carer minimums.
  isResident?: boolean
}

export default function EmptyView({ icon: Icon, message, detail, isResident }: Props) {
  return (
    <View style={styles.container}>
      <Icon size={72} color={COLORS.border} />
      <AppText style={[styles.message, isResident && styles.messageResident]}>{message}</AppText>
      {detail ? (
        <AppText style={[styles.detail, isResident && styles.detailResident]}>{detail}</AppText>
      ) : null}
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
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  messageResident: {
    fontSize: TYPE.residentMin,
  },
  detail: {
    marginTop: SPACE.xs,
    fontSize: TYPE.small,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  detailResident: {
    fontSize: TYPE.residentMin,
  },
})
