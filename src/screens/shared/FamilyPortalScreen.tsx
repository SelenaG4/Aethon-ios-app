import React from 'react'
import { Linking, Pressable, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft } from 'lucide-react-native'
import { AppText, ScreenHeader } from '../../components'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../../constants/theme'

const WEB_PORTAL_URL = 'https://aethon-amber.vercel.app'

type Props = {
  onBack: () => void
}

// Family members and facility management use the web portal, not this app.
export default function FamilyPortalScreen({ onBack }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={20} color={COLORS.text} />
          <AppText weight="semibold" style={styles.backLabel}>
            Back
          </AppText>
        </Pressable>

        <ScreenHeader title="Family or management" subtitle="Please use the web portal" />

        <AppText weight="semibold" style={styles.url}>
          {WEB_PORTAL_URL}
        </AppText>

        <Pressable
          style={styles.openButton}
          onPress={() => Linking.openURL(WEB_PORTAL_URL)}
          accessibilityRole="button"
          accessibilityLabel="Open in Safari"
        >
          <AppText weight="bold" style={styles.openButtonText}>
            Open in Safari
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    marginBottom: SPACE.md,
  },
  backLabel: {
    fontSize: TYPE.body,
    color: COLORS.text,
  },
  url: {
    fontSize: TYPE.body,
    color: COLORS.primary,
    marginBottom: SPACE.lg,
  },
  openButton: {
    alignSelf: 'flex-start',
    minHeight: TOUCH.standard,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openButtonText: {
    color: COLORS.surface,
    fontSize: TYPE.body,
  },
})
