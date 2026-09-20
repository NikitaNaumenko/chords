import { useEffect } from 'react'

/** Не даёт экрану гаснуть, пока компонент смонтирован (iOS 16.4+). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let disposed = false
    const acquire = async () => {
      try {
        if (document.visibilityState === 'visible') lock = await navigator.wakeLock.request('screen')
      } catch {
        // отклонено системой (низкий заряд и т. п.) — не страшно
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !disposed) acquire()
    }
    acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release().catch(() => {})
    }
  }, [active])
}
