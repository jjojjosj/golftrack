import { useMemo, useState } from 'react'
import { useNav } from '../state/nav'
import { deleteRound, getAllShots, getRoundSummary } from '../db/queries'
import type { RoundSummary, Shot } from '../types'
import { DIRECTION_LABELS, RESULT_LABELS } from '../types'
import { formatDate, formatRelPar } from '../format'
import { ScoreTable } from './Scorecard'

export default function RoundDetail({ roundId }: { roundId: number }) {
  const nav = useNav()
  const [summary] = useState<RoundSummary | null>(() => getRoundSummary(roundId))
  const [showDetail, setShowDetail] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const allShots = useMemo(() => getAllShots(roundId), [roundId])

  if (!summary) {
    return (
      <div className="screen">
        <p className="empty-hint">라운드를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const { round } = summary
  const byHole = new Map<number, Shot[]>()
  for (const s of allShots) {
    const arr = byHole.get(s.hole_number) ?? []
    arr.push(s)
    byHole.set(s.hole_number, arr)
  }

  function remove() {
    deleteRound(roundId)
    nav.go({ name: 'home' })
  }

  return (
    <div className="screen">
      <header className="app-bar">
        <button type="button" className="icon-btn" aria-label="뒤로" onClick={nav.back}>
          ←
        </button>
        <h1 className="app-title">라운드 기록</h1>
        <button
          type="button"
          className="icon-btn"
          aria-label="삭제"
          onClick={() => setConfirmDelete(true)}
        >
          🗑
        </button>
      </header>

      <main className="content">
        <div className="summary-head">
          <span className="summary-course">{round.course_name || '이름 없는 코스'}</span>
          <span className="summary-date">
            {formatDate(round.played_on)} · {round.num_holes}홀
            {round.finished_at ? '' : ' · 진행 중'}
          </span>
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

        <button
          type="button"
          className="primary-btn big"
          onClick={() => nav.go({ name: 'play', roundId, hole: 1 })}
        >
          이어서 / 수정 기록 →
        </button>

        <ScoreTable
          holeScores={summary.holeScores}
          onHole={(n) => nav.go({ name: 'play', roundId, hole: n })}
        />

        <button type="button" className="link-btn" onClick={() => setShowDetail((v) => !v)}>
          {showDetail ? '▼' : '▶'} 홀별 샷 상세
        </button>
        {showDetail && (
          <div className="detail-list">
            {summary.holeScores
              .filter((h) => h.shots > 0)
              .map((h) => (
                <div key={h.hole_number} className="detail-hole">
                  <div className="detail-hole-head">
                    {h.hole_number}번 홀 · Par {h.par} · {h.strokes}타
                  </div>
                  <div className="detail-shots">
                    {(byHole.get(h.hole_number) ?? []).map((s) => (
                      <span key={s.id} className="detail-shot">
                        {s.shot_number}. {RESULT_LABELS[s.result]}
                        {s.direction ? ` (${DIRECTION_LABELS[s.direction]})` : ''}
                        {s.penalty > 0 ? ' +벌타' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">이 라운드 기록을 삭제할까요?</p>
            <p className="modal-body">삭제하면 되돌릴 수 없습니다.</p>
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setConfirmDelete(false)}>
                취소
              </button>
              <button type="button" className="danger-btn" onClick={remove}>
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
