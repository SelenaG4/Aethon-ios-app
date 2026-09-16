import React from 'react'
import { Platform, Text, TextProps, TextStyle } from 'react-native'
import { FONT } from '../constants/theme'

export type AppTextWeight = keyof typeof FONT

type Props = TextProps & {
  weight?: AppTextWeight
}

// Android needs an explicit fontWeight alongside fontFamily to pick the
// right static weight file; iOS resolves the weight from fontFamily alone,
// and adding fontWeight there can make it pick the wrong font entirely.
const ANDROID_FONT_WEIGHT: Record<AppTextWeight, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
  black: '900',
}

export default function AppText({ weight = 'regular', style, ...rest }: Props) {
  const fontStyle: TextStyle =
    Platform.OS === 'ios'
      ? { fontFamily: FONT[weight] }
      : { fontFamily: FONT[weight], fontWeight: ANDROID_FONT_WEIGHT[weight] }

  return <Text {...rest} style={[fontStyle, style]} />
}
