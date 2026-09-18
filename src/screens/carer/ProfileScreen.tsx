import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Check } from 'lucide-react-native'
import { AppText, ScreenHeader } from '../../components'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../../constants/theme'
import { CURRENT_CARER } from '../../lib/data'
import { LANGUAGE_LABELS, useTranslation } from '../../lib/i18n'

type Props = {
  onSwitchView: () => void
}

const LANGUAGES = ['en', 'de', 'fr', 'it'] as const

export default function ProfileScreen({ onSwitchView }: Props) {
  const { t, language, setLanguage } = useTranslation()

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <ScreenHeader title={t('profile.title')} subtitle={CURRENT_CARER.name} />

        <AppText weight="bold" style={styles.sectionLabel}>
          {t('profile.language')}
        </AppText>
        <View style={styles.languageCard}>
          {LANGUAGES.map((code, index) => {
            const selected = language === code
            return (
              <Pressable
                key={code}
                onPress={() => setLanguage(code)}
                style={[styles.languageRow, index > 0 && styles.languageRowBorder]}
                accessibilityRole="button"
                accessibilityLabel={LANGUAGE_LABELS[code]}
                accessibilityState={{ selected }}
              >
                <AppText weight={selected ? 'bold' : 'regular'} style={styles.languageRowText}>
                  {LANGUAGE_LABELS[code]}
                </AppText>
                {selected ? <Check size={20} color={COLORS.primary} /> : null}
              </Pressable>
            )
          })}
        </View>

        <Pressable
          style={styles.switchControl}
          onPress={onSwitchView}
          accessibilityRole="button"
          accessibilityLabel={t('common.switchView')}
        >
          <AppText weight="semibold" style={styles.switchControlText}>
            {t('common.switchView')}
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
  sectionLabel: {
    marginTop: SPACE.xl,
    marginBottom: SPACE.sm,
    fontSize: TYPE.small,
    color: COLORS.textMuted,
  },
  languageCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TOUCH.standard,
    paddingHorizontal: SPACE.lg,
  },
  languageRowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  languageRowText: {
    fontSize: TYPE.body,
    color: COLORS.text,
  },
  switchControl: {
    alignSelf: 'flex-start',
    marginTop: SPACE.xl,
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
