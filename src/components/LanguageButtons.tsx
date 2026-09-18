import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { COLORS, RADIUS, SPACE, TYPE } from '../constants/theme'
import type { Language } from '../lib/data'
import { LANGUAGE_LABELS, useTranslation } from '../lib/i18n'
import AppText from './AppText'

const LANGUAGES: Language[] = ['en', 'de', 'fr', 'it']

type Props = {
  // Called after setLanguage, e.g. to advance an onboarding step. Optional —
  // the resident home and carer client profile just want the tap to apply.
  onSelect?: (language: Language) => void
}

// The resident-facing language grid: 2x2, minHeight 96 (guide-specified as
// "height 96", built as minHeight so a long translated label or a large
// Dynamic Type size can still grow the button instead of clipping). Used
// identically on the first onboarding step and the resident home's
// Language card. Labels are never translated — each button always shows
// its own language's own name for itself, so a resident who doesn't yet
// read the current language can still recognise theirs.
export default function LanguageButtons({ onSelect }: Props) {
  const { language, setLanguage } = useTranslation()

  return (
    <View style={styles.grid}>
      {LANGUAGES.map((code) => {
        const selected = language === code
        return (
          <Pressable
            key={code}
            onPress={() => {
              setLanguage(code)
              onSelect?.(code)
            }}
            style={[styles.button, selected && styles.buttonSelected]}
            accessibilityRole="button"
            accessibilityLabel={LANGUAGE_LABELS[code]}
            accessibilityState={{ selected }}
          >
            <AppText
              weight="bold"
              style={[styles.buttonText, selected && styles.buttonTextSelected]}
            >
              {LANGUAGE_LABELS[code]}
            </AppText>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: SPACE.md,
  },
  button: {
    width: '48%',
    minHeight: 96,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.sm,
  },
  buttonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    fontSize: TYPE.residentBody,
    lineHeight: Math.round(TYPE.residentBody * 1.4),
    color: COLORS.text,
    textAlign: 'center',
  },
  buttonTextSelected: {
    color: COLORS.surface,
  },
})
