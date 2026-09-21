import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  if (!needRefresh) return null
  return (
    <div className="toast" role="status">
      <span>Доступна новая версия</span>
      <button onClick={() => updateServiceWorker(true)}>Обновить</button>
      <button onClick={() => setNeedRefresh(false)} style={{ color: 'var(--fg-muted)', marginLeft: 8 }}>
        Позже
      </button>
    </div>
  )
}
