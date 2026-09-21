import type { ChordPosition } from './lookup'

interface Props {
  position: ChordPosition | null
  name?: string
  showName?: boolean
  dotColor?: string
  lineColor?: string
  className?: string
}

const STRINGS = 6
const FRETS = 4
const W = 100
const H = 100
const STEP = W / (STRINGS - 1)
const FRET_H = H / FRETS
const DOT_R = 9.5

/** Диаграмма аккорда в стилистике дизайна: сетка, кружки, баррэ; без номеров пальцев. */
export function ChordDiagram({ position, name, showName = false, dotColor = 'var(--accent)', lineColor = 'var(--diagram-line)', className }: Props) {
  if (!position) {
    return (
      <div className={`diagram none ${className ?? ''}`}>нет диаграммы</div>
    )
  }
  const { frets, baseFret, barres } = position
  const barre = barres[0]
  const fretY = (f: number) => (f - 0.5) * FRET_H
  const x = (i: number) => i * STEP

  const dots = frets
    .map((f, i) => ({ f, i }))
    .filter(({ f }) => f > 0 && !(barre && f === barre))
  let barreRect: { x: number; w: number; y: number } | null = null
  if (barre) {
    const idx = frets.map((f, i) => (f === barre ? i : -1)).filter((i) => i >= 0)
    if (idx.length) {
      const first = idx[0]
      const last = idx[idx.length - 1]
      barreRect = { x: x(first) - DOT_R, w: (last - first) * STEP + DOT_R * 2, y: fretY(barre) - DOT_R }
    }
  }
  const nutColor = baseFret > 1 ? 'var(--diagram-nut-dim)' : 'var(--diagram-nut)'
  const markColor = 'var(--diagram-mark)'

  return (
    <div className={`diagram ${className ?? ''}`}>
      <svg viewBox="-16 -14 132 120" width="100%" role="img" aria-label={name}>
        {frets.map((f, i) => (
          <text
            key={`m${i}`}
            x={x(i)}
            y={-5}
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fill={markColor}
            fontFamily="inherit"
          >
            {f === -1 ? '×' : f === 0 ? '○' : ''}
          </text>
        ))}
        <rect x={-1} y={-1.5} width={W + 2} height={3} rx={1.5} fill={nutColor} />
        {baseFret > 1 && (
          <text x={-6} y={fretY(1) + 3} textAnchor="end" fontSize="8.5" fontWeight="700" fill={markColor} fontFamily="inherit">
            {baseFret}
          </text>
        )}
        {Array.from({ length: STRINGS }, (_, i) => (
          <line key={`s${i}`} x1={x(i)} x2={x(i)} y1={0} y2={H} stroke={lineColor} strokeWidth={1} />
        ))}
        {Array.from({ length: FRETS }, (_, k) => (
          <line key={`f${k}`} x1={0} x2={W} y1={(k + 1) * FRET_H} y2={(k + 1) * FRET_H} stroke="var(--diagram-fret)" strokeWidth={1} />
        ))}
        {barreRect && <rect x={barreRect.x} y={barreRect.y} width={barreRect.w} height={DOT_R * 2} rx={DOT_R} fill={dotColor} />}
        {dots.map(({ f, i }) => (
          <circle key={`d${i}`} cx={x(i)} cy={fretY(f)} r={DOT_R} fill={dotColor} />
        ))}
      </svg>
      {showName && name && <div className="dname">{name}</div>}
    </div>
  )
}
