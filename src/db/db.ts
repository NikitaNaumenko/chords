import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { LocalSong, Setlist, SongSettings } from '../songs/types'

interface ChordsDB extends DBSchema {
  localSongs: { key: string; value: LocalSong }
  settings: { key: string; value: SongSettings }
  setlists: { key: string; value: Setlist }
}

let dbPromise: Promise<IDBPDatabase<ChordsDB>> | null = null

export function getDB() {
  dbPromise ??= openDB<ChordsDB>('chords', 1, {
    upgrade(db) {
      db.createObjectStore('localSongs', { keyPath: 'id' })
      db.createObjectStore('settings', { keyPath: 'songId' })
      db.createObjectStore('setlists', { keyPath: 'id' })
    },
  })
  return dbPromise
}

export async function loadAll() {
  const db = await getDB()
  const [localSongs, settings, setlists] = await Promise.all([
    db.getAll('localSongs'),
    db.getAll('settings'),
    db.getAll('setlists'),
  ])
  return { localSongs, settings, setlists }
}

export const putLocalSong = async (s: LocalSong) => (await getDB()).put('localSongs', s)
export const deleteLocalSong = async (id: string) => (await getDB()).delete('localSongs', id)
export const putSettings = async (s: SongSettings) => (await getDB()).put('settings', s)
export const putSetlist = async (s: Setlist) => (await getDB()).put('setlists', s)
export const deleteSetlist = async (id: string) => (await getDB()).delete('setlists', id)

export async function replaceAll(data: { localSongs: LocalSong[]; settings: SongSettings[]; setlists: Setlist[] }) {
  const db = await getDB()
  const tx = db.transaction(['localSongs', 'settings', 'setlists'], 'readwrite')
  await Promise.all([
    tx.objectStore('localSongs').clear(),
    tx.objectStore('settings').clear(),
    tx.objectStore('setlists').clear(),
  ])
  await Promise.all([
    ...data.localSongs.map((s) => tx.objectStore('localSongs').put(s)),
    ...data.settings.map((s) => tx.objectStore('settings').put(s)),
    ...data.setlists.map((s) => tx.objectStore('setlists').put(s)),
  ])
  await tx.done
}

export function requestPersistentStorage() {
  if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
    navigator.storage.persist().catch(() => {})
  }
}
