import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNav } from '../state/nav'
import {
  addShot,
  computeHoleScore,
  deleteLastShot,
  getHoles,
  getRound,
  getShots,
} from '../db/queries'
import type { Hole, Round, Shot, ShotDirection, ShotResult } from '../types'
import DirectionToggle from '../components/DirectionToggle'
import ResultButtons from '../components/ResultButtons'
import ShotList from '../components/ShotList'
import { formatRelPar } from '../format'

function buzz(ms = 15) {
  if ('vibrate' in navigator) navigator.vibrate(ms)
}

export default function Play({ roundId, initialHole }: { roundId: number; initialHole: number }) {
  const nav = useNav()
  const [round] = useState<Round | null>(() => getRound(roundId))
  const [holes] = useState<Hole[]>(() => getHoles(roundId))
  const [hole, setHole] = useState(initialHole)
  const [direction, setDirection] = useState<ShotDirection>('straight')
  const [shots, setShots] = useState<Shot[]>([])

  const reload = useCallback(() => {
    setShots(getShots(roundId, hole))
  }, [roundId, hole])

  useEffect(() => {
    reload()
  }, [reload])

  const par = useMemo(
    () => holes.find((h) => h.hole_number === hole)?.par ?? 4,
    [holes, hole],
  )
  const numHoles = round?.num_holes ?? holes.length
  const score = useMemo(() => computeHoleScore(par, hole, shots), [par, hole, shots])
  const completed = score.completed

  function record(result: ShotResult) {
    buzz()
    addShot(roundId, hole, result, direction)
    reload()
  }

  function undo() {
    buzz()
    deleteLastShot(roundId, hole)
    reload()
  }

  function goHole(n: number) {
    if (n < 1 || n > numHoles) return
    setHole(n)
  }

  const relThisHole = score.shots > 0 ? score.strokes - par : 0

  return (
    <div className="screen play-screen">
      <header className="app-bar">
        <button type="button" className="icon-btn" aria-label="홈" onClick={() => nav.go({ name: 'home' })}>
          ⌂
        </button>
        <h1 className="app-title">{round?.course_name || '라운드'}</h1>
        <button
          type="button"
          className="icon-btn"
          aria-label="스코어카드"
          onClick={() => nav.go({ name: 'scorecard', roundId })}
        >
          ▤
        </button>
      </header>

      <div className="hole-nav">
        <button
          type="button"
          className="hole-arrow"
          aria-label="이전 홀"
          disabled={hole <= 1}
          onClick={() => goHole(hole - 1)}
        >
          ◀
        </button>
        <div className="hole-center">
          <div className="hole-number">{hole}번 홀</div>
          <div className="hole-par">Par {par}</div>
        </div>
        <button
          type="button"
          className="hole-arrow"
          aria-label="다음 홀"
          disabled={hole >= numHoles}
          onClick={() => goHole(hole + 1)}
        >
          ▶
        </button>
      </div>

      <div className="score-strip">
        <div className="score-stat">
          <span className="score-value">{score.strokes}</span>
          <span className="score-cap">타수</span>
        </div>
        <div className="score-stat">
          <span className="score-value">
            {score.shots > 0 ? formatRelPar(relThisHole, 1) : '-'}
          </span>
          <span className="score-cap">파 대비</span>
        </div>
        <div className="score-stat">
          <span className="score-value">{score.putts}</span>
          <span className="score-cap">퍼팅</span>
        </div>
        {score.penalties > 0 && (
          <div className="score-stat penalty">
            <span className="score-value">+{score.penalties}</span>
            <span className="score-cap">벌타</span>
          </div>
        )}
      </div>

      <div className="shot-scroll">
        <ShotList shots={shots} />
      </div>

      <div className="action-panel">
        {completed ? (
          <div className="complete-banner">
            <div className="complete-title">
              ⛳ {hole}번 홀 완료 · {score.strokes}타{' '}
              <span className="complete-rel">{formatRelPar(relThisHole, 1)}</span>
            </div>
            <div className="complete-actions">
              <button type="button" className="ghost-btn" onClick={undo}>
                ↩ 되돌리기
              </button>
              {hole < numHoles ? (
                <button type="button" className="primary-btn" onClick={() => goHole(hole + 1)}>
                  다음 홀 →
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => nav.go({ name: 'scorecard', roundId })}
                >
                  스코어카드 →
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <DirectionToggle value={direction} onChange={setDirection} />
            <ResultButtons onSelect={record} onHoled={() => record('holed')} />
            <button
              type="button"
              className="undo-btn"
              onClick={undo}
              disabled={shots.length === 0}
            >
              ↩ 마지막 샷 되돌리기
            </button>
          </>
        )}
      </div>
    </div>
  )
}
