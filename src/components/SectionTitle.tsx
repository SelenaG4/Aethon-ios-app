import React from 'react'
import { StyleSheet } from 'react-native'
import { COLORS } from '../constants/theme'
import AppText from './AppText'

type Props = {
  children: React.ReactNode
}

export default function SectionTitle({ children }: Props) {
  return (
    <AppText weight="heavy" style={styles.title}>
      {children}
    </AppText>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    color: COLORS.text,
  },
})
