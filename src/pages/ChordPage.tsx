import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ChordDiagram } from '../chords/ChordDiagram'
import { lookupChord } from '../chords/lookup'
import { chordDescRu, positionShortRu } from '../chords/names'
import { SongRow } from '../components/SongRow'
import { useGuitarDb } from '../hooks/useGuitarDb'
import { useLibrary } from '../songs/library'

export function ChordPage() {
  const { name = '' } = useParams()
  const navigate = useNavigate()
  const db = useGuitarDb()
  const lib = useLibrary()
  const [pos, setPos] = useState(0)
  const found = db ? lookupChord(db, name) : null
  const positions = found?.positions ?? []
  const position = positions[pos] ?? positions[0] ?? null
  const inSongs = useMemo(() => lib.songs.filter((s) => s.chords.includes(name)), [lib.songs, name])

  return (
    <div className="screen">
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="icon-btn" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/chords'))} aria-label="Назад">
            ‹
          </button>
          <div className="eyebrow" style={{ flex: 1, textAlign: 'center', fontWeight: 600, color: 'rgba(244,239,230,.56)' }}>
            Аккорд
          </div>
          <div style={{ width: 34 }} />
        </div>
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <div className="serif" style={{ fontSize: 56, lineHeight: 1 }}>
            {name}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--fg-60)', marginTop: 4 }}>{db ? (found ? chordDescRu(name, position) : 'Такого аккорда нет в базе аппликатур') : 'Загрузка…'}</div>
        </div>
        <div style={{ margin: '22px auto 0', width: 210 }}>
          <ChordDiagram position={position} name={name} />
        </div>

        {positions.length > 1 && (
          <>
            <div className="eyebrow" style={{ marginTop: 28 }}>
              Другие позиции
            </div>
            <div className="variants">
              {positions.map((p, i) => (
                <button key={i} className={i === pos ? 'on' : ''} onClick={() => setPos(i)}>
                  <ChordDiagram position={p} name={name} dotColor={i === pos ? 'var(--accent)' : 'var(--dot-muted)'} />
                  <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, marginTop: 7, color: 'rgba(244,239,230,.75)' }}>{positionShortRu(p)}</div>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="eyebrow" style={{ marginTop: 26 }}>
          Встречается в песнях
        </div>
        <div className="list">
          {inSongs.map((s) => (
            <SongRow key={s.id} song={s} side={null} />
          ))}
          {inSongs.length === 0 && <div className="empty">Пока ни в одной песне</div>}
        </div>
      </div>
    </div>
  )
}
