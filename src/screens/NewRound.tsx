import { useState } from 'react'
import { useNav } from '../state/nav'
import { createRound } from '../db/queries'
import { todayIsoDate } from '../format'

const PAR_CYCLE = [3, 4, 5]

export default function NewRound() {
  const nav = useNav()
  const [courseName, setCourseName] = useState('')
  const [playedOn, setPlayedOn] = useState(todayIsoDate())
  const [numHoles, setNumHoles] = useState(18)
  const [pars, setPars] = useState<number[]>(() => Array(18).fill(4))
  const [showPars, setShowPars] = useState(false)

  function changeHoles(n: number) {
    setNumHoles(n)
    setPars((prev) => {
      const next = Array(n).fill(4)
      for (let i = 0; i < Math.min(n, prev.length); i++) next[i] = prev[i]
      return next
    })
  }

  function cyclePar(i: number) {
    setPars((prev) => {
      const next = [...prev]
      const idx = PAR_CYCLE.indexOf(next[i])
      next[i] = PAR_CYCLE[(idx + 1) % PAR_CYCLE.length]
      return next
    })
  }

  function start() {
    const id = createRound(courseName.trim(), playedOn, numHoles, pars)
    nav.go({ name: 'play', roundId: id, hole: 1 })
  }

  const parTotal = pars.slice(0, numHoles).reduce((a, b) => a + b, 0)

  return (
    <div className="screen">
      <header className="app-bar">
        <button type="button" className="icon-btn" aria-label="뒤로" onClick={nav.back}>
          ←
        </button>
        <h1 className="app-title">새 라운드</h1>
        <span className="icon-btn placeholder" aria-hidden />
      </header>

      <main className="content">
        <label className="field">
          <span className="field-label">코스 이름</span>
          <input
            className="text-input"
            type="text"
            placeholder="예: 남부CC"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">날짜</span>
          <input
            className="text-input"
            type="date"
            value={playedOn}
            onChange={(e) => setPlayedOn(e.target.value)}
          />
        </label>

        <div className="field">
          <span className="field-label">홀 수</span>
          <div className="seg-group">
            {[9, 18].map((n) => (
              <button
                key={n}
                type="button"
                className={'seg-btn' + (numHoles === n ? ' active' : '')}
                onClick={() => changeHoles(n)}
              >
                {n}홀
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <button
            type="button"
            className="link-btn"
            onClick={() => setShowPars((v) => !v)}
          >
            {showPars ? '▼' : '▶'} 홀별 파 설정 (합계 {parTotal})
          </button>
          {showPars && (
            <div className="par-grid">
              {pars.slice(0, numHoles).map((p, i) => (
                <button
                  key={i}
                  type="button"
                  className={`par-cell par-${p}`}
                  onClick={() => cyclePar(i)}
                >
                  <span className="par-cell-hole">{i + 1}</span>
                  <span className="par-cell-par">P{p}</span>
                </button>
              ))}
            </div>
          )}
          {showPars && <p className="hint-text">칸을 탭하면 파 3 → 4 → 5로 바뀝니다.</p>}
        </div>

        <button type="button" className="primary-btn big" onClick={start}>
          라운드 시작 →
        </button>
      </main>
    </div>
  )
}
