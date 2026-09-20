#!/usr/bin/env node
// Конвертер «аккорды над текстом» → ChordPro.
//
//   pnpm convert                 # все songs/inbox/*.txt → songs/*.cho, исходники в songs/inbox/done/
//   pnpm convert файл.txt ...    # только указанные файлы
//   pnpm convert --dry           # показать результат, ничего не писать
//
// Имя файла «Артист - Название.txt» даёт {artist} и {title}. Заголовки секций
// («Куплет 1:», «Припев:», «[Chorus]», «Вступление: Am F C G») превращаются в директивы.

import { readdir, readFile, writeFile, mkdir, rename } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { Chord } from 'chordsheetjs'

const ROOT = resolve(import.meta.dirname, '..')
const INBOX = join(ROOT, 'songs', 'inbox')
const OUT = join(ROOT, 'songs')

const SECTION = [
  [/^(припев|chorus|refrain)/i, 'chorus'],
  [/^(куплет|verse|запев)/i, 'verse'],
  [/^(бридж|bridge|переход)/i, 'bridge'],
  [/^(вступление|интро|intro|проигрыш|соло|solo|кода|coda|outro|окончание|финал|instrumental|interlude|pre-?chorus|предприпев)/i, 'part'],
]
const OPEN = { chorus: 'soc', verse: 'sov', bridge: 'sob', part: 'sop' }
const CLOSE = { chorus: 'eoc', verse: 'eov', bridge: 'eob', part: 'eop' }

const SEPARATOR = /^(\||\/|-+|–|—|x\d+|×\d+|\(\d+\s*(раза?|x)?\)|\d+\s*раза?|,|\.)$/i

function isChordToken(tok) {
  if (SEPARATOR.test(tok)) return true
  const clean = tok.replace(/[()]/g, '')
  if (!/^[A-H]/.test(clean)) return false
  return Chord.parse(clean) != null
}

/** Строка состоит только из аккордов и разделителей */
function isChordLine(line) {
  const toks = line.trim().split(/\s+/).filter(Boolean)
  if (!toks.length) return false
  if (!toks.some((t) => /^[A-H]/.test(t))) return false
  return toks.every(isChordToken)
}

/** [{chord, col}] — аккорды со своими колонками */
function chordsAt(line) {
  const out = []
  const re = /\S+/g
  let m
  while ((m = re.exec(line))) {
    const tok = m[0].replace(/[()]/g, '')
    if (/^[A-H]/.test(tok) && Chord.parse(tok)) out.push({ chord: tok, col: m.index })
  }
  return out
}

function merge(chordLine, lyric) {
  const chords = chordsAt(chordLine)
  let out = ''
  let pos = 0
  for (const { chord, col } of chords) {
    const at = Math.min(col, lyric.length)
    out += lyric.slice(pos, at) + `[${chord}]`
    pos = at
  }
  return out + lyric.slice(pos)
}

function chordsOnly(chordLine) {
  const chords = chordsAt(chordLine).map((c) => `[${c.chord}]`)
  // повторы вроде «x2» / «(2 раза)» оставляем текстом
  const repeats = chordLine.trim().split(/\s+/).filter((t) => /^(x\d+|×\d+|\(\d+\s*(раза?|x)?\)|\d+\s*раза?)$/i.test(t))
  return [...chords, ...repeats].join(' ')
}

function parseHeader(line) {
  const t = line.trim().replace(/^\[|\]$/g, '')
  for (const [re, type] of SECTION) {
    if (re.test(t)) {
      const [label, rest = ''] = t.split(/:\s*/, 2)
      const trailing = rest.trim()
      return { type, label: label.replace(/[:.]+$/, '').trim(), trailingChords: isChordLine(trailing) ? trailing : null }
    }
  }
  return null
}

export function convert(text, { title, artist } = {}) {
  const lines = text.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n')
  const meta = { title, artist, key: null, capo: null }
  const body = []
  let open = null
  const close = () => {
    if (!open) return
    while (body.length && body[body.length - 1] === '') body.pop()
    body.push(`{${CLOSE[open]}}`, '')
    open = null
  }
  const openSection = (type, label) => {
    close()
    body.push(`{${OPEN[type]}: ${label}}`)
    open = type
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.trimEnd()
    const t = line.trim()
    if (!t) {
      body.push('')
      continue
    }
    // метаданные, которые часто пишут на сайтах
    let m
    if ((m = t.match(/^(capo|каподастр|капо)\s*[:\-–]?\s*(\d+)/i))) {
      meta.capo = Number(m[2])
      continue
    }
    if ((m = t.match(/^(тональность|key)\s*[:\-–]?\s*([A-H][#b]?m?)/i))) {
      meta.key = m[2]
      continue
    }
    if (/^(аккорды|текст песни|chords|tabbed by|подбор|бой|перебор)\b/i.test(t) && !isChordLine(t)) continue
    if (/^[-=_*]{3,}$/.test(t)) continue
    // первые строки — название/исполнитель из имени файла
    if (body.length === 0 && meta.title && (t.toLowerCase() === meta.title.toLowerCase() || t.toLowerCase() === (meta.artist ?? '').toLowerCase())) continue
    if (body.length === 0 && meta.title && meta.artist && t.toLowerCase() === `${meta.artist} - ${meta.title}`.toLowerCase()) continue

    const header = parseHeader(t)
    if (header) {
      openSection(header.type, header.label)
      if (header.trailingChords) body.push(chordsOnly(header.trailingChords))
      continue
    }
    if (isChordLine(line)) {
      const next = lines[i + 1] ?? ''
      if (next.trim() && !isChordLine(next) && !parseHeader(next.trim())) {
        body.push(merge(line, next.trimEnd()))
        i++
      } else {
        body.push(chordsOnly(line))
      }
      continue
    }
    body.push(line)
  }
  close()

  const head = []
  if (meta.title) head.push(`{title: ${meta.title}}`)
  if (meta.artist) head.push(`{artist: ${meta.artist}}`)
  if (meta.key) head.push(`{key: ${meta.key}}`)
  if (meta.capo != null) head.push(`{capo: ${meta.capo}}`)
  const text2 = body.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+/, '').replace(/\n+$/, '')
  return head.join('\n') + '\n\n' + text2 + '\n'
}

const TR = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}
export const slug = (s) =>
  [...s.toLowerCase()]
    .map((ch) => TR[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'song'

function metaFromName(file) {
  const base = basename(file).replace(/\.[^.]+$/, '').trim()
  const m = base.match(/^(.+?)\s+[-–—]\s+(.+)$/)
  return m ? { artist: m[1].trim(), title: m[2].trim() } : { title: base }
}

async function main() {
  const args = process.argv.slice(2)
  const dry = args.includes('--dry')
  let files = args.filter((a) => !a.startsWith('--'))
  if (!files.length) {
    try {
      files = (await readdir(INBOX)).filter((f) => /\.(txt|crd|tab)$/i.test(f)).map((f) => join(INBOX, f))
    } catch {
      files = []
    }
  }
  if (!files.length) {
    console.log('Нет файлов: положите .txt в songs/inbox/ (имя «Артист - Название.txt») или укажите пути.')
    return
  }
  for (const file of files) {
    const meta = metaFromName(file)
    const cho = convert(await readFile(file, 'utf8'), meta)
    const outName = slug(meta.artist ? `${meta.artist}-${meta.title}` : meta.title) + '.cho'
    if (dry) {
      console.log(`\n===== ${outName}\n${cho}`)
      continue
    }
    await writeFile(join(OUT, outName), cho)
    if (file.startsWith(INBOX)) {
      await mkdir(join(INBOX, 'done'), { recursive: true })
      await rename(file, join(INBOX, 'done', basename(file)))
    }
    console.log(`✓ ${basename(file)} → songs/${outName}`)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
