import React, { useCallback, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { ClipboardCheck, FileText, User, Users } from 'lucide-react-native'
import { AppText, Badge } from '../components'
import { COLORS, TYPE } from '../constants/theme'
import { getUnreviewedVisitNotesCount, subscribe } from '../lib/data'
import { useTranslation } from '../lib/i18n'
import { initTranscription } from '../lib/transcription'
import {
  BaselineScreen,
  CareStageModal,
  ClientProfileScreen,
  ClientsScreen,
  EscalationScreen,
  HandoverScreen,
  NoteReviewScreen,
  ProfileScreen,
  ToCheckScreen,
  VoiceNoteScreen,
} from '../screens/carer'
import { ObservationScreen } from '../screens/shared'

type Props = {
  onSwitchView: () => void
}

// The bottom tab navigator nested at the "Tabs" stack route. Screens inside
// it (e.g. ClientsScreen) navigate to a sibling tab directly by name; to
// reach a screen in the parent CarerStackParamList they use the same name
// and React Navigation bubbles up automatically.
export type CarerTabParamList = {
  Clients: undefined
  ToCheck: undefined
  Handover: undefined
  Profile: undefined
}

// Shared with the screens that navigate within this stack (ClientsScreen
// pushes ClientProfile, ClientProfile pushes Baseline, CareStageModal and
// VoiceNote, ToCheck/ClientProfile push NoteReview, etc). Grows as more
// increments add stack screens (escalation).
export type CarerStackParamList = {
  Tabs: undefined
  ClientProfile: {
    clientId: string
    clientName: string
    savedBaseline?: boolean
    savedEscalation?: boolean
    initialTab?: 'profile' | 'notes' | 'history'
  }
  Baseline: { clientId: string; clientName: string }
  CareStageModal: { clientId: string; clientName: string }
  VoiceNote: { clientId: string; clientName: string }
  NoteReview: { noteId: string }
  Observation: { clientId: string; clientName: string; mode: 'carer' | 'resident' | 'family' }
  Escalation: { clientId: string; clientName: string; physicianName: string; physicianEmail: string }
}

type IconProps = {
  color: string
  size: number
}

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator<CarerStackParamList>()

const styles = StyleSheet.create({
  label: {
    fontSize: TYPE.small,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
  },
})

function TabLabel({ color, text }: { color: string; text: string }) {
  return (
    <AppText weight="bold" style={[styles.label, { color }]}>
      {text}
    </AppText>
  )
}

const renderClientsIcon = ({ color, size }: IconProps) => <Users color={color} size={size} />
const renderHandoverIcon = ({ color, size }: IconProps) => <FileText color={color} size={size} />
const renderProfileIcon = ({ color, size }: IconProps) => <User color={color} size={size} />

function CarerTabs({ onSwitchView }: Props) {
  const { t } = useTranslation()
  const [unreviewedCount, setUnreviewedCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      getUnreviewedVisitNotesCount().then((count) => {
        if (!cancelled) setUnreviewedCount(count)
      })
    }
    load()
    const unsubscribe = subscribe(load)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const renderToCheckIcon = useCallback(
    ({ color, size }: IconProps) => (
      <View>
        <ClipboardCheck color={color} size={size} />
        <Badge count={unreviewedCount} style={styles.badge} />
      </View>
    ),
    [unreviewedCount]
  )

  const renderClientsLabel = useCallback(
    ({ color }: { color: string }) => <TabLabel color={color} text={t('carerTabs.clients')} />,
    [t]
  )
  const renderToCheckLabel = useCallback(
    ({ color }: { color: string }) => <TabLabel color={color} text={t('carerTabs.toCheck')} />,
    [t]
  )
  const renderHandoverLabel = useCallback(
    ({ color }: { color: string }) => <TabLabel color={color} text={t('carerTabs.handover')} />,
    [t]
  )
  const renderProfileLabel = useCallback(
    ({ color }: { color: string }) => <TabLabel color={color} text={t('carerTabs.profile')} />,
    [t]
  )

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        },
      }}
    >
      <Tab.Screen
        name="Clients"
        component={ClientsScreen}
        options={{ tabBarIcon: renderClientsIcon, tabBarLabel: renderClientsLabel }}
      />
      <Tab.Screen
        name="ToCheck"
        component={ToCheckScreen}
        options={{ tabBarIcon: renderToCheckIcon, tabBarLabel: renderToCheckLabel }}
      />
      <Tab.Screen
        name="Handover"
        component={HandoverScreen}
        options={{ tabBarIcon: renderHandoverIcon, tabBarLabel: renderHandoverLabel }}
      />
      <Tab.Screen
        name="Profile"
        options={{ tabBarIcon: renderProfileIcon, tabBarLabel: renderProfileLabel }}
      >
        {() => <ProfileScreen onSwitchView={onSwitchView} />}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

export default function CarerNavigator({ onSwitchView }: Props) {
  // There is no sign-in yet; this is the closest equivalent to "when a
  // carer signs in" — the model loads once per carer session, in the
  // background, so it's ready before the first recording.
  useEffect(() => {
    initTranscription().catch(() => {
      // Swallowed here: transcribe() reports failure per-note via
      // transcription_status, which is what the carer actually sees.
    })
  }, [])

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs">{() => <CarerTabs onSwitchView={onSwitchView} />}</Stack.Screen>
        <Stack.Screen name="ClientProfile" component={ClientProfileScreen} />
        <Stack.Screen name="Baseline" component={BaselineScreen} />
        <Stack.Screen
          name="CareStageModal"
          component={CareStageModal}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="VoiceNote"
          component={VoiceNoteScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="NoteReview" component={NoteReviewScreen} />
        <Stack.Screen name="Observation" component={ObservationScreen} />
        <Stack.Screen name="Escalation" component={EscalationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
