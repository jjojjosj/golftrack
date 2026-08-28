import { useEffect, useState } from 'react'
import { useNav } from '../state/nav'
import { getOngoingRound, getRoundSummary, listRounds } from '../db/queries'
import type { RoundSummary } from '../types'
import { formatRelPar, formatDate } from '../format'

export default function Home() {
  const nav = useNav()
  const [summaries, setSummaries] = useState<RoundSummary[]>([])
  const [ongoingId, setOngoingId] = useState<number | null>(null)

  useEffect(() => {
    const rounds = listRounds()
    setSummaries(rounds.map((r) => getRoundSummary(r.id)!).filter(Boolean))
    setOngoingId(getOngoingRound()?.id ?? null)
  }, [])

  const ongoing = summaries.find((s) => s.round.id === ongoingId)

  return (
    <div className="screen">
      <header className="app-bar">
        <h1 className="app-title">⛳ GolfTrack</h1>
        <button
          type="button"
          className="icon-btn"
          aria-label="설정"
          onClick={() => nav.go({ name: 'settings' })}
        >
          ⚙
        </button>
      </header>

      <main className="content">
        {ongoing && (
          <button
            type="button"
            className="ongoing-card"
            onClick={() =>
              nav.go({
                name: 'play',
                roundId: ongoing.round.id,
                hole: nextHoleToPlay(ongoing),
              })
            }
          >
            <span className="ongoing-tag">진행 중</span>
            <span className="ongoing-course">
              {ongoing.round.course_name || '이름 없는 코스'}
            </span>
            <span className="ongoing-meta">
              {ongoing.playedHoles}/{ongoing.round.num_holes}홀 · {ongoing.totalStrokes}타 이어서 기록 →
            </span>
          </button>
        )}

        <button
          type="button"
          className="primary-btn big"
          onClick={() => nav.go({ name: 'newRound' })}
        >
          + 새 라운드 시작
        </button>

        <h2 className="section-title">지난 라운드</h2>
        {summaries.length === 0 && <p className="empty-hint">아직 기록된 라운드가 없습니다.</p>}
        <ul className="round-list">
          {summaries.map((s) => (
            <li key={s.round.id}>
              <button
                type="button"
                className="round-item"
                onClick={() => nav.go({ name: 'roundDetail', roundId: s.round.id })}
              >
                <div className="round-item-main">
                  <span className="round-course">
                    {s.round.course_name || '이름 없는 코스'}
                  </span>
                  <span className="round-date">{formatDate(s.round.played_on)}</span>
                </div>
                <div className="round-item-score">
                  <span className="round-strokes">{s.totalStrokes || '-'}</span>
                  <span className="round-relpar">{formatRelPar(s.relativeToPar, s.playedHoles)}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}

/** 진행 중 라운드에서 다음에 칠 홀 번호를 추정(완료 안 된 첫 홀, 없으면 마지막 플레이 홀). */
function nextHoleToPlay(s: RoundSummary): number {
  const firstIncomplete = s.holeScores.find((h) => !h.completed)
  if (firstIncomplete) return firstIncomplete.hole_number
  return s.round.num_holes
}
