import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ChordDiagram } from '../chords/ChordDiagram'
import { lookupChord } from '../chords/lookup'
import { chordDescRu } from '../chords/names'
import { useGuitarDb } from '../hooks/useGuitarDb'
import { Sheet } from './Sheet'

/** Шторка с аппликатурой аккорда, на который тапнули в тексте. */
export function ChordSheet({ chord, onClose }: { chord: string; onClose: () => void }) {
  const db = useGuitarDb()
  const navigate = useNavigate()
  const [pos, setPos] = useState(0)
  const found = db ? lookupChord(db, chord) : null
  const positions = found?.positions ?? []
  const position = positions[pos] ?? positions[0] ?? null

  return (
    <Sheet onClose={onClose}>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        <div style={{ width: 94, flex: 'none' }}>
          <ChordDiagram position={position} name={chord} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <div className="serif" style={{ fontSize: 30, lineHeight: 1 }}>
            {chord}
          </div>
          <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>{db ? (found ? chordDescRu(chord, position) : 'Нет в базе аппликатур') : '…'}</div>
          {positions.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-muted)' }}>
              <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setPos((p) => (p - 1 + positions.length) % positions.length)} aria-label="Предыдущая позиция">
                ‹
              </button>
              <span>
                позиция {pos + 1} / {positions.length}
              </span>
              <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setPos((p) => (p + 1) % positions.length)} aria-label="Следующая позиция">
                ›
              </button>
            </div>
          )}
          <button
            className="pill-btn accent"
            style={{ marginTop: 8, textAlign: 'center', borderRadius: 11 }}
            onClick={() => {
              onClose()
              navigate(`/chord/${encodeURIComponent(chord)}`)
            }}
          >
            Открыть аккорд
          </button>
        </div>
      </div>
    </Sheet>
  )
}
