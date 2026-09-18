import React, { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { ArrowLeft, Check, X } from 'lucide-react-native'
import { AppText, ErrorView, LoadingView } from '../../components'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../../constants/theme'
import { acknowledgeMedication, getMedication, getResident } from '../../lib/data'
import type { Medication } from '../../lib/mockData'
import type { ResidentStackParamList } from '../../navigation/ResidentNavigator'

type AcknowledgeRoute = RouteProp<ResidentStackParamList, 'Acknowledge'>

function formatScheduledTime(time: string): string {
  const [hourText, minuteText] = time.split(':')
  const hour = Number(hourText)
  const period = hour >= 12 ? 'pm' : 'am'
  const hour12 = ((hour + 11) % 12) + 1
  return `${hour12}:${minuteText} ${period}`
}

export default function AcknowledgeScreen() {
  const navigation = useNavigation<NavigationProp<ResidentStackParamList>>()
  const route = useRoute<AcknowledgeRoute>()
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
      setTimeout(() => navigation.goBack(), 1500)
    },
    [medication, residentName, navigation]
  )

  if (loadError) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ErrorView message="Could not load this medication" onRetry={load} isResident />
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
            Recorded
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
        accessibilityLabel="Back"
      >
        <ArrowLeft size={28} color={COLORS.text} />
      </Pressable>

      <View style={styles.content}>
        <AppText weight="black" style={styles.drugName}>
          {medication.name}
        </AppText>
        <AppText style={styles.dose}>{medication.dosage}</AppText>
        <AppText style={styles.scheduledFor}>
          Scheduled for {formatScheduledTime(medication.scheduled_time)}
        </AppText>
      </View>

      <View style={styles.controlsRow}>
        <Pressable
          style={styles.tookItButton}
          onPress={() => onRecord('taken')}
          accessibilityRole="button"
          accessibilityLabel="I took it"
        >
          <Check size={40} color={COLORS.surface} />
          <AppText weight="bold" style={styles.tookItText}>
            I took it
          </AppText>
        </Pressable>
        <Pressable
          style={styles.skippedItButton}
          onPress={() => onRecord('skipped')}
          accessibilityRole="button"
          accessibilityLabel="I skipped it"
        >
          <X size={40} color={COLORS.textMuted} />
          <AppText weight="bold" style={styles.skippedItText}>
            I skipped it
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
    color: COLORS.primaryDark,
    textAlign: 'center',
  },
  dose: {
    marginTop: SPACE.sm,
    fontSize: 28,
    color: COLORS.textSecond,
  },
  scheduledFor: {
    marginTop: SPACE.md,
    fontSize: TYPE.residentMin,
    color: COLORS.textMuted,
  },
  controlsRow: {
    flexDirection: 'row',
    padding: SPACE.sm,
    paddingBottom: SPACE.lg,
  },
  tookItButton: {
    flex: 1,
    height: 110,
    margin: SPACE.xs,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
  },
  tookItText: {
    fontSize: TYPE.residentMin,
    color: COLORS.surface,
  },
  skippedItButton: {
    flex: 1,
    height: 110,
    margin: SPACE.xs,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
  },
  skippedItText: {
    fontSize: TYPE.residentMin,
    color: COLORS.textMuted,
  },
  recordedCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: COLORS.text,
  },
})
