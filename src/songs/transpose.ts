import { Chord, Key, type Song } from 'chordsheetjs'

// Общепринятые названия тональностей по полутонам — чтобы не получать E#7 и Cbm.
const MAJOR = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const MINOR = ['Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm']
const PC: Record<string, number> = {
  C: 0, 'B#': 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, Fb: 4, F: 5, 'E#': 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11, Cb: 11, H: 11,
}

const normNote = (n: string) => n.replace(/♯/g, '#').replace(/♭/g, 'b')

/** Тональность песни: из {key}, иначе по первому аккорду. */
export function guessKey(song: Song): string | null {
  if (song.key) return song.key
  const first = song.getChords().find(Boolean)
  if (!first) return null
  const c = Chord.parse(first)
  if (!c?.root) return null
  const minor = /^(m|min|-)(?!aj)/.test(c.suffix ?? '')
  return normNote(c.root.note) + (minor ? 'm' : '')
}

export function keyAfter(key: string, delta: number): string | null {
  const k = Key.parse(key)
  if (!k) return null
  const pc = PC[normNote(k.note)]
  if (pc == null) return null
  return (k.isMinor() ? MINOR : MAJOR)[(((pc + delta) % 12) + 12) % 12]
}

/** Транспонирует на delta полутонов, выбирая привычные диезы/бемоли под целевую тональность. */
export function transposeSong(song: Song, delta: number): Song {
  if (delta === 0) return song
  const key = guessKey(song)
  const target = key ? keyAfter(key, delta) : null
  if (!target) return song.transpose(delta)
  try {
    return (song.key ? song : song.setKey(key)).changeKey(target)
  } catch {
    return song.transpose(delta)
  }
}
