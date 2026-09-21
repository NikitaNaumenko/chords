import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'

interface Props {
  title?: string
  back?: string
  fallback?: string
  right?: ReactNode
}

/** Белая шапка в стиле iOS: «‹ Назад» слева, заголовок по центру. */
export function NavBar({ title, back = 'Назад', fallback = '/', right }: Props) {
  const navigate = useNavigate()
  return (
    <div className="navbar">
      <button className="back-btn" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(fallback))}>
        <span className="chev">‹</span>
        <span>{back}</span>
      </button>
      <div className="title">{title}</div>
      <div style={{ minWidth: 60, display: 'flex', justifyContent: 'flex-end', gap: 4 }}>{right}</div>
    </div>
  )
}
