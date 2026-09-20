import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { LibraryMenu } from '../components/LibraryMenu'
import { SongRow } from '../components/SongRow'
import { chordsSummary, initials, pluralSongs } from '../lib/format'
import { useLibrary } from '../songs/library'

export function BookPage() {
  const lib = useLibrary()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'all' ? 'all' : 'lists'
  const [query, setQuery] = useState('')
  const [onlyFav, setOnlyFav] = useState(false)
  const [menu, setMenu] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return lib.songs.filter((s) => {
      if (onlyFav && !lib.settings[s.id]?.favorite) return false
      if (!q) return true
      return s.title.toLowerCase().includes(q) || (s.artist ?? '').toLowerCase().includes(q) || s.chords.some((c) => c.toLowerCase() === q)
    })
  }, [lib.songs, lib.settings, query, onlyFav])

  const newSetlist = async () => {
    const name = prompt('Название сет-листа', 'У костра')?.trim()
    if (!name) return
    const s = await lib.createSetlist(name)
    navigate(`/setlist/${encodeURIComponent(s.id)}`)
  }

  return (
    <div className="screen">
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <h1 className="display">Песенник</h1>
          <button className="icon-btn" aria-label="Меню" onClick={() => setMenu(true)} style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1 }}>
            ⋯
          </button>
        </div>
        <div className="segmented" style={{ marginTop: 16 }}>
          <button className={tab === 'lists' ? 'on' : ''} onClick={() => setParams({})}>
            Сет-листы
          </button>
          <button className={tab === 'all' ? 'on' : ''} onClick={() => setParams({ tab: 'all' })}>
            Все песни
          </button>
        </div>

        {tab === 'lists' ? (
          <div className="setlist-grid" style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lib.setlists.map((l) => {
              const songs = l.songIds.map((id) => lib.getSong(id)).filter((s) => s != null)
              const chords = [...new Set(songs.flatMap((s) => s.chords))]
              return (
                <Link key={l.id} className="card sm tap" to={`/setlist/${encodeURIComponent(l.id)}`} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="avatar" style={{ width: 46, height: 46, borderRadius: 13, fontSize: 19, color: 'rgba(244,239,230,.4)' }}>
                    {initials(l.name)[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{l.name}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(244,239,230,.56)', marginTop: 3 }}>
                      {pluralSongs(songs.length)}
                      {chords.length > 0 && ` · ${chordsSummary(chords, 3)}`}
                    </div>
                  </div>
                  <div style={{ color: 'rgba(244,239,230,.52)', fontSize: 15 }}>›</div>
                </Link>
              )
            })}
            <button className="card sm dashed" onClick={newSetlist}>
              + Новый сет-лист
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <div className="search" style={{ flex: 1 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(244,239,230,.5)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input placeholder="Название, исполнитель или аккорд" value={query} onChange={(e) => setQuery(e.target.value)} inputMode="search" />
                {query && (
                  <button onClick={() => setQuery('')} style={{ color: 'var(--fg-60)' }}>
                    ✕
                  </button>
                )}
              </div>
              <button className={`chip ${onlyFav ? 'on' : ''}`} onClick={() => setOnlyFav((v) => !v)} aria-pressed={onlyFav} style={{ minHeight: 40 }}>
                ★
              </button>
            </div>
            <div className="list" style={{ marginTop: 8 }}>
              {filtered.map((s) => (
                <SongRow key={s.id} song={s} favorite={lib.settings[s.id]?.favorite} />
              ))}
              {filtered.length === 0 && <div className="empty">{lib.songs.length ? 'Ничего не нашлось' : 'Пока нет песен. Добавьте .cho в папку songs/ или создайте новую.'}</div>}
            </div>
            <button className="card sm dashed" style={{ marginTop: 12 }} onClick={() => navigate('/new')}>
              + Новая песня
            </button>
          </>
        )}
      </div>
      {menu && <LibraryMenu onClose={() => setMenu(false)} />}
    </div>
  )
}
