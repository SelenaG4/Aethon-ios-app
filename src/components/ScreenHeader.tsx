import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { COLORS, SPACE, TYPE, WEIGHT } from '../constants/theme'

type Props = {
  title: string
  subtitle?: string
}

export default function ScreenHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACE.lg,
  },
  title: {
    fontSize: TYPE.h1,
    fontWeight: WEIGHT.black,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: SPACE.xs,
    fontSize: TYPE.body,
    color: COLORS.textMuted,
  },
})
