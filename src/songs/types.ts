export type SongSource = 'repo' | 'local'

/** Песня как она хранится/показывается: текст ChordPro плюс сводка. */
export interface SongRecord {
  id: string
  source: SongSource
  /** Есть локальная правка песни из репозитория */
  overridden: boolean
  text: string
  title: string
  artist: string | null
  key: string | null
  capo: number | null
  chords: string[]
  updatedAt: number
}

export interface LocalSong {
  id: string
  text: string
  updatedAt: number
}

export type ViewMode = 'classic' | 'karaoke' | 'track'

export interface SongSettings {
  songId: string
  transpose: number
  capo: number
  /** Множитель скорости автопрокрутки */
  speed: number
  /** Размер шрифта текста, px */
  fontSize: number | null
  mode: ViewMode | null
  favorite: boolean
  lastOpenedAt: number | null
  /** Прогресс чтения 0..1 и подпись секции для карточки «Продолжить» */
  progress: number
  section: string | null
}

export interface Setlist {
  id: string
  name: string
  songIds: string[]
  updatedAt: number
}

export interface Backup {
  version: 1
  exportedAt: number
  localSongs: LocalSong[]
  settings: SongSettings[]
  setlists: Setlist[]
}

export const defaultSettings = (songId: string): SongSettings => ({
  songId,
  transpose: 0,
  capo: 0,
  speed: 1,
  fontSize: null,
  mode: null,
  favorite: false,
  lastOpenedAt: null,
  progress: 0,
  section: null,
})
