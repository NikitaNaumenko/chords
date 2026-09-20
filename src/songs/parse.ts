import { ChordProParser, ChordsOverWordsParser, type Song } from 'chordsheetjs'

export interface ParsedSong {
  song: Song
  title: string | null
  artist: string | null
  key: string | null
  capo: number | null
  tempo: string | null
  chords: string[]
  error: string | null
}

const first = (v: string | string[] | null | undefined): string | null =>
  v == null ? null : Array.isArray(v) ? (v[0] ?? null) : v

/** Текст без квадратных скобок считаем форматом «аккорды над текстом». */
export function looksLikeChordPro(text: string): boolean {
  return /\[[A-H][^\]]*\]/.test(text) || /\{[a-z_]+/i.test(text)
}

export function parseSong(text: string): ParsedSong {
  let song: Song
  let error: string | null = null
  try {
    song = looksLikeChordPro(text) ? new ChordProParser().parse(text) : new ChordsOverWordsParser().parse(text)
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
    try {
      song = new ChordsOverWordsParser().parse(text)
    } catch {
      song = new ChordProParser().parse('')
    }
  }
  const capoRaw = first(song.capo)
  const capo = capoRaw != null && /^\d+$/.test(capoRaw) ? Number(capoRaw) : null
  let chords: string[] = []
  try {
    chords = song.getChords().filter(Boolean)
  } catch {
    chords = []
  }
  return {
    song,
    title: song.title ?? null,
    artist: first(song.artist) ?? first(song.subtitle),
    key: song.key ?? null,
    capo,
    tempo: first(song.metadata.get('tempo')),
    chords,
    error,
  }
}

/** Заголовок из {title}, иначе из имени файла / первой строки. */
export function titleFor(parsed: ParsedSong, fallback: string): string {
  return parsed.title?.trim() || fallback
}
