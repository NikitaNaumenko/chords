export type Theme = 'auto' | 'light' | 'dark'

const KEY = 'chords.theme'
const COLORS = { light: '#F5F3EF', dark: '#15130F' }
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

export function getTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'auto'
  } catch {
    return 'auto'
  }
}

export const resolveTheme = (t: Theme): 'light' | 'dark' => (t === 'auto' ? (media().matches ? 'dark' : 'light') : t)

/** Выставляет data-theme на <html> и цвет статус-бара (theme-color). */
export function applyTheme(t: Theme) {
  const root = document.documentElement
  if (t === 'auto') delete root.dataset.theme
  else root.dataset.theme = t
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = COLORS[resolveTheme(t)]
}

export function setTheme(t: Theme) {
  try {
    if (t === 'auto') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, t)
  } catch {
    // приватный режим — тема просто не запомнится
  }
  applyTheme(t)
}

/** Применить сохранённую тему и следить за системной, пока выбрано «Авто». */
export function initTheme() {
  applyTheme(getTheme())
  media().addEventListener('change', () => {
    if (getTheme() === 'auto') applyTheme('auto')
  })
}
