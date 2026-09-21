import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as db from '../db/db'
import { parseSong, titleFor } from './parse'
import { isRepoId, repoFiles } from './repo'
import { defaultSettings, type Backup, type LocalSong, type Setlist, type SongRecord, type SongSettings } from './types'

interface LibraryApi {
  ready: boolean
  songs: SongRecord[]
  settings: Record<string, SongSettings>
  setlists: Setlist[]
  getSong: (id: string) => SongRecord | undefined
  getSettings: (id: string) => SongSettings
  updateSettings: (id: string, patch: Partial<SongSettings>) => void
  /** Сохраняет текст; для песни из репо создаёт локальную правку. Возвращает id. */
  saveSong: (id: string | null, text: string) => Promise<string>
  /** Удаляет локальную песню или сбрасывает правку песни из репо. */
  removeLocal: (id: string) => Promise<void>
  createSetlist: (name: string) => Promise<Setlist>
  updateSetlist: (s: Setlist) => Promise<void>
  deleteSetlist: (id: string) => Promise<void>
  importTexts: (items: { name: string; text: string }[]) => Promise<number>
  makeBackup: () => Backup
  restoreBackup: (b: Backup) => Promise<void>
}

const LibraryContext = createContext<LibraryApi | null>(null)

const newLocalId = () => 'local:' + (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2))

function toRecord(id: string, text: string, fallbackTitle: string, source: SongRecord['source'], overridden: boolean, updatedAt: number): SongRecord {
  const parsed = parseSong(text)
  return {
    id,
    source,
    overridden,
    text,
    title: titleFor(parsed, fallbackTitle),
    artist: parsed.artist,
    key: parsed.key,
    capo: parsed.capo,
    chords: parsed.chords,
    updatedAt,
  }
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [localSongs, setLocalSongs] = useState<Record<string, LocalSong>>({})
  const [settings, setSettings] = useState<Record<string, SongSettings>>({})
  const [setlists, setSetlists] = useState<Setlist[]>([])
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  useEffect(() => {
    let cancelled = false
    db.requestPersistentStorage()
    db.loadAll()
      .then((data) => {
        if (cancelled) return
        setLocalSongs(Object.fromEntries(data.localSongs.map((s) => [s.id, s])))
        setSettings(Object.fromEntries(data.settings.map((s) => [s.songId, s])))
        setSetlists(data.setlists.sort((a, b) => b.updatedAt - a.updatedAt))
      })
      .catch((e) => console.error('IndexedDB недоступна', e))
      .finally(() => !cancelled && setReady(true))
    return () => {
      cancelled = true
    }
  }, [])

  const songs = useMemo(() => {
    const out: SongRecord[] = []
    for (const f of repoFiles) {
      const local = localSongs[f.id]
      out.push(local ? toRecord(f.id, local.text, f.fileName, 'repo', true, local.updatedAt) : toRecord(f.id, f.text, f.fileName, 'repo', false, 0))
    }
    for (const l of Object.values(localSongs)) {
      if (!isRepoId(l.id)) out.push(toRecord(l.id, l.text, 'Без названия', 'local', false, l.updatedAt))
    }
    return out.sort((a, b) => a.title.localeCompare(b.title, 'ru'))
  }, [localSongs])

  const songsById = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs])
  const getSong = useCallback((id: string) => songsById.get(id), [songsById])

  const getSettings = useCallback((id: string) => settingsRef.current[id] ?? defaultSettings(id), [])

  const updateSettings = useCallback((id: string, patch: Partial<SongSettings>) => {
    const next = { ...(settingsRef.current[id] ?? defaultSettings(id)), ...patch, songId: id }
    settingsRef.current = { ...settingsRef.current, [id]: next }
    setSettings(settingsRef.current)
    db.putSettings(next).catch(console.error)
  }, [])

  const saveSong = useCallback(async (id: string | null, text: string) => {
    const songId = id ?? newLocalId()
    const rec: LocalSong = { id: songId, text, updatedAt: Date.now() }
    await db.putLocalSong(rec)
    setLocalSongs((prev) => ({ ...prev, [songId]: rec }))
    return songId
  }, [])

  const removeLocal = useCallback(async (id: string) => {
    await db.deleteLocalSong(id)
    setLocalSongs((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const createSetlist = useCallback(async (name: string) => {
    const s: Setlist = { id: 'set:' + (crypto.randomUUID?.() ?? Date.now()), name, songIds: [], updatedAt: Date.now() }
    await db.putSetlist(s)
    setSetlists((prev) => [s, ...prev])
    return s
  }, [])

  const updateSetlist = useCallback(async (s: Setlist) => {
    const next = { ...s, updatedAt: Date.now() }
    await db.putSetlist(next)
    setSetlists((prev) => prev.map((x) => (x.id === s.id ? next : x)))
  }, [])

  const deleteSetlist = useCallback(async (id: string) => {
    await db.deleteSetlist(id)
    setSetlists((prev) => prev.filter((x) => x.id !== id))
  }, [])

  // Повторный импорт того же файла обновляет песню, а не создаёт дубль:
  // совпадение ищем по названию + исполнителю (без учёта регистра и пробелов).
  const importTexts = useCallback(
    async (items: { name: string; text: string }[]) => {
      let n = 0
      const added: Record<string, LocalSong> = {}
      const keyOf = (title: string, artist: string | null) => `${title}\u0000${artist ?? ''}`.toLowerCase().replace(/\s+/g, ' ').trim()
      const existing = new Map(songs.map((s) => [keyOf(s.title, s.artist), s.id]))
      for (const it of items) {
        const text = it.text.trim()
        if (!text) continue
        const fallback = it.name.replace(/\.[^.]+$/, '')
        const hasTitle = /\{(title|t):/i.test(text)
        const body = hasTitle ? text : `{title: ${fallback}}\n${text}`
        const parsed = parseSong(body)
        const id = existing.get(keyOf(titleFor(parsed, fallback), parsed.artist)) ?? newLocalId()
        const rec: LocalSong = { id, text: body, updatedAt: Date.now() }
        await db.putLocalSong(rec)
        added[rec.id] = rec
        n++
      }
      setLocalSongs((prev) => ({ ...prev, ...added }))
      return n
    },
    [songs],
  )

  const makeBackup = useCallback(
    (): Backup => ({
      version: 1,
      exportedAt: Date.now(),
      localSongs: Object.values(localSongs),
      settings: Object.values(settings),
      setlists,
    }),
    [localSongs, settings, setlists],
  )

  const restoreBackup = useCallback(async (b: Backup) => {
    if (b.version !== 1 || !Array.isArray(b.localSongs)) throw new Error('Неизвестный формат резервной копии')
    await db.replaceAll({ localSongs: b.localSongs, settings: b.settings ?? [], setlists: b.setlists ?? [] })
    setLocalSongs(Object.fromEntries(b.localSongs.map((s) => [s.id, s])))
    settingsRef.current = Object.fromEntries((b.settings ?? []).map((s) => [s.songId, s]))
    setSettings(settingsRef.current)
    setSetlists([...(b.setlists ?? [])].sort((a, c) => c.updatedAt - a.updatedAt))
  }, [])

  const api = useMemo<LibraryApi>(
    () => ({
      ready,
      songs,
      settings,
      setlists,
      getSong,
      getSettings,
      updateSettings,
      saveSong,
      removeLocal,
      createSetlist,
      updateSetlist,
      deleteSetlist,
      importTexts,
      makeBackup,
      restoreBackup,
    }),
    [ready, songs, settings, setlists, getSong, getSettings, updateSettings, saveSong, removeLocal, createSetlist, updateSetlist, deleteSetlist, importTexts, makeBackup, restoreBackup],
  )

  return <LibraryContext.Provider value={api}>{children}</LibraryContext.Provider>
}

export function useLibrary(): LibraryApi {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary вне LibraryProvider')
  return ctx
}
