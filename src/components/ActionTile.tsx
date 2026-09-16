import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'
import { COLORS, RADIUS, SPACE, TYPE, WEIGHT } from '../constants/theme'
import Card from './Card'

export type ActionTileVariant = 'success' | 'info' | 'warning' | 'danger'

type Props = {
  variant: ActionTileVariant
  label: string
  icon: LucideIcon
  onPress?: () => void
}

const VARIANT_STYLES: Record<ActionTileVariant, { background: string; color: string }> = {
  success: { background: COLORS.successLight, color: COLORS.successDark },
  info: { background: COLORS.primaryLight, color: COLORS.primaryDark },
  warning: { background: COLORS.amberLight, color: COLORS.amber },
  danger: { background: COLORS.dangerLight, color: COLORS.danger },
}

// Meant to be placed inside a two-column grid, e.g. a wrapping row with
// flexWrap: 'wrap' and justifyContent: 'space-between'.
export default function ActionTile({ variant, label, icon: Icon, onPress }: Props) {
  const { background, color } = VARIANT_STYLES[variant]

  return (
    <Card onPress={onPress} style={styles.tile}>
      <View style={[styles.iconCircle, { backgroundColor: background }]}>
        <Icon size={22} color={color} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Card>
  )
}

const styles = StyleSheet.create({
  tile: {
    width: '47%',
    alignItems: 'center',
    marginBottom: SPACE.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE.sm,
  },
  label: {
    fontSize: TYPE.small,
    fontWeight: WEIGHT.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
})
