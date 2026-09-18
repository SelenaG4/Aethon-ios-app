import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { TriangleAlert } from 'lucide-react-native'
import { AppText } from '../../components'
import { EMERGENCY_NUMBER } from '../../constants/config'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../../constants/theme'
import { isNightHour, pickAssistanceContact, requestAssistance } from '../../lib/assistance'
import { useTranslation } from '../../lib/i18n'
import type { EmergencyContact } from '../../lib/mockData'

type Props = {
  visible: boolean
  residentId: string
  contacts: EmergencyContact[]
  onClose: () => void
}

type Phase = 'confirm' | 'result'

export default function AssistanceModal({ visible, residentId, contacts, onClose }: Props) {
  const { t } = useTranslation()
  const [phase, setPhase] = useState<Phase>('confirm')
  const [resultMessage, setResultMessage] = useState('')

  const contact = useMemo(() => pickAssistanceContact(contacts), [contacts])
  const night = isNightHour(new Date().getHours())

  useEffect(() => {
    if (visible) {
      setPhase('confirm')
      setResultMessage('')
    }
  }, [visible])

  const onConfirm = useCallback(async () => {
    if (!contact) return
    const outcome = await requestAssistance(residentId, contact)
    setResultMessage(
      outcome.delivered
        ? t('assistance.delivered', { name: outcome.contactName })
        : t('assistance.notDelivered', { name: outcome.contactName, number: EMERGENCY_NUMBER })
    )
    setPhase('result')
  }, [residentId, contact, t])

  if (!contact) return null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {phase === 'confirm' ? (
            <>
              <TriangleAlert size={56} color={COLORS.danger} />
              <AppText weight="bold" style={styles.title}>
                {t('assistance.title')}
              </AppText>
              <AppText style={styles.contactLine}>
                {t(night ? 'assistance.contactLineNight' : 'assistance.contactLineDay', {
                  name: contact.name,
                })}
              </AppText>
              <AppText style={styles.smallPrint}>
                {t('assistance.smallPrint', { number: EMERGENCY_NUMBER })}
              </AppText>
              <Pressable
                style={styles.helpButton}
                onPress={onConfirm}
                accessibilityRole="button"
                accessibilityLabel={t('assistance.yesINeedHelp')}
              >
                <AppText weight="bold" style={styles.helpButtonText}>
                  {t('assistance.yesINeedHelp')}
                </AppText>
              </Pressable>
              <Pressable
                style={styles.fineButton}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t('assistance.noIAmFine')}
              >
                <AppText weight="bold" style={styles.fineButtonText}>
                  {t('assistance.noIAmFine')}
                </AppText>
              </Pressable>
            </>
          ) : (
            <>
              <AppText weight="bold" style={styles.resultText}>
                {resultMessage}
              </AppText>
              <Pressable
                style={styles.helpButton}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t('assistance.close')}
              >
                <AppText weight="bold" style={styles.helpButtonText}>
                  {t('assistance.close')}
                </AppText>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '90%',
    borderRadius: 20,
    padding: 28,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  title: {
    marginTop: SPACE.md,
    fontSize: 28,
    lineHeight: 39,
    color: COLORS.text,
    textAlign: 'center',
  },
  contactLine: {
    marginTop: SPACE.md,
    fontSize: TYPE.residentMin,
    lineHeight: 31,
    color: COLORS.textSecond,
    textAlign: 'center',
  },
  smallPrint: {
    marginTop: SPACE.md,
    fontSize: TYPE.residentMin,
    lineHeight: 31,
    color: COLORS.textSecond,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  helpButton: {
    width: '100%',
    minHeight: TOUCH.resident,
    marginTop: SPACE.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
  },
  helpButtonText: {
    fontSize: 24,
    lineHeight: 34,
    color: COLORS.surface,
    textAlign: 'center',
  },
  fineButton: {
    width: '100%',
    minHeight: TOUCH.resident,
    marginTop: SPACE.md,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
  },
  fineButtonText: {
    fontSize: TYPE.residentMin,
    lineHeight: 31,
    color: COLORS.textSecond,
    textAlign: 'center',
  },
  resultText: {
    fontSize: 24,
    lineHeight: 34,
    color: COLORS.text,
    textAlign: 'center',
  },
})
