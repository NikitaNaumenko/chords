import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { ChordDiagram } from '../chords/ChordDiagram'
import { lookupChord } from '../chords/lookup'
import { ChordSheet } from '../components/ChordSheet'
import { Sheet } from '../components/Sheet'
import { SongRenderer } from '../components/SongRenderer'
import { SPEEDS, useAutoScroll } from '../hooks/useAutoScroll'
import { useGuitarDb } from '../hooks/useGuitarDb'
import { useWakeLock } from '../hooks/useWakeLock'
import { fileNameFor, pluralChords } from '../lib/format'
import { shareOrDownload } from '../lib/share'
import { useLibrary } from '../songs/library'
import { buildSections, flattenSections, uniqueChords } from '../songs/model'
import { parseSong } from '../songs/parse'
import { transposeSong } from '../songs/transpose'
import type { ViewMode } from '../songs/types'

const MODE_LABEL: Record<ViewMode, string> = { classic: 'Песенник', karaoke: 'Караоке', track: 'Дорожка' }
const MODES: ViewMode[] = ['classic', 'karaoke', 'track']
const MODE_NAME: Record<ViewMode, string> = { classic: 'Классика', karaoke: 'Караоке', track: 'Дорожка' }

export function SongPage() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const lib = useLibrary()
  const db = useGuitarDb()
  const song = lib.getSong(id)
  const settings = lib.settings[id] ?? lib.getSettings(id)
  const setlist = params.get('setlist') ? lib.setlists.find((s) => s.id === params.get('setlist')) : undefined

  const bodyRef = useRef<HTMLDivElement>(null)
  const [sheetChord, setSheetChord] = useState<string | null>(null)
  const [menu, setMenu] = useState(false)
  const [setlistPicker, setSetlistPicker] = useState(false)
  const [capoOpen, setCapoOpen] = useState(false)
  const [active, setActive] = useState(0)
  const mode: ViewMode = settings.mode ?? 'classic'

  useWakeLock(true)
  const { playing, toggle, stop } = useAutoScroll(bodyRef, settings.speed)

  const parsed = useMemo(() => (song ? parseSong(song.text) : null), [song])
  const delta = settings.transpose - settings.capo
  const displayed = useMemo(() => (parsed ? transposeSong(parsed.song, delta) : null), [parsed, delta])
  const sounding = useMemo(() => (parsed ? transposeSong(parsed.song, settings.transpose) : null), [parsed, settings.transpose])
  const sections = useMemo(() => (displayed ? buildSections(displayed) : []), [displayed])
  const flat = useMemo(() => flattenSections(sections), [sections])
  const chords = useMemo(() => uniqueChords(sections), [sections])

  // отметка «недавнее»
  useEffect(() => {
    if (song) lib.updateSettings(id, { lastOpenedAt: Date.now() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // восстановить позицию, если пришли с карточки «Продолжить»
  useEffect(() => {
    const el = bodyRef.current
    if (!el || params.get('resume') !== '1') return
    const p = lib.getSettings(id).progress
    if (p > 0.02 && p < 0.98) {
      requestAnimationFrame(() => {
        el.scrollTop = p * (el.scrollHeight - el.clientHeight)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // прогресс чтения, подпись секции и активная строка
  const [progress, setProgress] = useState(0)
  const saveTimer = useRef(0)
  const onScroll = useCallback(() => {
    const el = bodyRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    const p = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0
    setProgress(p)
    const focusY = el.scrollTop + el.clientHeight * 0.3
    let label: string | null = null
    el.querySelectorAll<HTMLElement>('[data-section]').forEach((s) => {
      if (s.offsetTop <= focusY) label = s.dataset.label || label
    })
    if (mode !== 'classic') {
      let best = 0
      let bestDist = Infinity
      el.querySelectorAll<HTMLElement>('[data-line]').forEach((l) => {
        const d = Math.abs(l.offsetTop + l.offsetHeight / 2 - focusY)
        if (d < bestDist) {
          bestDist = d
          best = Number(l.dataset.line)
        }
      })
      setActive(best)
    }
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => lib.updateSettings(id, { progress: p, section: label }), 600)
  }, [id, lib, mode])

  useEffect(() => () => window.clearTimeout(saveTimer.current), [])

  const onLine = (i: number) => {
    setActive(i)
    stop()
    bodyRef.current?.querySelector<HTMLElement>(`[data-line="${i}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  if (!lib.ready) return null
  if (!song || !parsed || !displayed) {
    return (
      <div className="screen no-tabs">
        <div className="page">
          <button className="icon-btn" onClick={() => navigate('/')}>
            ‹
          </button>
          <div className="empty">Песня не найдена</div>
        </div>
      </div>
    )
  }

  const keyLabel = parsed.key && sounding?.key ? sounding.key : settings.transpose === 0 ? '0' : settings.transpose > 0 ? `+${settings.transpose}` : `−${-settings.transpose}`
  const setlistIndex = setlist ? setlist.songIds.indexOf(id) : -1
  const goInSetlist = (d: -1 | 1) => {
    if (!setlist) return
    const next = setlist.songIds[setlistIndex + d]
    if (next) navigate(`/song/${encodeURIComponent(next)}?setlist=${encodeURIComponent(setlist.id)}`)
  }
  const cycleSpeed = () => {
    const i = SPEEDS.indexOf(settings.speed)
    lib.updateSettings(id, { speed: SPEEDS[(i + 1) % SPEEDS.length] })
  }
  const fontSize = settings.fontSize
  const bumpFont = (d: number) => {
    const base = fontSize ?? (window.innerWidth >= 700 ? 19 : 16)
    lib.updateSettings(id, { fontSize: Math.min(30, Math.max(12, base + d)) })
  }
  const share = () => shareOrDownload(fileNameFor(song.title), song.text)
  const revert = async () => {
    if (confirm('Вернуть версию из репозитория? Локальная правка будет удалена.')) {
      await lib.removeLocal(id)
      setMenu(false)
    }
  }
  const del = async () => {
    if (confirm(`Удалить «${song.title}»?`)) {
      await lib.removeLocal(id)
      navigate('/book?tab=all', { replace: true })
    }
  }
  const addToSetlist = (setId: string) => {
    const s = lib.setlists.find((x) => x.id === setId)
    if (s && !s.songIds.includes(id)) lib.updateSetlist({ ...s, songIds: [...s.songIds, id] })
    setSetlistPicker(false)
    setMenu(false)
  }
  const activeChord = flat[active]?.chord ?? ''

  return (
    <div className="song-layout">
      <div className="song-main">
        <div className="song-head">
          <button className="icon-btn" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} aria-label="Назад">
            ‹
          </button>
          <div className="label">{setlist ? setlist.name : MODE_LABEL[mode]}</div>
          <button className={`icon-btn${settings.favorite ? ' active' : ''}`} onClick={() => lib.updateSettings(id, { favorite: !settings.favorite })} aria-label="В избранное" style={{ fontSize: 14 }}>
            {settings.favorite ? '★' : '☆'}
          </button>
          <button className="icon-btn" onClick={() => setMenu(true)} aria-label="Ещё" style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1 }}>
            ⋯
          </button>
        </div>
        <div className="page" style={{ width: '100%' }}>
          <div className="song-title">
            <h1>{song.title}</h1>
            <div className="meta">
              {song.artist && (
                <>
                  <span>{song.artist}</span>
                  <span className="dot">·</span>
                </>
              )}
              {parsed.tempo && (
                <>
                  <span>{parsed.tempo} BPM</span>
                  <span className="dot">·</span>
                </>
              )}
              <span>{pluralChords(chords.length)}</span>
              {song.overridden && <span className="badge">изменено локально</span>}
            </div>
          </div>
          <div className="song-controls">
            <div className="stepper">
              <button onClick={() => lib.updateSettings(id, { transpose: Math.max(-11, settings.transpose - 1) })} aria-label="Ниже на полтона">
                −
              </button>
              <div className="val">{keyLabel}</div>
              <button onClick={() => lib.updateSettings(id, { transpose: Math.min(11, settings.transpose + 1) })} aria-label="Выше на полтона">
                +
              </button>
            </div>
            <button className={`chip${settings.capo ? ' on' : ''}`} onClick={() => setCapoOpen((v) => !v)}>
              <span>Каподастр</span>
              <b>{settings.capo ? settings.capo : 'нет'}</b>
            </button>
            {(settings.transpose !== 0 || settings.capo !== 0) && (
              <button className="chip" onClick={() => lib.updateSettings(id, { transpose: 0, capo: 0 })}>
                Сброс
              </button>
            )}
            {capoOpen && (
              <div className="stepper" style={{ width: '100%' }}>
                <button onClick={() => lib.updateSettings(id, { capo: Math.max(0, settings.capo - 1) })} aria-label="Капо ниже">
                  −
                </button>
                <div className="val" style={{ flex: 1, color: 'var(--fg)', fontWeight: 600 }}>
                  {settings.capo ? `Капо ${settings.capo} — аппликатуры как в ${displayed.key ?? 'другой тональности'}` : 'Без каподастра'}
                </div>
                <button onClick={() => lib.updateSettings(id, { capo: Math.min(9, settings.capo + 1) })} aria-label="Капо выше">
                  +
                </button>
              </div>
            )}
          </div>
          <div className="segmented" style={{ margin: '0 var(--gutter) 10px' }}>
            {MODES.map((m) => (
              <button key={m} className={mode === m ? 'on' : ''} onClick={() => lib.updateSettings(id, { mode: m })}>
                {MODE_NAME[m]}
              </button>
            ))}
          </div>
          {setlist && (
            <div className="setlist-nav">
              <button className="chip" onClick={() => goInSetlist(-1)} disabled={setlistIndex <= 0}>
                ‹ Пред.
              </button>
              <div className="mid">
                {setlistIndex + 1} / {setlist.songIds.length}
              </div>
              <button className="chip" onClick={() => goInSetlist(1)} disabled={setlistIndex >= setlist.songIds.length - 1}>
                След. ›
              </button>
            </div>
          )}
        </div>

        <div ref={bodyRef} className="song-body" onScroll={onScroll} style={fontSize ? ({ '--lyric-size': `${fontSize}px` } as React.CSSProperties) : undefined}>
          <div className="page">
            {mode === 'track' && (
              <div className="ribbon" style={{ marginBottom: 12 }}>
                {chords.map((c) => {
                  const on = c === activeChord
                  return (
                    <button key={c} className={on ? 'on' : ''} onClick={() => setSheetChord(c)}>
                      <ChordDiagram position={db ? (lookupChord(db, c)?.positions[0] ?? null) : null} name={c} dotColor={on ? 'var(--accent)' : 'var(--dot-muted)'} />
                      <div className="name">{c}</div>
                    </button>
                  )
                })}
              </div>
            )}
            {parsed.error && <div className="comment" style={{ marginBottom: 12, color: 'var(--danger)' }}>Не удалось полностью разобрать: {parsed.error}</div>}
            <SongRenderer mode={mode} sections={sections} flat={flat} active={active} onChord={setSheetChord} onLine={onLine} />
          </div>
        </div>

        <div className="scroll-pill">
          <button className={`play${playing ? ' paused' : ''}`} onClick={toggle} aria-label={playing ? 'Пауза' : 'Автопрокрутка'}>
            {playing ? '❚❚' : '▶'}
          </button>
          <div className="info">
            <span>Автопрокрутка</span>
            <div className="progress">
              <div style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          </div>
          <button className="speed" onClick={cycleSpeed}>
            ×{settings.speed}
          </button>
        </div>
      </div>

      <aside className="song-side">
        <div className="eyebrow">Аккорды песни</div>
        <div className="chord-grid">
          {chords.map((c) => (
            <button key={c} className={c === activeChord ? 'on' : ''} onClick={() => setSheetChord(c)}>
              <ChordDiagram position={db ? (lookupChord(db, c)?.positions[0] ?? null) : null} name={c} />
              <div className="cname">{c}</div>
            </button>
          ))}
        </div>
      </aside>

      {sheetChord && <ChordSheet chord={sheetChord} onClose={() => setSheetChord(null)} />}

      {menu && !setlistPicker && (
        <Sheet onClose={() => setMenu(false)}>
          <div className="menu">
            <button onClick={() => navigate(`/song/${encodeURIComponent(id)}/edit`)}>
              <span>✎</span> Редактировать
            </button>
            <button onClick={() => setSetlistPicker(true)}>
              <span>☰</span> В сет-лист
            </button>
            <button onClick={share}>
              <span>⇪</span> Поделиться .cho
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: 'var(--surface)', fontSize: 15, fontWeight: 600 }}>
              <span>Aa</span> Размер текста
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <button className="icon-btn" onClick={() => bumpFont(-1)} aria-label="Меньше">
                  A−
                </button>
                <button className="icon-btn" onClick={() => bumpFont(1)} aria-label="Больше">
                  A+
                </button>
              </div>
            </div>
            {song.overridden && (
              <button onClick={revert}>
                <span>↺</span> Вернуть версию из репозитория
              </button>
            )}
            {song.source === 'local' && (
              <button className="danger" onClick={del}>
                <span>✕</span> Удалить песню
              </button>
            )}
          </div>
        </Sheet>
      )}
      {menu && setlistPicker && (
        <Sheet
          onClose={() => {
            setSetlistPicker(false)
            setMenu(false)
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Добавить в сет-лист
          </div>
          <div className="menu">
            {lib.setlists.map((s) => (
              <button key={s.id} onClick={() => addToSetlist(s.id)} disabled={s.songIds.includes(id)}>
                {s.name} <span className="k">{s.songIds.includes(id) ? 'уже там' : `${s.songIds.length}`}</span>
              </button>
            ))}
            <button
              onClick={async () => {
                const name = prompt('Название сет-листа')?.trim()
                if (!name) return
                const s = await lib.createSetlist(name)
                await lib.updateSetlist({ ...s, songIds: [id] })
                setSetlistPicker(false)
                setMenu(false)
              }}
            >
              <span>＋</span> Новый сет-лист
            </button>
          </div>
        </Sheet>
      )}
    </div>
  )
}
