import React from 'react'
import { StyleSheet, View } from 'react-native'
import { COLORS, SPACE, TYPE } from '../constants/theme'
import AppText from './AppText'

type Props = {
  title: string
  subtitle?: string
}

export default function ScreenHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <AppText weight="black" style={styles.title}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText weight="regular" style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACE.lg,
  },
  title: {
    fontSize: TYPE.h1,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: SPACE.xs,
    fontSize: TYPE.body,
    color: COLORS.textMuted,
  },
})
