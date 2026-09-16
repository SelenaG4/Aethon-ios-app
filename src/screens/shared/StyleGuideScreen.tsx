import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2, Info, Phone, Pill } from 'lucide-react-native'
import { ActionTile, Card, GradientAvatar, ScreenHeader, SectionTitle, StatusPill } from '../../components'
import { COLORS, SPACE, TYPE, WEIGHT } from '../../constants/theme'

type Props = {
  onBack: () => void
}

export default function StyleGuideScreen({ onBack }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={20} color={COLORS.text} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>

        <ScreenHeader
          title="Style guide"
          subtitle="One example of every shared component"
        />

        <SectionTitle>Card</SectionTitle>
        <Card onPress={() => {}} style={styles.block}>
          <Text style={styles.cardText}>
            Cards hold grouped content and can optionally respond to a press.
          </Text>
        </Card>

        <SectionTitle>Gradient avatar</SectionTitle>
        <View style={[styles.block, styles.row]}>
          <GradientAvatar name="Test Carer" />
        </View>

        <SectionTitle>Status pill</SectionTitle>
        <View style={[styles.block, styles.row]}>
          <StatusPill variant="success" label="On track" icon={CheckCircle2} />
          <StatusPill variant="info" label="Info" icon={Info} />
          <StatusPill variant="warning" label="Attention" icon={AlertTriangle} />
          <StatusPill variant="danger" label="Overdue" icon={AlertCircle} />
        </View>

        <SectionTitle>Action tile</SectionTitle>
        <View style={[styles.block, styles.grid]}>
          <ActionTile variant="info" label="Call family" icon={Phone} onPress={() => {}} />
          <ActionTile variant="success" label="Medications" icon={Pill} onPress={() => {}} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: SPACE.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    marginTop: SPACE.md,
    marginBottom: SPACE.md,
  },
  backLabel: {
    fontSize: TYPE.body,
    fontWeight: WEIGHT.semibold,
    color: COLORS.text,
  },
  block: {
    marginBottom: SPACE.xl,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardText: {
    fontSize: TYPE.body,
    color: COLORS.textSecond,
  },
})
