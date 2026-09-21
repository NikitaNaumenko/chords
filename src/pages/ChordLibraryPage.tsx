import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ChordDiagram } from '../chords/ChordDiagram'
import { displayName, listAllChords, lookupChord } from '../chords/lookup'
import { useGuitarDb } from '../hooks/useGuitarDb'
import { useLibrary } from '../songs/library'

const ROOTS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const COMMON = ['major', 'minor', '7', 'm7', 'maj7', 'sus2', 'sus4', 'dim', 'aug', '6', 'm6', '9', 'add9', 'm7b5', 'dim7', '7sus4']

export function ChordLibraryPage() {
  const db = useGuitarDb()
  const lib = useLibrary()
  const [root, setRoot] = useState<string | null>(null)
  const [all, setAll] = useState(false)

  const used = useMemo(() => [...new Set(lib.songs.flatMap((s) => s.chords))].sort((a, b) => a.localeCompare(b)), [lib.songs])
  const items = useMemo(() => {
    if (!db || !root) return []
    const list = listAllChords(db).filter((c) => c.root === root)
    return all ? list : list.filter((c) => COMMON.includes(c.suffix))
  }, [db, root, all])

  return (
    <div className="screen">
      <div className="page">
        <h1 className="display">Аккорды</h1>
        <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
          <button className={`chip${root === null ? ' on' : ''}`} style={{ minHeight: 34, background: root === null ? undefined : 'var(--card)', boxShadow: root === null ? undefined : 'var(--shadow)' }} onClick={() => setRoot(null)}>
            В песнях
          </button>
          {ROOTS.map((r) => (
            <button key={r} className={`chip${root === r ? ' on' : ''}`} style={{ minHeight: 34, padding: '0 10px', fontWeight: 700, background: root === r ? undefined : 'var(--card)', boxShadow: root === r ? undefined : 'var(--shadow)' }} onClick={() => setRoot(r)}>
              {r}
            </button>
          ))}
        </div>

        {root === null ? (
          <>
            <div className="chord-grid">
              {used.map((c) => (
                <Link key={c} to={`/chord/${encodeURIComponent(c)}`}>
                  <ChordDiagram position={db ? (lookupChord(db, c)?.positions[0] ?? null) : null} name={c} />
                  <div className="cname">{c}</div>
                </Link>
              ))}
            </div>
            {used.length === 0 && <div className="empty">В песеннике пока нет аккордов</div>}
          </>
        ) : (
          <>
            <div className="section-head" style={{ marginTop: 18 }}>
              <div className="eyebrow">{root}</div>
              <button className="link-small" onClick={() => setAll((v) => !v)}>
                {all ? 'Только частые' : 'Показать все'}
              </button>
            </div>
            <div className="chord-grid">
              {items.map((c) => {
                const nm = displayName(c.root, c.suffix)
                return (
                  <Link key={c.suffix} to={`/chord/${encodeURIComponent(nm)}`}>
                    <ChordDiagram position={db ? (lookupChord(db, nm)?.positions[0] ?? null) : null} name={nm} />
                    <div className="cname">{nm}</div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
