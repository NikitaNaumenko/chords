import { describe, expect, it } from 'vitest'
import { buildSections, flattenSections, uniqueChords } from './model'
import { looksLikeChordPro, parseSong, titleFor } from './parse'

const SONG = `{title: Ой, то не вечер}
{artist: Народная}
{key: Am}

{sov: Куплет 1}
[Am]Ой, то не вечер, то не [Dm]вечер,
Мне ма[Am]лым-мало с[E7]палось,
{eov}

{soc}
[E7]Припев [Am]тут
{eoc}
{c: проигрыш}
{chorus}
`

describe('parseSong', () => {
  it('читает метаданные и аккорды', () => {
    const p = parseSong(SONG)
    expect(p.title).toBe('Ой, то не вечер')
    expect(p.artist).toBe('Народная')
    expect(p.key).toBe('Am')
    expect(p.chords).toEqual(['Am', 'Dm', 'E7'])
    expect(p.error).toBeNull()
  })
  it('заголовок из имени файла, если нет {title}', () => {
    const p = parseSong('[Am]Просто строка')
    expect(titleFor(p, 'moya-pesnya')).toBe('moya-pesnya')
  })
  it('распознаёт формат «аккорды над текстом»', () => {
    expect(looksLikeChordPro('Am      Dm\nОй, то не вечер')).toBe(false)
    const p = parseSong('Am      Dm\nОй, то не вечер')
    expect(p.chords).toEqual(['Am', 'Dm'])
  })
  it('транспонирует и учитывает капо', () => {
    const p = parseSong(SONG)
    expect(p.song.transpose(2).getChords()).toEqual(['Bm', 'Em', 'F#7'])
    expect(p.song.transpose(2).key).toBe('Bm')
    expect(p.song.transpose(-2).getChords()).toEqual(['Gm', 'Cm', 'D7'])
  })
})

describe('buildSections', () => {
  it('делит на секции с подписями и раскрывает {chorus}', () => {
    const sections = buildSections(parseSong(SONG).song)
    expect(sections.map((s) => [s.type, s.label])).toEqual([
      ['verse', 'Куплет 1'],
      ['chorus', 'Припев'],
      ['none', null],
      ['chorus', 'Припев'],
    ])
    const verse = sections[0]
    expect(verse.lines).toHaveLength(2)
    const line = verse.lines[0]
    if (line.kind !== 'lyrics') throw new Error('ожидалась строка с текстом')
    expect(line.segs.map((s) => s.text).join('')).toBe('Ой, то не вечер, то не вечер,')
    expect(line.segs.filter((s) => s.chord).map((s) => [s.chord, s.text])).toEqual([
      ['Am', 'Ой, '],
      ['Dm', 'вечер,'],
    ])
    // текст без аккорда разбит по словам — для переноса строк
    expect(line.segs.every((s) => s.chord || /^\S+\s*$|^\s+$/.test(s.text))).toBe(true)
    expect(sections[2].lines[0]).toEqual({ kind: 'comment', text: 'проигрыш' })
    expect(uniqueChords(sections)).toEqual(['Am', 'Dm', 'E7'])
  })
  it('нумерует куплеты без подписи', () => {
    const sections = buildSections(parseSong('{sov}\n[Am]раз\n{eov}\n{soc}\n[E7]припев\n{eoc}\n{sov: Финал}\n[Am]два\n{eov}\n{sov}\n[Am]три\n{eov}').song)
    expect(sections.map((s) => s.label)).toEqual(['Куплет 1', 'Припев', 'Финал', 'Куплет 3'])
  })
  it('плоские строки для караоке', () => {
    const flat = flattenSections(buildSections(parseSong(SONG).song))
    expect(flat[0]).toMatchObject({ chord: 'Am', text: 'Ой, то не вечер, то не вечер,', sectionLabel: 'Куплет 1' })
    expect(flat[1].sectionLabel).toBeNull()
  })
})

describe('transposeSong', () => {
  it('выбирает привычные названия тональностей', async () => {
    const { transposeSong, keyAfter } = await import('./transpose')
    const p = parseSong(SONG)
    expect(transposeSong(p.song, 1).getChords()).toEqual(['Bbm', 'Ebm', 'F7'])
    expect(transposeSong(p.song, -3).getChords()).toEqual(['F#m', 'Bm', 'C#7'])
    expect(transposeSong(p.song, -3).key).toBe('F#m')
    expect(keyAfter('C', 1)).toBe('Db')
    expect(keyAfter('C', -1)).toBe('B')
    expect(keyAfter('Am', 12)).toBe('Am')
  })
  it('без {key} угадывает по первому аккорду', async () => {
    const { transposeSong, guessKey } = await import('./transpose')
    const p = parseSong('[Am]раз [Dm]два [E7]три')
    expect(guessKey(p.song)).toBe('Am')
    expect(transposeSong(p.song, 1).getChords()).toEqual(['Bbm', 'Ebm', 'F7'])
    expect(transposeSong(p.song, 0)).toBe(p.song)
  })
})
