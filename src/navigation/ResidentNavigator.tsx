import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../constants/theme'

type Props = {
  onSwitchView: () => void
}

// Placeholder until real resident-facing screens exist.
// Text and touch targets use the larger resident scale per theme.ts.
export default function ResidentNavigator({ onSwitchView }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Resident view</Text>
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
    fontSize: TYPE.residentH1,
    fontWeight: '700',
    color: COLORS.text,
  },
  switchControl: {
    alignSelf: 'center',
    marginBottom: SPACE.lg,
    minHeight: TOUCH.resident,
    minWidth: TOUCH.resident * 2,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchControlText: {
    color: COLORS.blue,
    fontSize: TYPE.residentMin,
    fontWeight: '600',
  },
})
