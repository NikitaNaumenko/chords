import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { NavBar } from '../components/NavBar'
import { Sheet } from '../components/Sheet'
import { SongRow } from '../components/SongRow'
import { initials, pluralSongs } from '../lib/format'
import { useLibrary } from '../songs/library'

export function SetlistPage() {
  const { id = '' } = useParams()
  const lib = useLibrary()
  const navigate = useNavigate()
  const setlist = lib.setlists.find((s) => s.id === id)
  const [adding, setAdding] = useState(false)
  const [picked, setPicked] = useState<Set<string>>(new Set())

  const songs = useMemo(() => (setlist ? setlist.songIds.map((sid) => lib.getSong(sid)).filter((s) => s != null) : []), [setlist, lib])
  const candidates = useMemo(() => lib.songs.filter((s) => !setlist?.songIds.includes(s.id)), [lib.songs, setlist])

  if (!lib.ready) return null
  if (!setlist) {
    return (
      <div className="screen">
        <div className="page empty">Сет-лист не найден</div>
      </div>
    )
  }

  const move = (i: number, d: -1 | 1) => {
    const ids = [...setlist.songIds]
    const j = i + d
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    lib.updateSetlist({ ...setlist, songIds: ids })
  }
  const remove = (sid: string) => lib.updateSetlist({ ...setlist, songIds: setlist.songIds.filter((x) => x !== sid) })
  const rename = () => {
    const name = prompt('Название', setlist.name)?.trim()
    if (name && name !== setlist.name) lib.updateSetlist({ ...setlist, name })
  }
  const del = async () => {
    if (!confirm(`Удалить сет-лист «${setlist.name}»? Песни останутся.`)) return
    await lib.deleteSetlist(setlist.id)
    navigate('/book', { replace: true })
  }
  const addPicked = () => {
    if (picked.size) lib.updateSetlist({ ...setlist, songIds: [...setlist.songIds, ...candidates.filter((c) => picked.has(c.id)).map((c) => c.id)] })
    setPicked(new Set())
    setAdding(false)
  }
  const play = () => songs[0] && navigate(`/song/${encodeURIComponent(songs[0].id)}?setlist=${encodeURIComponent(setlist.id)}`)

  return (
    <div className="screen flush">
      <NavBar
        back="Песенник"
        fallback="/book"
        right={
          <>
            <button className="icon-btn plain" onClick={rename} aria-label="Переименовать" style={{ fontSize: 15 }}>
              ✎
            </button>
            <button className="icon-btn plain" onClick={del} aria-label="Удалить" style={{ color: 'var(--danger)', fontSize: 15 }}>
              ✕
            </button>
          </>
        }
      />
      <div className="page gutter">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18 }}>
          <div className="avatar" style={{ width: 52, height: 52, fontSize: 22 }}>
            {initials(setlist.name)[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="display" style={{ fontSize: 28 }}>
              {setlist.name}
            </h1>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
              {pluralSongs(songs.length)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="primary-btn" onClick={play} disabled={!songs.length} style={{ flex: 1 }}>
            ▶ Играть
          </button>
          <button className="primary-btn ghost" onClick={() => setAdding(true)} style={{ flex: 1 }}>
            + Добавить
          </button>
        </div>

        <div className="group" style={{ marginTop: 18 }}>
          {songs.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4, borderBottom: i < songs.length - 1 ? '1px solid var(--line)' : undefined, paddingRight: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <SongRow song={s} to={`/song/${encodeURIComponent(s.id)}?setlist=${encodeURIComponent(setlist.id)}`} side={String(i + 1)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button className="icon-btn" style={{ width: 28, height: 24, borderRadius: 8, fontSize: 11 }} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Выше">
                  ▲
                </button>
                <button className="icon-btn" style={{ width: 28, height: 24, borderRadius: 8, fontSize: 11 }} onClick={() => move(i, 1)} disabled={i === songs.length - 1} aria-label="Ниже">
                  ▼
                </button>
              </div>
              <button className="icon-btn" style={{ width: 28, height: 28, fontSize: 12, color: 'var(--danger)' }} onClick={() => remove(s.id)} aria-label="Убрать">
                ✕
              </button>
            </div>
          ))}
        </div>
        {songs.length === 0 && <div className="empty">Список пуст — добавьте песни.</div>}
      </div>

      {adding && (
        <Sheet
          onClose={() => {
            setAdding(false)
            setPicked(new Set())
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Добавить в «{setlist.name}»
          </div>
          <div className="group" style={{ maxHeight: '50vh', overflowY: 'auto', boxShadow: 'none', border: '1px solid var(--line-2)' }}>
            {candidates.map((s) => {
              const on = picked.has(s.id)
              return (
                <button
                  key={s.id}
                  className="row"
                  onClick={() =>
                    setPicked((prev) => {
                      const next = new Set(prev)
                      if (next.has(s.id)) next.delete(s.id)
                      else next.add(s.id)
                      return next
                    })
                  }
                  style={on ? { background: 'var(--accent-soft)' } : undefined}
                >
                  <div style={{ width: 22, height: 22, borderRadius: 7, border: `1.5px solid ${on ? 'var(--accent)' : 'var(--fg-tertiary)'}`, background: on ? 'var(--accent)' : 'none', color: 'var(--on-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flex: 'none' }}>
                    {on ? '✓' : ''}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="title">{s.title}</div>
                    <div className="sub">{s.artist ?? s.key ?? ''}</div>
                  </div>
                </button>
              )
            })}
          </div>
          {candidates.length === 0 && <div className="empty">Все песни уже в списке</div>}
          <button className="primary-btn" style={{ marginTop: 14 }} onClick={addPicked} disabled={!picked.size}>
            Добавить {picked.size ? `(${picked.size})` : ''}
          </button>
        </Sheet>
      )}
    </div>
  )
}
