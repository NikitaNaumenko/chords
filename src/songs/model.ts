import { ChordLyricsPair, Comment, Literal, Tag, type Song } from 'chordsheetjs'

export interface Segment {
  chord: string
  text: string
}

export type RenderLine =
  | { kind: 'lyrics'; segs: Segment[] }
  | { kind: 'comment'; text: string }
  | { kind: 'literal'; text: string }

export interface Section {
  type: string
  label: string | null
  lines: RenderLine[]
}

/** Плоская строка для режимов «Караоке» и «Дорожка». */
export interface FlatLine {
  sectionIndex: number
  sectionLabel: string | null
  chord: string
  chords: string[]
  text: string
  kind: RenderLine['kind']
}

const DEFAULT_LABEL: Record<string, string> = { chorus: 'Припев', bridge: 'Бридж' }

/** Превращает Song из chordsheetjs в модель для рендера: секции → строки → сегменты. */
export function buildSections(song: Song): Section[] {
  const sections: Section[] = []
  for (const paragraph of song.expandedBodyParagraphs) {
    let current: Section | null = null
    let firstInParagraph = true
    for (const line of paragraph.lines) {
      const type = line.type || 'none'
      if (!current || current.type !== type) {
        const label: string | null = (firstInParagraph ? paragraph.label : null) ?? DEFAULT_LABEL[type] ?? null
        current = { type, label, lines: [] }
        sections.push(current)
        firstInParagraph = false
      }
      let segs: Segment[] = []
      for (const item of line.items) {
        if (item instanceof ChordLyricsPair) {
          const chord = (item.chords ?? '').trim()
          const text = item.lyrics ?? ''
          if (chord) segs.push({ chord, text })
          // текст без аккорда режем на слова, чтобы строка переносилась по словам
          else for (const w of text.match(/\S+\s*|\s+/g) ?? []) segs.push({ chord: '', text: w })
        } else if (item instanceof Tag) {
          if (item.name === 'comment' || item.name === 'comment_italic' || item.name === 'comment_box') {
            current.lines.push({ kind: 'comment', text: item.value ?? '' })
          } else if (item.isSectionDelimiter() && item.label && !current.label) {
            current.label = item.label
          }
        } else if (item instanceof Comment) {
          // # комментарии в исходнике не показываем
        } else if (item instanceof Literal) {
          current.lines.push({ kind: 'literal', text: item.string ?? '' })
        }
      }
      // пустые сегменты в конце (аккорд без текста) оставляем — они несут аккорд
      segs = segs.filter((s, i) => s.chord || s.text || i === 0)
      if (segs.length && segs.some((s) => s.chord || s.text.trim())) current.lines.push({ kind: 'lyrics', segs })
    }
  }
  return sections.filter((s) => s.lines.length)
}

export function flattenSections(sections: Section[]): FlatLine[] {
  const out: FlatLine[] = []
  sections.forEach((sec, si) => {
    sec.lines.forEach((ln, li) => {
      const label = li === 0 ? sec.label : null
      if (ln.kind === 'lyrics') {
        const chords = ln.segs.map((s) => s.chord).filter(Boolean)
        out.push({ sectionIndex: si, sectionLabel: label, chord: chords[0] ?? '', chords, text: ln.segs.map((s) => s.text).join(''), kind: 'lyrics' })
      } else {
        out.push({ sectionIndex: si, sectionLabel: label, chord: '', chords: [], text: ln.text, kind: ln.kind })
      }
    })
  })
  return out
}

export function uniqueChords(sections: Section[]): string[] {
  const seen = new Set<string>()
  for (const sec of sections) for (const ln of sec.lines) if (ln.kind === 'lyrics') for (const s of ln.segs) if (s.chord) seen.add(s.chord)
  return [...seen]
}
