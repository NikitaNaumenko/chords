import { memo } from 'react'
import type { FlatLine, Section } from '../songs/model'
import type { ViewMode } from '../songs/types'

interface Props {
  mode: ViewMode
  sections: Section[]
  flat: FlatLine[]
  active: number
  /** Подписи секций (скрываются во время автопрокрутки) */
  showLabels?: boolean
  onChord: (chord: string) => void
  onLine: (index: number) => void
}

/** Классика: секции, аккорд над слогом. Караоке/Дорожка: плоские строки с подсветкой активной. */
export const SongRenderer = memo(function SongRenderer({ mode, sections, flat, active, showLabels = true, onChord, onLine }: Props) {
  if (mode === 'classic') {
    return (
      <div className="sections">
        {sections.map((sec, si) => (
          <section key={si} className={`sec ${sec.type}`} data-section={si} data-label={sec.label ?? ''}>
            {sec.label && showLabels && <div className="eyebrow small">{sec.label}</div>}
            {sec.lines.map((ln, li) => {
              if (ln.kind === 'comment') return <div key={li} className="comment">{ln.text}</div>
              if (ln.kind === 'literal') return <div key={li} className="tabline">{ln.text}</div>
              return (
                <div key={li} className="line">
                  {ln.segs.map((sg, k) => (
                    <div key={k} className="seg">
                      {sg.chord ? (
                        <button className="chord-btn" onClick={() => onChord(sg.chord)}>
                          {sg.chord}
                        </button>
                      ) : (
                        <div className="chord-btn" aria-hidden />
                      )}
                      <div className="lyric">{sg.text || (sg.chord ? ' ' : '')}</div>
                    </div>
                  ))}
                </div>
              )
            })}
          </section>
        ))}
      </div>
    )
  }

  // Караоке и Дорожка: те же секции с подписями и отступами, что и в классике,
  // только строки плоские — по одной на строку текста, с подсветкой активной.
  const bySection = new Map<number, { line: FlatLine; index: number }[]>()
  flat.forEach((line, index) => {
    const list = bySection.get(line.sectionIndex) ?? []
    list.push({ line, index })
    bySection.set(line.sectionIndex, list)
  })

  const renderFlat = (ln: FlatLine, i: number) => {
    if (mode === 'karaoke') {
      return (
        <div key={i} className={`kline${i === active ? ' on' : ''}`} data-line={i} onClick={() => onLine(i)} role="button">
          {ln.kind === 'lyrics' ? (
            <>
              <button
                className="kchord"
                onClick={(e) => {
                  e.stopPropagation()
                  if (ln.chord) onChord(ln.chord)
                }}
              >
                {ln.chords.length > 1 ? `${ln.chord}…` : ln.chord}
              </button>
              <div className="ktext">{ln.text}</div>
            </>
          ) : (
            <div className={ln.kind === 'comment' ? 'comment' : 'tabline'} style={{ flex: 1 }}>
              {ln.text}
            </div>
          )}
        </div>
      )
    }
    if (ln.kind === 'lyrics') {
      return (
        <button key={i} className={`tline${i === active ? ' on' : ''}`} data-line={i} onClick={() => onLine(i)} style={{ display: 'block', width: '100%' }}>
          {ln.text}
        </button>
      )
    }
    return (
      <div key={i} className={ln.kind === 'comment' ? 'comment' : 'tabline'} data-line={i}>
        {ln.text}
      </div>
    )
  }

  return (
    <div className="sections">
      {sections.map((sec, si) => (
        <section key={si} className={`sec ${sec.type} ${mode === 'karaoke' ? 'karaoke' : 'track-lines'}`} data-section={si} data-label={sec.label ?? ''}>
          {sec.label && showLabels && <div className="eyebrow small">{sec.label}</div>}
          {(bySection.get(si) ?? []).map(({ line, index }) => renderFlat(line, index))}
        </section>
      ))}
    </div>
  )
})
