import React, { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { ArrowLeft, Check, X } from 'lucide-react-native'
import { AppText, ErrorView, LoadingView } from '../../components'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../../constants/theme'
import { acknowledgeMedication, getMedication, getResident, Language } from '../../lib/data'
import { useTranslation } from '../../lib/i18n'
import type { Medication } from '../../lib/mockData'
import type { ResidentStackParamList } from '../../navigation/ResidentNavigator'

type AcknowledgeRoute = RouteProp<ResidentStackParamList, 'Acknowledge'>

// English uses 12-hour am/pm; German/French/Italian use the 24-hour clock
// already stored in scheduled_time, so those languages need no conversion.
function formatScheduledTime(time: string, language: Language): string {
  if (language !== 'en') return time
  const [hourText, minuteText] = time.split(':')
  const hour = Number(hourText)
  const period = hour >= 12 ? 'pm' : 'am'
  const hour12 = ((hour + 11) % 12) + 1
  return `${hour12}:${minuteText} ${period}`
}

export default function AcknowledgeScreen() {
  const navigation = useNavigation<NavigationProp<ResidentStackParamList>>()
  const route = useRoute<AcknowledgeRoute>()
  const { t, language } = useTranslation()
  const { medicationId } = route.params
  const [medication, setMedication] = useState<Medication | null>(null)
  const [residentName, setResidentName] = useState('Resident')
  const [recordedStatus, setRecordedStatus] = useState<'taken' | 'skipped' | null>(null)
  const [loadError, setLoadError] = useState(false)

  const load = useCallback(async () => {
    try {
      const m = await getMedication(medicationId)
      if (!m) {
        setLoadError(true)
        return
      }
      setMedication(m)
      const resident = await getResident(m.resident_id)
      if (resident) setResidentName(resident.first_name)
      setLoadError(false)
    } catch {
      setLoadError(true)
    }
  }, [medicationId])

  useEffect(() => {
    load()
  }, [load])

  const onRecord = useCallback(
    async (status: 'taken' | 'skipped') => {
      if (!medication) return
      await acknowledgeMedication(medication.id, status, residentName)
      setRecordedStatus(status)
      setTimeout(() => navigation.goBack(), 2500)
    },
    [medication, residentName, navigation]
  )

  if (loadError) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ErrorView message={t('acknowledge.loadError')} onRetry={load} isResident />
      </SafeAreaView>
    )
  }

  if (!medication) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LoadingView isResident />
      </SafeAreaView>
    )
  }

  if (recordedStatus) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.recordedCentered}>
          <View style={styles.recordedCircle}>
            {recordedStatus === 'taken' ? (
              <Check size={56} color={COLORS.primary} />
            ) : (
              <X size={56} color={COLORS.textMuted} />
            )}
          </View>
          <AppText weight="bold" style={styles.recordedText}>
            {t('acknowledge.recorded')}
          </AppText>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Pressable
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
      >
        <ArrowLeft size={28} color={COLORS.text} />
      </Pressable>

      <View style={styles.content}>
        <AppText weight="black" style={styles.drugName}>
          {medication.name}
        </AppText>
        <AppText style={styles.dose}>{medication.dosage}</AppText>
        <AppText style={styles.scheduledFor}>
          {t('acknowledge.scheduledFor', { time: formatScheduledTime(medication.scheduled_time, language) })}
        </AppText>
      </View>

      <View style={styles.controlsRow}>
        <Pressable
          style={styles.tookItButton}
          onPress={() => onRecord('taken')}
          accessibilityRole="button"
          accessibilityLabel={t('acknowledge.iTookIt')}
        >
          <Check size={40} color={COLORS.surface} />
          <AppText weight="bold" style={styles.tookItText}>
            {t('acknowledge.iTookIt')}
          </AppText>
        </Pressable>
        <Pressable
          style={styles.skippedItButton}
          onPress={() => onRecord('skipped')}
          accessibilityRole="button"
          accessibilityLabel={t('acknowledge.iSkippedIt')}
        >
          <X size={40} color={COLORS.textMuted} />
          <AppText weight="bold" style={styles.skippedItText}>
            {t('acknowledge.iSkippedIt')}
          </AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    width: TOUCH.resident,
    height: TOUCH.resident,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACE.sm,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.xl,
  },
  drugName: {
    fontSize: 36,
    lineHeight: 50,
    color: COLORS.primaryDark,
    textAlign: 'center',
  },
  dose: {
    marginTop: SPACE.sm,
    fontSize: 28,
    lineHeight: 39,
    color: COLORS.textSecond,
    textAlign: 'center',
  },
  scheduledFor: {
    marginTop: SPACE.md,
    fontSize: TYPE.residentMin,
    lineHeight: 31,
    color: COLORS.textSecond,
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    padding: SPACE.sm,
    paddingBottom: SPACE.lg,
  },
  tookItButton: {
    flex: 1,
    minHeight: 110,
    margin: SPACE.xs,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.xs,
  },
  tookItText: {
    fontSize: TYPE.residentMin,
    lineHeight: 31,
    color: COLORS.surface,
    textAlign: 'center',
  },
  skippedItButton: {
    flex: 1,
    minHeight: 110,
    margin: SPACE.xs,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.xs,
  },
  skippedItText: {
    fontSize: TYPE.residentMin,
    lineHeight: 31,
    color: COLORS.textSecond,
    textAlign: 'center',
  },
  recordedCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.xl,
  },
  recordedCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE.lg,
  },
  recordedText: {
    fontSize: 30,
    lineHeight: 42,
    color: COLORS.text,
    textAlign: 'center',
  },
})
