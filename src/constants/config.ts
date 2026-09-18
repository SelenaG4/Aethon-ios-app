// Ask before changing TRANSCRIPTION_LANGUAGE or VOCABULARY — both bias
// whisper.rn's output and default to exactly what docs/BUILD_GUIDE.txt (5.2)
// specifies.
export const TRANSCRIPTION_LANGUAGE = 'de'

export const VOCABULARY =
  'Pflegedokumentation: Blutdruck, Puls, Medikamente, Mobilitaet, ' +
  'Schmerzen, Appetit, Koerperpflege, Spitex, Ramipril, Metformin, ' +
  'Aspirin, Klientin, Klient'

// Used in every required sentence that mentions the emergency number
// (docs/BUILD_GUIDE.txt, 10.1 onward).
export const EMERGENCY_NUMBER = '144'
