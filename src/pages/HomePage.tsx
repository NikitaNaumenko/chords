import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChordDiagram } from '../chords/ChordDiagram'
import { lookupChord } from '../chords/lookup'
import { chordDescRu } from '../chords/names'
import { LibraryMenu } from '../components/LibraryMenu'
import { SongRow } from '../components/SongRow'
import { useGuitarDb } from '../hooks/useGuitarDb'
import { dayOfYear, initials, nowLabel, songMeta } from '../lib/format'
import { pickFiles } from '../lib/share'
import { useLibrary } from '../songs/library'

const FALLBACK_CHORDS = ['Am', 'F', 'C', 'G', 'Dm', 'E7', 'Em', 'D', 'A', 'Bm', 'Cmaj7', 'Am7']

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.7" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
)
const ImportIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4v11M7 10l5 5 5-5M5 19h14" />
  </svg>
)
const ListIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.7" strokeLinecap="round">
    <path d="M5 7h14M5 12h14M5 17h9" />
  </svg>
)

export function HomePage() {
  const lib = useLibrary()
  const navigate = useNavigate()
  const db = useGuitarDb()
  const [menu, setMenu] = useState(false)

  const recent = useMemo(
    () =>
      lib.songs
        .map((s) => ({ s, t: lib.settings[s.id]?.lastOpenedAt ?? 0 }))
        .filter((x) => x.t > 0)
        .sort((a, b) => b.t - a.t)
        .map((x) => x.s),
    [lib.songs, lib.settings],
  )
  // «Продолжить»: последняя открытая, а если ещё ничего не открывали — первая в песеннике
  const current = recent[0] ?? lib.songs[0]
  const currentSettings = current ? lib.settings[current.id] : undefined
  const resumed = recent.length > 0

  const chordOfDay = useMemo(() => {
    const pool = [...new Set(lib.songs.flatMap((s) => s.chords))]
    const list = pool.length >= 3 ? pool : FALLBACK_CHORDS
    return list[dayOfYear() % list.length]
  }, [lib.songs])
  const chordLookup = db ? lookupChord(db, chordOfDay) : null

  const importCho = async () => {
    const files = await pickFiles('.cho,.chordpro,.crd,.pro,.txt,text/plain')
    if (!files.length) return
    const items = await Promise.all(files.map(async (f) => ({ name: f.name, text: await f.text() })))
    if (await lib.importTexts(items)) navigate('/book?tab=all')
  }

  return (
    <div className="screen">
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div className="eyebrow">{nowLabel()}</div>
            <h1 className="display" style={{ marginTop: 6 }}>
              Что играем
              <br />
              сегодня?
            </h1>
          </div>
          <button
            className="icon-btn"
            aria-label="Меню"
            onClick={() => setMenu(true)}
            style={{ width: 38, height: 38, marginTop: 6, background: 'var(--card)', border: '1px solid var(--line-3)', color: 'var(--accent)', fontWeight: 700, fontSize: 18, letterSpacing: 1 }}
          >
            ⋯
          </button>
        </div>

        {current ? (
          <Link className="card tap" to={`/song/${encodeURIComponent(current.id)}${resumed ? '?resume=1' : ''}`} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="avatar" style={{ width: 52, height: 52, fontSize: 21 }}>
                {initials(current.title)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="serif" style={{ fontSize: 20, lineHeight: 1.15 }}>
                  {current.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 2 }}>{songMeta(current)}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 99, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flex: 'none' }}>
                ▶
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="progress">
                <div style={{ width: `${Math.round((currentSettings?.progress ?? 0) * 100)}%` }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', fontWeight: 500 }}>
                {resumed ? (currentSettings?.section ?? (currentSettings?.progress ? `${Math.round(currentSettings.progress * 100)}%` : 'Продолжить')) : 'Начать'}
              </div>
            </div>
          </Link>
        ) : (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="serif" style={{ fontSize: 20, lineHeight: 1.15 }}>
              Песенник пуст
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
              Импортируйте <code>.cho</code> из «Файлов» (iCloud Drive) или создайте песню прямо здесь.
            </div>
          </div>
        )}

        <div className="quick">
          <button onClick={() => navigate('/new')}>
            <PlusIcon />
            <div>Новая</div>
          </button>
          <button onClick={importCho}>
            <ImportIcon />
            <div>Импорт</div>
          </button>
          <button onClick={() => navigate('/book')}>
            <ListIcon />
            <div>Сет-листы</div>
          </button>
        </div>

        <div className="section-head">
          <div className="eyebrow">Аккорд дня</div>
          <Link className="link-small" to="/chords">
            Все аккорды
          </Link>
        </div>
        <Link className="card tap" to={`/chord/${encodeURIComponent(chordOfDay)}`} style={{ marginTop: 9, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 72, flex: 'none' }}>
            <ChordDiagram position={chordLookup?.positions[0] ?? null} name={chordOfDay} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="serif" style={{ fontSize: 27, lineHeight: 1 }}>
              {chordOfDay}
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg-muted-2)', marginTop: 4, lineHeight: 1.45 }}>{chordDescRu(chordOfDay, chordLookup?.positions[0])}</div>
          </div>
        </Link>

        {recent.length > 0 && (
          <>
            <div className="eyebrow" style={{ marginTop: 24 }}>
              Недавние
            </div>
            <div className="group">
              {recent.slice(0, 6).map((s) => (
                <SongRow key={s.id} song={s} favorite={lib.settings[s.id]?.favorite} />
              ))}
            </div>
          </>
        )}

        {recent.length === 0 && lib.songs.length > 0 && (
          <>
            <div className="eyebrow" style={{ marginTop: 24 }}>
              Песни
            </div>
            <div className="group">
              {lib.songs.slice(0, 6).map((s) => (
                <SongRow key={s.id} song={s} />
              ))}
            </div>
          </>
        )}
      </div>
      {menu && <LibraryMenu onClose={() => setMenu(false)} />}
    </div>
  )
}
