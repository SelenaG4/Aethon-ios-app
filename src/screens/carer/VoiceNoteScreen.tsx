import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Pressable, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import Sound, { AudioSet, AVLinearPCMBitDepthKeyIOSType } from 'react-native-nitro-sound'
import RNFS from 'react-native-fs'
import { ArrowLeft, Check, Mic, Square } from 'lucide-react-native'
import { AppText } from '../../components'
import { COLORS, SPACE, TOUCH, TYPE } from '../../constants/theme'
import { addVisitNote, completeVisitNoteTranscription, CURRENT_CARER } from '../../lib/data'
import { useTranslation } from '../../lib/i18n'
import { transcribe } from '../../lib/transcription'
import type { CarerStackParamList } from '../../navigation/CarerNavigator'

type VoiceNoteRoute = RouteProp<CarerStackParamList, 'VoiceNote'>

type RecordingState = 'idle' | 'recording' | 'saving'

const MAX_RECORDING_SECONDS = 120

// whisper.rn accepts WAV; 16 kHz mono keeps the file small and is what the
// bundled model expects.
const AUDIO_SET: AudioSet = {
  AVFormatIDKeyIOS: 'lpcm',
  AVSampleRateKeyIOS: 16000,
  AVNumberOfChannelsKeyIOS: 1,
  AVLinearPCMBitDepthKeyIOS: AVLinearPCMBitDepthKeyIOSType.bit16,
  AVLinearPCMIsBigEndianKeyIOS: false,
  AVLinearPCMIsFloatKeyIOS: false,
  AudioSamplingRate: 16000,
  AudioChannels: 1,
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`
}

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${pad2(secs)}`
}

export default function VoiceNoteScreen() {
  const navigation = useNavigation()
  const route = useRoute<VoiceNoteRoute>()
  const { t } = useTranslation()
  const { clientId, clientName } = route.params

  const [state, setState] = useState<RecordingState>('idle')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pulse = useRef(new Animated.Value(1)).current
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null)
  const isFinishingRef = useRef(false)

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const stopPulse = useCallback(() => {
    pulseLoop.current?.stop()
    pulseLoop.current = null
    pulse.setValue(1)
  }, [pulse])

  useEffect(() => stopTimer, [stopTimer])

  const finishRecording = useCallback(async () => {
    if (isFinishingRef.current) return
    isFinishingRef.current = true
    stopTimer()
    stopPulse()
    const path = await Sound.stopRecorder()
    Sound.removeRecordBackListener()
    console.log('Audio recorded at', path)

    const note = await addVisitNote({
      resident_id: clientId,
      // Set during note review (5.4) — optional, so unset until then.
      visit_type: null,
      tasks_completed: '',
      is_escalation: false,
      carer_name: CURRENT_CARER.name,
      raw_transcript: null,
      transcription_status: 'pending',
      transcript: null,
    })

    setState('saving') // the carer may now leave

    // Deliberately not awaited: on-device transcription is slower than a
    // network call, so the note is already saved and the carer can move on.
    // The row fills in via the subscribe/notify emitter in data.ts once
    // transcription finishes, whether or not this screen is still mounted.
    transcribe(path).then((text) => completeVisitNoteTranscription(note.id, text))

    setTimeout(() => navigation.goBack(), 1200)
  }, [clientId, navigation, stopPulse, stopTimer])

  const startRecording = useCallback(async () => {
    setError(null)
    isFinishingRef.current = false
    try {
      // nitro-sound only picks a writable directory for you when the uri
      // argument is omitted entirely — a bare filename resolves relative to
      // an unwritable working directory and fails. Build an absolute path
      // in the cache dir ourselves (cache, not documents, since this file
      // is deleted right after transcription and never meant to persist).
      const path = `${RNFS.CachesDirectoryPath}/aethon-note-${Date.now()}.wav`
      await Sound.startRecorder(path, AUDIO_SET)
      setElapsedSeconds(0)
      setState('recording')

      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.12, duration: 400, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      )
      pulseLoop.current.start()

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1
          if (next >= MAX_RECORDING_SECONDS) {
            finishRecording()
          }
          return next
        })
      }, 1000)
    } catch {
      setError(t('voiceNote.couldNotStart'))
    }
  }, [finishRecording, pulse, t])

  const onCenterPress = useCallback(() => {
    if (state === 'idle') {
      startRecording()
    } else if (state === 'recording') {
      finishRecording()
    }
  }, [state, startRecording, finishRecording])

  const onBack = useCallback(async () => {
    if (state === 'recording') {
      stopTimer()
      stopPulse()
      try {
        await Sound.stopRecorder()
        Sound.removeRecordBackListener()
      } catch {
        // Nothing to clean up if the recorder was never running.
      }
    }
    navigation.goBack()
  }, [state, navigation, stopPulse, stopTimer])

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        {state !== 'saving' ? (
          <Pressable
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <ArrowLeft size={22} color={COLORS.surface} />
          </Pressable>
        ) : null}
        <AppText weight="bold" style={styles.headerTitle} numberOfLines={1}>
          {clientName}
        </AppText>
        <AppText style={styles.headerSubtitle}>{t('voiceNote.transcribedOnDevice')}</AppText>
      </View>

      <View style={styles.centre}>
        {state === 'idle' ? (
          <>
            <Pressable
              onPress={onCenterPress}
              accessibilityRole="button"
              accessibilityLabel={t('voiceNote.startRecording')}
            >
              <View style={styles.circleIdle}>
                <Mic size={56} color={COLORS.surface} />
              </View>
            </Pressable>
            <AppText weight="semibold" style={styles.idleLabel}>
              {t('voiceNote.tapToRecord')}
            </AppText>
            <AppText style={styles.idleHint}>{t('voiceNote.idleHint')}</AppText>
            {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
          </>
        ) : null}

        {state === 'recording' ? (
          <>
            <Pressable
              onPress={onCenterPress}
              accessibilityRole="button"
              accessibilityLabel={t('voiceNote.stopRecording')}
            >
              <Animated.View style={[styles.circleRecording, { transform: [{ scale: pulse }] }]}>
                <Square size={48} color={COLORS.surface} />
              </Animated.View>
            </Pressable>
            <AppText weight="bold" style={styles.elapsedText}>
              {formatElapsed(elapsedSeconds)}
            </AppText>
            <AppText style={styles.recordingHint}>{t('voiceNote.tapToStop')}</AppText>
          </>
        ) : null}

        {state === 'saving' ? (
          <>
            <View style={styles.circleSaved}>
              <Check size={48} color={COLORS.primaryDark} />
            </View>
            <AppText weight="bold" style={styles.savedText}>
              {t('voiceNote.noteSaved')}
            </AppText>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },
  header: {
    alignItems: 'center',
    paddingTop: SPACE.sm,
  },
  backButton: {
    position: 'absolute',
    left: 8,
    top: SPACE.sm,
    width: TOUCH.standard,
    height: TOUCH.standard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: TYPE.h3,
    color: COLORS.surface,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: TYPE.caption,
    color: COLORS.surface,
    opacity: 0.5,
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleIdle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleRecording: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleSaved: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleLabel: {
    marginTop: SPACE.lg,
    fontSize: TYPE.h2,
    color: COLORS.surface,
  },
  idleHint: {
    marginTop: SPACE.xs,
    fontSize: TYPE.small,
    color: COLORS.surface,
    opacity: 0.6,
  },
  errorText: {
    marginTop: SPACE.md,
    fontSize: TYPE.small,
    color: COLORS.dangerLight,
  },
  elapsedText: {
    marginTop: SPACE.lg,
    fontSize: 32,
    color: COLORS.surface,
  },
  recordingHint: {
    marginTop: SPACE.xs,
    fontSize: 16,
    color: COLORS.surface,
    opacity: 0.7,
  },
  savedText: {
    marginTop: SPACE.lg,
    fontSize: TYPE.h1,
    color: COLORS.surface,
  },
})
