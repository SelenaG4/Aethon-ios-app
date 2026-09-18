import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { TriangleAlert } from 'lucide-react-native'
import { AppText } from '../../components'
import { EMERGENCY_NUMBER } from '../../constants/config'
import { COLORS, RADIUS, SPACE, TOUCH, TYPE } from '../../constants/theme'
import { isNightHour, pickAssistanceContact, requestAssistance } from '../../lib/assistance'
import type { EmergencyContact } from '../../lib/mockData'

type Props = {
  visible: boolean
  residentId: string
  contacts: EmergencyContact[]
  onClose: () => void
}

type Phase = 'confirm' | 'result'

export default function AssistanceModal({ visible, residentId, contacts, onClose }: Props) {
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
        ? `We have contacted ${outcome.contactName}.`
        : `We could not reach ${outcome.contactName} through the app. Please telephone them, or call ${EMERGENCY_NUMBER} in an emergency.`
    )
    setPhase('result')
  }, [residentId, contact])

  if (!contact) return null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {phase === 'confirm' ? (
            <>
              <TriangleAlert size={56} color={COLORS.danger} />
              <AppText weight="bold" style={styles.title}>
                Send a request for help?
              </AppText>
              <AppText style={styles.contactLine}>
                {night ? 'It is night time. ' : ''}
                We will contact {contact.name} now.
              </AppText>
              <AppText style={styles.smallPrint}>
                This is not an emergency service. In a medical emergency call {EMERGENCY_NUMBER}.
              </AppText>
              <Pressable
                style={styles.helpButton}
                onPress={onConfirm}
                accessibilityRole="button"
                accessibilityLabel="Yes, I need help"
              >
                <AppText weight="bold" style={styles.helpButtonText}>
                  Yes, I need help
                </AppText>
              </Pressable>
              <Pressable
                style={styles.fineButton}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="No, I am fine"
              >
                <AppText weight="bold" style={styles.fineButtonText}>
                  No, I am fine
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
                accessibilityLabel="Close"
              >
                <AppText weight="bold" style={styles.helpButtonText}>
                  Close
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
    color: COLORS.text,
    textAlign: 'center',
  },
  contactLine: {
    marginTop: SPACE.md,
    fontSize: TYPE.residentMin,
    color: COLORS.textSecond,
    textAlign: 'center',
  },
  smallPrint: {
    marginTop: SPACE.md,
    fontSize: TYPE.residentMin,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  helpButton: {
    width: '100%',
    height: TOUCH.resident,
    marginTop: SPACE.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButtonText: {
    fontSize: 24,
    color: COLORS.surface,
  },
  fineButton: {
    width: '100%',
    height: TOUCH.resident,
    marginTop: SPACE.md,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fineButtonText: {
    fontSize: TYPE.residentMin,
    color: COLORS.textMuted,
  },
  resultText: {
    fontSize: 24,
    color: COLORS.text,
    textAlign: 'center',
  },
})
