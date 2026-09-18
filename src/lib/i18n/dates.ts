import type { Language } from '../data'

// Replaces the MONTHS/pad2 helpers that used to be duplicated locally in
// nearly every screen that shows a date — centralized here so every screen
// renders dates in the resident's/carer's chosen language instead of always
// English.
const MONTHS_SHORT: Record<Language, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  de: ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'],
  fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juill.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  it: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'],
}

const MONTHS_FULL: Record<Language, string[]> = {
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  de: [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ],
  fr: [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ],
  it: [
    'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
    'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
  ],
}

const WEEKDAYS_FULL: Record<Language, string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  fr: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  it: ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'],
}

export function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

// "5 Jan" / "5. Jan." / "5 janv." / "5 gen"
export function formatShortDayMonth(iso: string, language: Language): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS_SHORT[language][d.getMonth()]}`
}

// "5 Jan, 14:30"
export function formatShortDateTime(iso: string, language: Language): string {
  return `${formatShortDayMonth(iso, language)}, ${formatTime(iso)}`
}

// "5 January 1938"
export function formatLongDate(iso: string, language: Language): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS_FULL[language][d.getMonth()]} ${d.getFullYear()}`
}

// "5 Jan 1938" — short month, with year (client date-of-birth, baseline dates)
export function formatShortYearDate(iso: string, language: Language): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS_SHORT[language][d.getMonth()]} ${d.getFullYear()}`
}

// "January 2026"
export function formatMonthYear(iso: string, language: Language): string {
  const d = new Date(iso)
  return `${MONTHS_FULL[language][d.getMonth()]} ${d.getFullYear()}`
}

// "Wednesday, 17 September 2026"
export function formatFullDate(date: Date, language: Language): string {
  return `${WEEKDAYS_FULL[language][date.getDay()]}, ${date.getDate()} ${MONTHS_FULL[language][date.getMonth()]} ${date.getFullYear()}`
}

// "Wednesday, 17 Sep" — no year, short month (ClientsScreen's header date)
export function formatWeekdayShortDate(date: Date, language: Language): string {
  return `${WEEKDAYS_FULL[language][date.getDay()]}, ${date.getDate()} ${MONTHS_SHORT[language][date.getMonth()]}`
}
