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
export function SongRenderer({ mode, sections, flat, active, showLabels = true, onChord, onLine }: Props) {
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

  if (mode === 'karaoke') {
    return (
      <div className="karaoke">
        {flat.map((ln, i) => (
          <div key={i} data-section={ln.sectionLabel != null ? ln.sectionIndex : undefined} data-label={ln.sectionLabel ?? ''}>
            {ln.sectionLabel && showLabels && (
              <div className="eyebrow small" style={{ padding: '18px 0 6px' }}>
                {ln.sectionLabel}
              </div>
            )}
            <div className={`kline${i === active ? ' on' : ''}`} data-line={i} onClick={() => onLine(i)} role="button">
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
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="track-lines">
      {flat.map((ln, i) => (
        <div key={i} data-section={ln.sectionLabel != null ? ln.sectionIndex : undefined} data-label={ln.sectionLabel ?? ''}>
          {ln.sectionLabel && showLabels && (
            <div className="eyebrow small" style={{ padding: '14px 0 4px' }}>
              {ln.sectionLabel}
            </div>
          )}
          {ln.kind === 'lyrics' ? (
            <button className={`tline${i === active ? ' on' : ''}`} data-line={i} onClick={() => onLine(i)} style={{ display: 'block', width: '100%' }}>
              {ln.text}
            </button>
          ) : (
            <div className={ln.kind === 'comment' ? 'comment' : 'tabline'} data-line={i}>
              {ln.text}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
