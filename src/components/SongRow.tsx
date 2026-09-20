import { Link } from 'react-router'
import { chordsSummary, initials } from '../lib/format'
import type { SongRecord } from '../songs/types'

interface Props {
  song: SongRecord
  to?: string
  side?: string | null
  onClick?: () => void
  favorite?: boolean
}

export function SongRow({ song, to, side, onClick, favorite }: Props) {
  const inner = (
    <>
      <div className="thumb avatar" style={{ fontSize: 14, borderRadius: 11 }}>
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
