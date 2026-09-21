import { Link } from 'react-router'
import { chordsSummary, initials } from '../lib/format'
import type { SongRecord } from '../songs/types'

interface Props {
  song: SongRecord
  to?: string
  /** Текст справа; null — не показывать, по умолчанию тональность */
  side?: string | null
  onClick?: () => void
  favorite?: boolean
  chevron?: boolean
}

/** Строка сгруппированного списка (кладите внутрь .group). */
export function SongRow({ song, to, side, onClick, favorite, chevron }: Props) {
  const inner = (
    <>
      <div className="thumb avatar" style={{ fontSize: 14, borderRadius: 10 }}>
        {initials(song.title)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="title">
          {favorite && <span style={{ color: 'var(--accent)', marginRight: 5 }}>★</span>}
          {song.title}
          {song.source === 'local' && <span className="badge muted">локально</span>}
          {song.overridden && <span className="badge">изменено</span>}
        </div>
        <div className="sub">{chordsSummary(song.chords)}</div>
      </div>
      {side !== null && <div className="side">{side ?? song.key ?? ''}</div>}
      {chevron && <div className="chev">›</div>}
    </>
  )
  if (onClick) {
    return (
      <button className="row" onClick={onClick}>
        {inner}
      </button>
    )
  }
  return (
    <Link className="row" to={to ?? `/song/${encodeURIComponent(song.id)}`}>
      {inner}
    </Link>
  )
}
