import { useState } from 'react'
import { useNav } from '../state/nav'
import { finishRound, getRoundSummary, reopenRound } from '../db/queries'
import type { HoleScore, RoundSummary } from '../types'
import { formatRelPar } from '../format'

export default function Scorecard({ roundId }: { roundId: number }) {
  const nav = useNav()
  const [summary, setSummary] = useState<RoundSummary | null>(() => getRoundSummary(roundId))

  if (!summary) {
    return (
      <div className="screen">
        <p className="empty-hint">라운드를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const { round, holeScores } = summary
  const finished = !!round.finished_at

  function toggleFinish() {
    if (finished) reopenRound(roundId)
    else finishRound(roundId)
    setSummary(getRoundSummary(roundId))
  }

  return (
    <div className="screen">
      <header className="app-bar">
        <button type="button" className="icon-btn" aria-label="뒤로" onClick={nav.back}>
          ←
        </button>
        <h1 className="app-title">스코어카드</h1>
        <span className="icon-btn placeholder" aria-hidden />
      </header>

      <main className="content">
        <div className="summary-head">
          <span className="summary-course">{round.course_name || '이름 없는 코스'}</span>
          <div className="summary-nums">
            <div className="summary-num">
              <b>{summary.totalStrokes || '-'}</b>
              <small>총 타수</small>
            </div>
            <div className="summary-num">
              <b>{formatRelPar(summary.relativeToPar, summary.playedHoles) || '-'}</b>
              <small>파 대비</small>
            </div>
            <div className="summary-num">
              <b>{summary.totalPutts}</b>
              <small>퍼팅</small>
            </div>
          </div>
        </div>

        <ScoreTable
          holeScores={holeScores}
          onHole={(n) => nav.go({ name: 'play', roundId, hole: n })}
        />

        <button
          type="button"
          className={finished ? 'ghost-btn wide' : 'primary-btn big'}
          onClick={toggleFinish}
        >
          {finished ? '라운드 다시 열기' : '라운드 종료'}
        </button>
      </main>
    </div>
  )
}

export function ScoreTable({
  holeScores,
  onHole,
}: {
  holeScores: HoleScore[]
  onHole?: (holeNumber: number) => void
}) {
  return (
    <table className="scorecard">
      <thead>
        <tr>
          <th>홀</th>
          <th>Par</th>
          <th>타수</th>
          <th>퍼팅</th>
          <th>±</th>
        </tr>
      </thead>
      <tbody>
        {holeScores.map((h) => {
          const played = h.shots > 0
          const rel = h.strokes - h.par
          return (
            <tr
              key={h.hole_number}
              className={onHole ? 'clickable' : undefined}
              onClick={onHole ? () => onHole(h.hole_number) : undefined}
            >
              <td className="c-hole">{h.hole_number}</td>
              <td>{h.par}</td>
              <td className={'c-strokes ' + scoreClass(played ? rel : null)}>
                {played ? h.strokes : '-'}
              </td>
              <td>{played ? h.putts : '-'}</td>
              <td className={scoreClass(played ? rel : null)}>
                {played ? formatRelPar(rel, 1) : '-'}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function scoreClass(rel: number | null): string {
  if (rel === null) return ''
  if (rel <= -1) return 'under'
  if (rel === 0) return 'even'
  if (rel === 1) return 'over1'
  return 'over2'
}
