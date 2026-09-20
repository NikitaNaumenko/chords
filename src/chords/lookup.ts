import { Chord } from 'chordsheetjs'

export interface ChordPosition {
  /** Лады по струнам от низкой E к высокой; -1 — глушёная, 0 — открытая, иначе лад относительно baseFret */
  frets: number[]
  fingers: number[]
  baseFret: number
  /** Относительные лады, на которых стоит баррэ */
  barres: number[]
  capo?: boolean
  midi: number[]
}

interface DbChord {
  key: string
  suffix: string
  positions: ChordPosition[]
}

interface GuitarDb {
  main: { strings: number; fretsOnChord: number; name: string; numberOfChords: number }
  keys: string[]
  suffixes: string[]
  chords: Record<string, DbChord[]>
}

export interface ChordLookup {
  /** Имя как написано в песне */
  name: string
  root: string
  suffix: string
  bass: string | null
  positions: ChordPosition[]
}

let dbPromise: Promise<GuitarDb> | null = null
let dbCache: GuitarDb | null = null

/** База аккордов (240 КБ) подгружается при первом обращении. */
export function loadGuitarDb(): Promise<GuitarDb> {
  dbPromise ??= import('@tombatossals/chords-db/lib/guitar.json').then((m) => {
    dbCache = (m.default ?? m) as unknown as GuitarDb
    return dbCache
  })
  return dbPromise
}

export const guitarDbSync = () => dbCache

// Тоники, как их называет chords-db: диезы для C#/F#, бемоли для Eb/Ab/Bb.
const ROOT_MAP: Record<string, string> = {
  Db: 'C#',
  'D#': 'Eb',
  Gb: 'F#',
  'G#': 'Ab',
  'A#': 'Bb',
  Cb: 'B',
  'B#': 'C',
  Fb: 'E',
  'E#': 'F',
  H: 'B',
}

// Басовые ноты в слэш-аккордах chords-db пишет иначе: диезы везде, кроме Bb.
const BASS_MAP: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  'A#': 'Bb',
  Cb: 'B',
  'B#': 'C',
  Fb: 'E',
  'E#': 'F',
  H: 'B',
}

const SUFFIX_MAP: Record<string, string> = {
  '': 'major',
  maj: 'major',
  M: 'major',
  major: 'major',
  m: 'minor',
  min: 'minor',
  '-': 'minor',
  minor: 'minor',
  '+': 'aug',
  aug: 'aug',
  '°': 'dim',
  o: 'dim',
  dim: 'dim',
  '°7': 'dim7',
  o7: 'dim7',
  dim7: 'dim7',
  ø: 'm7b5',
  ø7: 'm7b5',
  m7b5: 'm7b5',
  'm7-5': 'm7b5',
  maj7: 'maj7',
  M7: 'maj7',
  ma7: 'maj7',
  Δ: 'maj7',
  Δ7: 'maj7',
  maj9: 'maj9',
  M9: 'maj9',
  maj11: 'maj11',
  maj13: 'maj13',
  sus: 'sus4',
  sus4: 'sus4',
  '4': 'sus4',
  sus2: 'sus2',
  '2': 'sus2',
  '7sus4': '7sus4',
  '7sus': '7sus4',
  mmaj7: 'mmaj7',
  mM7: 'mmaj7',
  'm(maj7)': 'mmaj7',
  minmaj7: 'mmaj7',
  m7: 'm7',
  min7: 'm7',
  '-7': 'm7',
  m6: 'm6',
  m9: 'm9',
  m11: 'm11',
  m69: 'm69',
  'm6/9': 'm69',
  madd9: 'madd9',
  '6': '6',
  '69': '69',
  '6/9': '69',
  '7': '7',
  '9': '9',
  '11': '11',
  '13': '13',
  add9: 'add9',
  '7b9': '7b9',
  '7#9': '7#9',
  '7b5': '7b5',
  '7-5': '7b5',
  '9b5': '9b5',
  aug7: 'aug7',
  '7#5': 'aug7',
  '+7': 'aug7',
  aug9: 'aug9',
  '9#11': '9#11',
  maj7b5: 'maj7b5',
  'maj7#5': 'maj7#5',
  alt: 'alt',
}

const unicodeAccidentals = (s: string) => s.replace(/♯/g, '#').replace(/♭/g, 'b')

export function normalizeRoot(note: string): string | null {
  const n = unicodeAccidentals(note.trim())
  const mapped = ROOT_MAP[n] ?? n
  return /^[A-G](#|b)?$/.test(mapped) ? mapped : null
}

export function normalizeSuffix(suffix: string | null): string | null {
  const raw = unicodeAccidentals((suffix ?? '').trim()).replace(/[()]/g, '')
  return SUFFIX_MAP[raw] ?? null
}

/** Разбирает имя аккорда и находит аппликатуры. `null`, если аккорд не распознан или его нет в базе. */
export function lookupChord(db: GuitarDb, name: string): ChordLookup | null {
  const chord = Chord.parse(name.trim())
  if (!chord?.root) return null
  const root = normalizeRoot(chord.root.note)
  const suffix = normalizeSuffix(chord.suffix)
  if (!root || !suffix) return null
  const bass = chord.bass ? (BASS_MAP[unicodeAccidentals(chord.bass.note)] ?? unicodeAccidentals(chord.bass.note)) : null

  const list = db.chords[root.replace('#', 'sharp')]
  if (!list) return null

  const find = (sfx: string) => list.find((c) => c.suffix === sfx)
  let entry: DbChord | undefined
  if (bass) {
    const slashSuffix = suffix === 'major' ? `/${bass}` : suffix === 'minor' ? `m/${bass}` : null
    if (slashSuffix) entry = find(slashSuffix)
  }
  entry ??= find(suffix)
  if (!entry) return null
  return { name, root, suffix, bass, positions: entry.positions }
}

/** Все аккорды базы для справочника: тоника × суффикс. */
export function listAllChords(db: GuitarDb): { root: string; suffix: string; name: string }[] {
  const out: { root: string; suffix: string; name: string }[] = []
  for (const key of db.keys) {
    for (const c of db.chords[key.replace('#', 'sharp')] ?? []) {
      out.push({ root: key, suffix: c.suffix, name: displayName(key, c.suffix) })
    }
  }
  return out
}

/** Имя аккорда для показа из пары chords-db (root, suffix). */
export function displayName(root: string, suffix: string): string {
  if (suffix === 'major') return root
  if (suffix === 'minor') return root + 'm'
  return root + suffix
}
