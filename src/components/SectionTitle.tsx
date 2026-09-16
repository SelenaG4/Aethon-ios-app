import React from 'react'
import { StyleSheet, Text } from 'react-native'
import { COLORS, WEIGHT } from '../constants/theme'

type Props = {
  children: React.ReactNode
}

export default function SectionTitle({ children }: Props) {
  return <Text style={styles.title}>{children}</Text>
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: WEIGHT.heavy,
    color: COLORS.text,
  },
})
