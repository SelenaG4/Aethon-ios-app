// whisper.rn's package.json `exports` map only declares subpath patterns
// (e.g. "./realtime-transcription"), not a root "." entry, so TypeScript's
// bundler resolution can't find types for the root `from 'whisper.rn'`
// import the library's own README documents (Metro resolves it at runtime
// fine via the "react-native"/"main" fields, which aren't exports-gated).
// This declares just the surface this app actually calls, mirroring
// node_modules/whisper.rn/lib/typescript/index.d.ts.
declare module 'whisper.rn' {
  export type TranscribeResult = {
    result: string
    language: string
    segments: Array<{ text: string; t0: number; t1: number }>
    isAborted: boolean
  }

  export type TranscribeFileOptions = {
    language?: string
    translate?: boolean
    maxThreads?: number
    prompt?: string
  }

  export class WhisperContext {
    transcribe(
      filePathOrBase64: string | number,
      options?: TranscribeFileOptions
    ): {
      stop: () => Promise<void>
      promise: Promise<TranscribeResult>
    }
  }

  export type ContextOptions = {
    filePath: string | number
  }

  export function initWhisper(options: ContextOptions): Promise<WhisperContext>
}
