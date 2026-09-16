import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../constants/theme'
import { CURRENT_CARER } from '../lib/data'

type Props = {
  onSwitchView: () => void
}

// Placeholder until real carer-facing screens exist.
export default function CarerNavigator({ onSwitchView }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Carer view</Text>
        <Text style={styles.subtitle}>Signed in as {CURRENT_CARER.name}</Text>
      </View>
      <Pressable
        style={styles.switchControl}
        onPress={onSwitchView}
        accessibilityRole="button"
        accessibilityLabel="Switch view"
      >
        <Text style={styles.switchControlText}>Switch view</Text>
      </Pressable>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.lg,
  },
  title: {
    fontSize: TYPE.h1,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACE.sm,
  },
  subtitle: {
    fontSize: TYPE.body,
    color: COLORS.textSecond,
  },
  switchControl: {
    alignSelf: 'center',
    marginBottom: SPACE.lg,
    minHeight: TOUCH.standard,
    minWidth: TOUCH.standard * 2,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchControlText: {
    color: COLORS.blue,
    fontSize: TYPE.body,
    fontWeight: '600',
  },
})
