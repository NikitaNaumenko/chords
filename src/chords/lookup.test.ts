import { describe, expect, it } from 'vitest'
import guitar from '@tombatossals/chords-db/lib/guitar.json'
import { displayName, lookupChord, normalizeRoot, normalizeSuffix } from './lookup'
import { chordDescRu, chordNameRu } from './names'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = guitar as any

describe('normalizeRoot', () => {
  it('приводит энгармонические тоники к ключам chords-db', () => {
    expect(normalizeRoot('Db')).toBe('C#')
    expect(normalizeRoot('D#')).toBe('Eb')
    expect(normalizeRoot('G#')).toBe('Ab')
    expect(normalizeRoot('A#')).toBe('Bb')
    expect(normalizeRoot('H')).toBe('B')
    expect(normalizeRoot('C♯')).toBe('C#')
    expect(normalizeRoot('X')).toBeNull()
  })
})

describe('normalizeSuffix', () => {
  it('сопоставляет варианты записи', () => {
    expect(normalizeSuffix(null)).toBe('major')
    expect(normalizeSuffix('m')).toBe('minor')
    expect(normalizeSuffix('+')).toBe('aug')
    expect(normalizeSuffix('°')).toBe('dim')
    expect(normalizeSuffix('ø')).toBe('m7b5')
    expect(normalizeSuffix('m7(b5)')).toBe('m7b5')
    expect(normalizeSuffix('M7')).toBe('maj7')
    expect(normalizeSuffix('sus')).toBe('sus4')
    expect(normalizeSuffix('5')).toBeNull()
  })
})

describe('lookupChord', () => {
  it('находит открытые и барре-аккорды', () => {
    const am = lookupChord(db, 'Am')
    expect(am?.root).toBe('A')
    expect(am?.suffix).toBe('minor')
    expect(am?.positions[0].frets).toEqual([-1, 0, 2, 2, 1, 0])
    const f = lookupChord(db, 'F')
    expect(f?.positions[0].barres).toEqual([1])
  })
  it('нормализует тонику и суффикс', () => {
    expect(lookupChord(db, 'C#m7')?.positions.length).toBeGreaterThan(0)
    expect(lookupChord(db, 'Db')?.root).toBe('C#')
    expect(lookupChord(db, 'Hm')?.root).toBe('B')
  })
  it('слэш-аккорды: берёт вариант с басом, иначе без баса', () => {
    const gb = lookupChord(db, 'G/B')
    expect(gb?.bass).toBe('B')
    expect(gb?.positions[0].frets).toBeDefined()
    const weird = lookupChord(db, 'Cmaj7/G')
    expect(weird?.suffix).toBe('maj7')
  })
  it('возвращает null для мусора и не бросает', () => {
    expect(lookupChord(db, 'Проигрыш')).toBeNull()
    expect(lookupChord(db, '')).toBeNull()
    expect(lookupChord(db, 'C5')).toBeNull()
  })
})

describe('русские названия', () => {
  it('строит описание', () => {
    expect(chordNameRu('Am')).toBe('Ля минор')
    expect(chordNameRu('C#m7')).toBe('До-диез минорный септаккорд')
    expect(chordNameRu('Bb')).toBe('Си-бемоль мажор')
    expect(chordNameRu('G/B')).toBe('Соль мажор / бас B')
    expect(chordDescRu('F', lookupChord(db, 'F')?.positions[0])).toBe('Фа мажор · барре I лад')
    expect(chordDescRu('Am', lookupChord(db, 'Am')?.positions[0])).toBe('Ля минор · открытая позиция')
  })
  it('displayName', () => {
    expect(displayName('C', 'major')).toBe('C')
    expect(displayName('C', 'minor')).toBe('Cm')
    expect(displayName('C', '/E')).toBe('C/E')
  })
})
