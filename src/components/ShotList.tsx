import { type Shot, RESULT_LABELS, DIRECTION_LABELS } from '../types'

export default function ShotList({ shots }: { shots: Shot[] }) {
  if (shots.length === 0) {
    return <p className="shot-empty">첫 샷을 기록해 보세요.</p>
  }
  return (
    <ol className="shot-list">
      {shots.map((s) => (
        <li key={s.id} className="shot-row">
          <span className="shot-num">{s.shot_number}</span>
          <span className="shot-result">{RESULT_LABELS[s.result]}</span>
          {s.direction && <span className="shot-dir">{DIRECTION_LABELS[s.direction]}</span>}
          {s.penalty > 0 && <span className="shot-penalty">벌타 +{s.penalty}</span>}
        </li>
      ))}
    </ol>
  )
}
