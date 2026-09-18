import { initWhisper, WhisperContext } from 'whisper.rn'
import RNFS from 'react-native-fs'
import { TRANSCRIPTION_LANGUAGE, VOCABULARY } from '../constants/config'

let ctx: WhisperContext | null = null
let initPromise: Promise<WhisperContext> | null = null

function stripFileScheme(path: string): string {
  return path.startsWith('file://') ? path.slice(7) : path
}

// Load once and keep the context. Loading costs one to three seconds and
// must not be repeated per note. Call this once when a carer signs in (there
// is no sign-in yet, so CarerNavigator calls it on mount instead) so the
// model is already loaded before the first recording.
export async function initTranscription(): Promise<WhisperContext> {
  if (ctx) return ctx
  if (!initPromise) {
    initPromise = initWhisper({
      filePath: require('../../models/ggml-base-q5_1.bin'),
    })
  }
  ctx = await initPromise
  return ctx
}

export async function transcribe(path: string): Promise<string | null> {
  try {
    const whisper = await initTranscription()
    const { promise } = whisper.transcribe(path, {
      language: TRANSCRIPTION_LANGUAGE,
      prompt: VOCABULARY,
      translate: false,
      maxThreads: 4,
    })
    const { result } = await promise
    return result?.trim() || null
  } catch (e) {
    console.error('Transcription failed', e)
    return null
  } finally {
    // Audio never leaves the device and must not persist on it either.
    // Delete unconditionally, whether transcription succeeded or failed.
    try {
      await RNFS.unlink(stripFileScheme(path))
    } catch {
      // Already gone, or never existed — nothing to clean up.
    }
  }
}
