import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { COLORS, RADIUS } from '../constants/theme'
import AppText from './AppText'

type Props = {
  count: number
  style?: StyleProp<ViewStyle>
}

// Renders nothing at zero, matching the web portal's badge behavior.
export default function Badge({ count, style }: Props) {
  if (count <= 0) return null

  return (
    <View style={[styles.badge, style]}>
      <AppText weight="bold" style={styles.label}>
        {count}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.badge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: COLORS.surface,
    fontSize: 11,
  },
})
