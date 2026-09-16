import React, { useCallback, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { ClipboardCheck, FileText, User, Users } from 'lucide-react-native'
import { AppText, Badge } from '../components'
import { COLORS, TYPE } from '../constants/theme'
import { getUnreviewedVisitNotesCount } from '../lib/data'
import { ClientsScreen, HandoverScreen, ProfileScreen, ToCheckScreen } from '../screens/carer'

type Props = {
  onSwitchView: () => void
}

type IconProps = {
  color: string
  size: number
}

const Tab = createBottomTabNavigator()

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

function renderLabel(text: string) {
  return ({ color }: { color: string }) => (
    <AppText weight="bold" style={[styles.label, { color }]}>
      {text}
    </AppText>
  )
}

const renderClientsLabel = renderLabel('Clients')
const renderToCheckLabel = renderLabel('To check')
const renderHandoverLabel = renderLabel('Handover')
const renderProfileLabel = renderLabel('Profile')

const renderClientsIcon = ({ color, size }: IconProps) => <Users color={color} size={size} />
const renderHandoverIcon = ({ color, size }: IconProps) => <FileText color={color} size={size} />
const renderProfileIcon = ({ color, size }: IconProps) => <User color={color} size={size} />

export default function CarerNavigator({ onSwitchView }: Props) {
  const [unreviewedCount, setUnreviewedCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    getUnreviewedVisitNotesCount().then((count) => {
      if (!cancelled) setUnreviewedCount(count)
    })
    return () => {
      cancelled = true
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

  return (
    <NavigationContainer>
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
    </NavigationContainer>
  )
}
