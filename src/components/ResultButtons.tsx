import { type ShotResult, RESULT_LABELS } from '../types'

// 화면에 보여줄 결과 버튼 순서와 분류(스타일용).
const LAYOUT: { result: ShotResult; kind: string; hint?: string }[] = [
  { result: 'fairway', kind: 'good' },
  { result: 'green', kind: 'good', hint: '온' },
  { result: 'rough', kind: 'ok' },
  { result: 'bunker', kind: 'ok' },
  { result: 'ob', kind: 'bad', hint: '+벌타' },
  { result: 'hazard', kind: 'bad', hint: '+벌타' },
]

export default function ResultButtons({
  onSelect,
  onHoled,
}: {
  onSelect: (result: ShotResult) => void
  onHoled: () => void
}) {
  return (
    <div className="result-area">
      <div className="result-grid">
        {LAYOUT.map(({ result, kind, hint }) => (
          <button
            key={result}
            type="button"
            className={`result-btn kind-${kind}`}
            onClick={() => onSelect(result)}
          >
            <span className="result-label">{RESULT_LABELS[result]}</span>
            {hint && <span className="result-hint">{hint}</span>}
          </button>
        ))}
      </div>
      <button type="button" className="result-btn holed-btn" onClick={onHoled}>
        <span className="result-label">⛳ 컵인 (홀 종료)</span>
      </button>
    </div>
  )
}
