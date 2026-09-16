import React from 'react'
import { StyleSheet, Text } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { COLORS, GRADIENT, RADIUS, WEIGHT } from '../constants/theme'

type Props = {
  name: string
  size?: number
}

export default function GradientAvatar({ name, size = 56 }: Props) {
  const initial = name.trim().charAt(0).toUpperCase()

  return (
    <LinearGradient
      colors={GRADIENT.avatar}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        { width: size, height: size, borderRadius: RADIUS.lg },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: COLORS.surface,
    fontWeight: WEIGHT.black,
  },
})
