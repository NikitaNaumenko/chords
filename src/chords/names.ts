import { Chord } from 'chordsheetjs'
import type { ChordPosition } from './lookup'
import { normalizeSuffix } from './lookup'

const NOTE_RU: Record<string, string> = { C: 'До', D: 'Ре', E: 'Ми', F: 'Фа', G: 'Соль', A: 'Ля', B: 'Си', H: 'Си' }

const SUFFIX_RU: Record<string, string> = {
  major: 'мажор',
  minor: 'минор',
  '7': 'септаккорд',
  m7: 'минорный септаккорд',
  maj7: 'большой мажорный септаккорд',
  mmaj7: 'минорный с большой септимой',
  '6': 'секстаккорд',
  m6: 'минорный секстаккорд',
  '9': 'нонаккорд',
  m9: 'минорный нонаккорд',
  maj9: 'большой нонаккорд',
  '11': 'ундецимаккорд',
  '13': 'терцдецимаккорд',
  sus2: 'с задержанием (sus2)',
  sus4: 'с задержанием (sus4)',
  '7sus4': 'септаккорд с задержанием',
  dim: 'уменьшенный',
  dim7: 'уменьшенный септаккорд',
  m7b5: 'полууменьшенный',
  aug: 'увеличенный',
  aug7: 'увеличенный септаккорд',
  add9: 'с добавленной ноной',
  madd9: 'минорный с добавленной ноной',
  '69': 'секстаккорд с ноной',
  '7b9': 'септаккорд с пониженной ноной',
  '7#9': 'септаккорд с повышенной ноной',
  '7b5': 'септаккорд с пониженной квинтой',
  alt: 'альтерированный',
}

/** «Ля минор», «До-диез минорный септаккорд», «Соль мажор / Си» */
export function chordNameRu(name: string): string {
  const chord = Chord.parse(name.trim())
  if (!chord?.root) return name
  const note = chord.root.note.replace(/♯/g, '#').replace(/♭/g, 'b')
  const letter = note[0]
  const acc = note.slice(1)
  let ru = NOTE_RU[letter] ?? letter
  if (acc === '#') ru += '-диез'
  else if (acc === 'b') ru += '-бемоль'
  const sfx = normalizeSuffix(chord.suffix)
  const sfxRu = sfx ? (SUFFIX_RU[sfx] ?? sfx) : (chord.suffix ?? '')
  let out = sfxRu ? `${ru} ${sfxRu}` : ru
  if (chord.bass) out += ` / бас ${chord.bass.note}`
  return out
}

/** «открытая позиция», «барре II лад», «V позиция» */
export function positionRu(p: ChordPosition | null | undefined): string {
  if (!p) return ''
  const roman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV']
  if (p.barres.length) {
    const fret = p.baseFret + p.barres[0] - 1
    return `барре ${roman[fret] ?? fret} лад`
  }
  if (p.baseFret === 1 && p.frets.some((f) => f === 0)) return 'открытая позиция'
  return `${roman[p.baseFret] ?? p.baseFret} позиция`
}

/** Короткая подпись позиции для мелких карточек: «барре I», «откр.», «V лад» */
export function positionShortRu(p: ChordPosition | null | undefined): string {
  if (!p) return ''
  const roman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV']
  if (p.barres.length) return `барре ${roman[p.baseFret + p.barres[0] - 1] ?? p.baseFret}`
  if (p.baseFret === 1) return 'откр.'
  return `${roman[p.baseFret] ?? p.baseFret} лад`
}

export function chordDescRu(name: string, p: ChordPosition | null | undefined): string {
  const pos = positionRu(p)
  return pos ? `${chordNameRu(name)} · ${pos}` : chordNameRu(name)
}
