import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppText, ScreenHeader } from '../../components'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../../constants/theme'
import { CURRENT_CARER } from '../../lib/data'

type Props = {
  onSwitchView: () => void
}

// Placeholder until the real profile screen exists.
export default function ProfileScreen({ onSwitchView }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <ScreenHeader title="Profile" subtitle={CURRENT_CARER.name} />
        <Pressable
          style={styles.switchControl}
          onPress={onSwitchView}
          accessibilityRole="button"
          accessibilityLabel="Switch view"
        >
          <AppText weight="semibold" style={styles.switchControlText}>
            Switch view
          </AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  switchControl: {
    alignSelf: 'flex-start',
    marginTop: SPACE.md,
    minHeight: TOUCH.standard,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchControlText: {
    color: COLORS.blue,
    fontSize: TYPE.body,
  },
})
