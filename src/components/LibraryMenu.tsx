import { useNavigate } from 'react-router'
import { pickFiles, shareOrDownload } from '../lib/share'
import { useLibrary } from '../songs/library'
import type { Backup } from '../songs/types'
import { Sheet } from './Sheet'

/** Меню библиотеки: новая песня, импорт .cho, резервная копия. */
export function LibraryMenu({ onClose }: { onClose: () => void }) {
  const lib = useLibrary()
  const navigate = useNavigate()

  const importCho = async () => {
    const files = await pickFiles('.cho,.chordpro,.crd,.pro,.txt,text/plain')
    if (!files.length) return
    const items = await Promise.all(files.map(async (f) => ({ name: f.name, text: await f.text() })))
    const n = await lib.importTexts(items)
    onClose()
    if (n) navigate('/book?tab=all')
  }

  const backup = async () => {
    const b = lib.makeBackup()
    const date = new Date().toISOString().slice(0, 10)
    await shareOrDownload(`chords-backup-${date}.json`, JSON.stringify(b, null, 2), 'application/json')
    onClose()
  }

  const restore = async () => {
    const [file] = await pickFiles('.json,application/json', false)
    if (!file) return
    try {
      const data = JSON.parse(await file.text()) as Backup
      const count = data.localSongs?.length ?? 0
      if (!confirm(`Заменить локальные песни, настройки и сет-листы данными из копии (${count} песен)?`)) return
      await lib.restoreBackup(data)
      onClose()
    } catch (e) {
      alert('Не удалось прочитать копию: ' + (e as Error).message)
    }
  }

  return (
    <Sheet onClose={onClose}>
      <div className="menu">
        <button
          onClick={() => {
            onClose()
            navigate('/new')
          }}
        >
          <span>＋</span> Новая песня
        </button>
        <button onClick={importCho}>
          <span>↓</span> Импорт .cho из «Файлов»
        </button>
        <button onClick={backup}>
          <span>⇪</span> Резервная копия <span className="k">JSON</span>
        </button>
        <button onClick={restore}>
          <span>↺</span> Восстановить из копии
        </button>
      </div>
      <p className="muted" style={{ fontSize: 12.5, marginTop: 14, lineHeight: 1.5 }}>
        Песни из репозитория обновляются вместе с приложением. Всё, что добавлено или изменено здесь, живёт на этом устройстве — сохраняйте копию.
      </p>
    </Sheet>
  )
}
