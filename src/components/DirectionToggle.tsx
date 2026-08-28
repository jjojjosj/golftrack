import { type ShotDirection, DIRECTION_LABELS } from '../types'

const ORDER: ShotDirection[] = ['left', 'straight', 'right']
const ICON: Record<ShotDirection, string> = { left: '◀', straight: '▲', right: '▶' }

export default function DirectionToggle({
  value,
  onChange,
}: {
  value: ShotDirection
  onChange: (d: ShotDirection) => void
}) {
  return (
    <div className="direction-toggle" role="group" aria-label="방향">
      {ORDER.map((d) => (
        <button
          key={d}
          type="button"
          className={'dir-btn' + (value === d ? ' active' : '')}
          aria-pressed={value === d}
          onClick={() => onChange(d)}
        >
          <span className="dir-icon" aria-hidden>
            {ICON[d]}
          </span>
          <span>{DIRECTION_LABELS[d]}</span>
        </button>
      ))}
    </div>
  )
}
