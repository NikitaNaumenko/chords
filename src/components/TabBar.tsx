import { NavLink } from 'react-router'

const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
    <path d="M4 10.5 12 4l8 6.5V20H4z" />
  </svg>
)
const BookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
    <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
    <path d="M9 4v16" />
  </svg>
)
const ChordIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <path d="M5 5h14M7 5v15M12 5v15M17 5v15M5 10h14M5 15h14" />
    <circle cx="12" cy="12.5" r="1.9" fill="currentColor" stroke="none" />
  </svg>
)

const tabs = [
  { to: '/', label: 'Главная', icon: <HomeIcon /> },
  { to: '/book', label: 'Песенник', icon: <BookIcon /> },
  { to: '/chords', label: 'Аккорды', icon: <ChordIcon /> },
]

export function TabBar() {
  return (
    <nav className="tabbar">
      <div className="tabbar-inner">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
            {t.icon}
            <span>{t.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
