import { useEffect, useState } from 'react'
import { guitarDbSync, loadGuitarDb } from '../chords/lookup'

/** База аккордов: null, пока грузится. */
export function useGuitarDb() {
  const [db, setDb] = useState(guitarDbSync)
  useEffect(() => {
    if (db) return
    let alive = true
    loadGuitarDb().then((d) => alive && setDb(d)).catch(console.error)
    return () => {
      alive = false
    }
  }, [db])
  return db
}
