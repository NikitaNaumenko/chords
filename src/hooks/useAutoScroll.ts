import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

/** Базовая скорость при множителе ×1, px/с */
export const BASE_SPEED = 28
export const SPEEDS = [0.5, 0.75, 1, 1.5, 2]

/**
 * Плавная автопрокрутка контейнера. Любое касание/колесо ставит на паузу.
 * Доехав до конца — останавливается.
 */
export function useAutoScroll(ref: RefObject<HTMLElement | null>, speed: number) {
  const [playing, setPlaying] = useState(false)
  const acc = useRef(0)
  const speedRef = useRef(speed)
  speedRef.current = speed

  useEffect(() => {
    const el = ref.current
    if (!playing || !el) return
    let raf = 0
    let last = performance.now()
    acc.current = 0
    const step = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      acc.current += (BASE_SPEED * speedRef.current * dt) / 1000
      const px = Math.floor(acc.current)
      if (px >= 1) {
        acc.current -= px
        el.scrollTop += px
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
          setPlaying(false)
          return
        }
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    const pause = () => setPlaying(false)
    el.addEventListener('touchstart', pause, { passive: true })
    el.addEventListener('wheel', pause, { passive: true })
    el.addEventListener('pointerdown', pause, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('touchstart', pause)
      el.removeEventListener('wheel', pause)
      el.removeEventListener('pointerdown', pause)
    }
  }, [playing, ref])

  const toggle = useCallback(() => setPlaying((p) => !p), [])
  return { playing, toggle, stop: () => setPlaying(false) }
}
