import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { SongRenderer } from '../components/SongRenderer'
import { useLibrary } from '../songs/library'
import { buildSections, flattenSections } from '../songs/model'
import { parseSong, titleFor } from '../songs/parse'

const TEMPLATE = `{title: }
{artist: }
{key: Am}

{sov: Куплет 1}
[Am]Первая строка [Dm]песни
{eov}

{soc: Припев}
[E7]Строка припева [Am]тут
{eoc}
`

interface Props {
  /** Новая песня: id ещё нет */
  isNew?: boolean
}

export function SongEditPage({ isNew }: Props) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const lib = useLibrary()
  const song = isNew ? undefined : lib.getSong(id)
  const [text, setText] = useState(() => (isNew ? TEMPLATE : (song?.text ?? '')))
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const areaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isNew && song && !dirty) setText(song.text)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.text])

  const parsed = useMemo(() => parseSong(text), [text])
  const sections = useMemo(() => buildSections(parsed.song), [parsed])
  const flat = useMemo(() => flattenSections(sections), [sections])

  const insert = (before: string, after = '') => {
    const el = areaRef.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e } = el
    const next = text.slice(0, s) + before + text.slice(s, e) + after + text.slice(e)
    setText(next)
    setDirty(true)
    requestAnimationFrame(() => {
      el.focus()
      const pos = s + before.length + (e - s)
      el.setSelectionRange(pos, pos)
    })
  }

  const save = async () => {
    if (!text.trim()) return
    setSaving(true)
    try {
      const savedId = await lib.saveSong(isNew ? null : id, text)
      setDirty(false)
      navigate(`/song/${encodeURIComponent(savedId)}`, { replace: true })
    } finally {
      setSaving(false)
    }
  }

  const back = () => {
    if (dirty && !confirm('Есть несохранённые изменения. Выйти без сохранения?')) return
    navigate(-1)
  }

  if (!lib.ready) return null
  if (!isNew && !song) {
    return (
      <div className="screen no-tabs">
        <div className="page empty">Песня не найдена</div>
      </div>
    )
  }

  return (
    <div className="screen no-tabs" style={{ paddingTop: 'calc(var(--sat) + 8px)' }}>
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="icon-btn" onClick={back} aria-label="Назад">
            ‹
          </button>
          <div className="eyebrow" style={{ flex: 1, textAlign: 'center', fontWeight: 600, color: 'rgba(244,239,230,.56)' }}>
            {isNew ? 'Новая песня' : 'Редактор'}
          </div>
          <button className="pill-btn accent" onClick={save} disabled={saving || !text.trim()}>
            Сохранить
          </button>
        </div>
        {song?.source === 'repo' && (
          <p className="muted" style={{ fontSize: 12, lineHeight: 1.5, margin: '12px 0 0' }}>
            Это песня из репозитория. Правка сохранится на этом устройстве как локальная версия; чтобы обновить файл в репозитории, скопируйте текст и вставьте в <code>songs/</code>.
          </p>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto', paddingBottom: 2 }}>
          {[
            ['[ ]', '[', ']'],
            ['{sov}', '{sov: Куплет }\n', '\n{eov}'],
            ['{soc}', '{soc: Припев}\n', '\n{eoc}'],
            ['{c:}', '{c: ', '}'],
            ['{chorus}', '{chorus}', ''],
          ].map(([label, b, a]) => (
            <button key={label} className="pill-btn" style={{ padding: '7px 12px', fontFamily: 'ui-monospace, Menlo, monospace', flex: 'none' }} onClick={() => insert(b, a)}>
              {label}
            </button>
          ))}
          <button
            className="pill-btn"
            style={{ padding: '7px 12px', flex: 'none' }}
            onClick={() => navigator.clipboard?.writeText(text).then(() => alert('Текст скопирован'))}
          >
            Копировать
          </button>
        </div>
        <textarea
          ref={areaRef}
          className="textarea"
          style={{ marginTop: 10 }}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setDirty(true)
          }}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="{title: Название}\n[Am]Текст с [Dm]аккордами"
        />
        <div className="eyebrow" style={{ marginTop: 20 }}>
          Предпросмотр · {titleFor(parsed, 'без названия')}
        </div>
        {parsed.error && (
          <div className="comment" style={{ color: 'var(--danger)', marginTop: 6 }}>
            {parsed.error}
          </div>
        )}
        <div className="song-body" style={{ padding: '12px 0 0', overflow: 'visible', flex: 'none' }}>
          <SongRenderer mode="classic" sections={sections} flat={flat} active={-1} onChord={() => {}} onLine={() => {}} />
        </div>
      </div>
    </div>
  )
}
