import React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { COLORS, RADIUS, SHADOW } from '../constants/theme'

type Props = {
  size?: number
}

const logoSource = require('../../assets/images/logo.png')

export default function Logo({ size = 32 }: Props) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: RADIUS.md,
          padding: Math.round(size * 0.125),
        },
      ]}
    >
      <Image source={logoSource} style={styles.image} resizeMode="contain" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
})
