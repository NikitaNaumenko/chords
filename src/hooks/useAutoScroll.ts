import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

/** Базовая скорость при множителе ×1, px/с */
export const BASE_SPEED = 28
export const SPEEDS = [0.5, 0.75, 1, 1.5, 2]

/**
 * Плавная автопрокрутка контейнера: позиция считается от времени, а не
 * прибавляется целыми пикселями, поэтому на Retina движение субпиксельное.
 * Ручная прокрутка (свайп/колесо) ставит на паузу, простой тап — нет.
 * Доехав до конца — останавливается.
 */
export function useAutoScroll(ref: RefObject<HTMLElement | null>, speed: number) {
  const [playing, setPlaying] = useState(false)
  const speedRef = useRef(speed)
  speedRef.current = speed

  useEffect(() => {
    const el = ref.current
    if (!playing || !el) return
    let raf = 0
    // якорь: откуда и с какого момента считаем; переставляется при смене скорости
    let baseTop = el.scrollTop
    let baseTime = performance.now()
    let baseSpeed = speedRef.current
    const step = (now: number) => {
      if (speedRef.current !== baseSpeed) {
        baseTop = el.scrollTop
        baseTime = now
        baseSpeed = speedRef.current
      }
      el.scrollTop = baseTop + (BASE_SPEED * baseSpeed * (now - baseTime)) / 1000
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
        setPlaying(false)
        return
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    const pause = () => setPlaying(false)
    el.addEventListener('touchmove', pause, { passive: true })
    el.addEventListener('wheel', pause, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('touchmove', pause)
      el.removeEventListener('wheel', pause)
    }
  }, [playing, ref])

  const toggle = useCallback(() => setPlaying((p) => !p), [])
  const stop = useCallback(() => setPlaying(false), [])
  return { playing, toggle, stop }
}
