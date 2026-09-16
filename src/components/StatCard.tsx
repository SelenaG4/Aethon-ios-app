import React from 'react'
import { StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import type { LucideIcon } from 'lucide-react-native'
import { COLORS, SPACE, TYPE } from '../constants/theme'
import AppText from './AppText'
import Card from './Card'

type Props = {
  label: string
  value: string | number
  icon: LucideIcon
  gradient: string[]
}

export default function StatCard({ label, value, icon: Icon, gradient }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <AppText weight="regular" style={styles.label}>
          {label}
        </AppText>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <Icon size={20} color={COLORS.surface} />
        </LinearGradient>
      </View>
      <AppText weight="bold" style={styles.value}>
        {value}
      </AppText>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: TYPE.small,
    color: COLORS.textMuted,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    marginTop: SPACE.sm,
    fontSize: 30,
    color: COLORS.text,
  },
})
