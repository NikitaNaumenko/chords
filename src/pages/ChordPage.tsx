import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { ChordDiagram } from '../chords/ChordDiagram'
import { lookupChord } from '../chords/lookup'
import { chordDescRu, positionShortRu } from '../chords/names'
import { NavBar } from '../components/NavBar'
import { SongRow } from '../components/SongRow'
import { useGuitarDb } from '../hooks/useGuitarDb'
import { useLibrary } from '../songs/library'

export function ChordPage() {
  const { name = '' } = useParams()
  const db = useGuitarDb()
  const lib = useLibrary()
  const [pos, setPos] = useState(0)
  const found = db ? lookupChord(db, name) : null
  const positions = found?.positions ?? []
  const position = positions[pos] ?? positions[0] ?? null
  const inSongs = useMemo(() => lib.songs.filter((s) => s.chords.includes(name)), [lib.songs, name])

  return (
    <div className="screen flush">
      <NavBar fallback="/chords" />
      <div className="page gutter">
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <div className="serif" style={{ fontSize: 56, lineHeight: 1 }}>
            {name}
          </div>
          <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 3 }}>{db ? (found ? chordDescRu(name, position) : 'Такого аккорда нет в базе аппликатур') : 'Загрузка…'}</div>
        </div>
        <div className="diagram-card" style={{ margin: '20px auto 0', width: 206 }}>
          <ChordDiagram position={position} name={name} />
        </div>

        {positions.length > 1 && (
          <>
            <div className="eyebrow" style={{ marginTop: 26 }}>
              Другие позиции
            </div>
            <div className="variants">
              {positions.map((p, i) => (
                <button key={i} className={i === pos ? 'on' : ''} onClick={() => setPos(i)}>
                  <ChordDiagram position={p} name={name} dotColor={i === pos ? 'var(--accent)' : 'var(--fg-2)'} />
                  <div style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 600, marginTop: 7, color: 'var(--fg)' }}>{positionShortRu(p)}</div>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="eyebrow" style={{ marginTop: 24 }}>
          Встречается в песнях
        </div>
        <div className="group">
          {inSongs.map((s) => (
            <SongRow key={s.id} song={s} side={null} chevron />
          ))}
        </div>
        {inSongs.length === 0 && <div className="empty">Пока ни в одной песне</div>}
      </div>
    </div>
  )
}
