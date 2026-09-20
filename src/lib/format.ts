import type { SongRecord } from '../songs/types'

export function initials(title: string): string {
  const words = title.replace(/[«»"'()]/g, '').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w))
  const letters = words.slice(0, 2).map((w) => [...w].find((ch) => /[\p{L}\p{N}]/u.test(ch)) ?? '')
  return letters.join('').toUpperCase() || '♪'
}

export function chordsSummary(chords: string[], max = 4): string {
  if (!chords.length) return 'без аккордов'
  const head = chords.slice(0, max).join(' · ')
  return chords.length > max ? `${head} …` : head
}

export function songMeta(song: SongRecord): string {
  const parts: string[] = []
  if (song.artist) parts.push(song.artist)
  if (song.key) parts.push(song.key)
  parts.push(pluralChords(song.chords.length))
  return parts.join(' · ')
}

export function pluralChords(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  const word = mod10 === 1 && mod100 !== 11 ? 'аккорд' : mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20) ? 'аккорда' : 'аккордов'
  return `${n} ${word}`
}

export function pluralSongs(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  const word = mod10 === 1 && mod100 !== 11 ? 'песня' : mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20) ? 'песни' : 'песен'
  return `${n} ${word}`
}

const DAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']

export function nowLabel(d = new Date()): string {
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${DAYS[d.getDay()]} · ${hh}:${mm}`
}

export function dayOfYear(d = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0)
  return Math.floor((d.getTime() - start.getTime()) / 86400000)
}

/** Имя файла для экспорта: латиница/кириллица оставляем, мусор убираем. */
export function fileNameFor(title: string): string {
  return (title.trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '-').slice(0, 60) || 'song') + '.cho'
}
