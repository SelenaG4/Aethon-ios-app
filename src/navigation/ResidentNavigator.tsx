import React, { useEffect } from 'react'
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import notifee, { EventType } from '@notifee/react-native'
import { getMedications } from '../lib/data'
import { scheduleReminders, setupNotifications } from '../lib/notifications'
import { AcknowledgeScreen, ResidentHomeScreen } from '../screens/resident'

type Props = {
  residentId: string
  onSwitchView: () => void
}

// Grows as later increments (10.5) add stack screens (assistance
// confirmation). No tabs, menu or drawer here — the resident app is a
// single screen per CLAUDE.md.
export type ResidentStackParamList = {
  Home: undefined
  Acknowledge: { medicationId: string }
}

const Stack = createStackNavigator<ResidentStackParamList>()
const navigationRef = createNavigationContainerRef<ResidentStackParamList>()

// A notification can be pressed before the navigator has finished its first
// render (e.g. the app was launched from a killed state by the tap itself),
// so a pending id is held here and flushed from NavigationContainer's
// onReady instead of being dropped.
let pendingMedicationId: string | null = null

function openAcknowledgementFor(medicationId: unknown) {
  if (typeof medicationId !== 'string') return
  if (navigationRef.isReady()) {
    navigationRef.navigate('Acknowledge', { medicationId })
  } else {
    pendingMedicationId = medicationId
  }
}

export default function ResidentNavigator({ residentId, onSwitchView }: Props) {
  // There is no sign-in yet; this is the closest equivalent to "when a
  // resident signs in" — schedule once per resident session, matching how
  // CarerNavigator starts transcription on mount.
  useEffect(() => {
    setupNotifications()
      .then(() => getMedications(residentId))
      .then((medications) => scheduleReminders(medications.filter((m) => m.active)))
      .catch(() => {
        // A denied permission or scheduling failure shouldn't block the
        // resident app — reminders just won't fire.
      })
  }, [residentId])

  // Tapping a medication reminder opens the acknowledgement screen
  // directly — whether the app was already running (foreground event) or
  // was launched by the tap itself (initial notification).
  useEffect(() => {
    notifee.getInitialNotification().then((initial) => {
      if (initial?.notification.data?.type === 'medication') {
        openAcknowledgementFor(initial.notification.data.medicationId)
      }
    })
    return notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification?.data?.type === 'medication') {
        openAcknowledgementFor(detail.notification.data.medicationId)
      }
    })
  }, [])

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        if (pendingMedicationId) {
          navigationRef.navigate('Acknowledge', { medicationId: pendingMedicationId })
          pendingMedicationId = null
        }
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home">
          {() => <ResidentHomeScreen residentId={residentId} onSwitchView={onSwitchView} />}
        </Stack.Screen>
        <Stack.Screen name="Acknowledge" component={AcknowledgeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
