import React from 'react'
import { StyleSheet, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'
import { COLORS, RADIUS, SPACE, TYPE } from '../constants/theme'
import AppText from './AppText'

export type StatusPillVariant = 'success' | 'info' | 'warning' | 'danger'

type Props = {
  variant: StatusPillVariant
  label: string
  icon: LucideIcon
}

const VARIANT_STYLES: Record<StatusPillVariant, { background: string; color: string }> = {
  success: { background: COLORS.successLight, color: COLORS.successDark },
  info: { background: COLORS.primaryLight, color: COLORS.primaryDark },
  warning: { background: COLORS.amberLight, color: COLORS.amber },
  danger: { background: COLORS.dangerLight, color: COLORS.danger },
}

export default function StatusPill({ variant, label, icon: Icon }: Props) {
  const { background, color } = VARIANT_STYLES[variant]

  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      <Icon size={14} color={color} />
      <AppText weight="bold" style={[styles.label, { color }]}>
        {label}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: SPACE.xs,
  },
  label: {
    fontSize: TYPE.small,
  },
})
