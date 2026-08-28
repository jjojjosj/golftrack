// 순수 스코어 계산 로직(DB 의존 없음 → 단위 테스트 가능).
import { type HoleScore, type Shot, HOLE_ENDING_RESULTS } from './types'

/** 홀 하나의 스코어 계산. shots는 shot_number 오름차순이라고 가정. */
export function computeHoleScore(par: number, holeNumber: number, shots: Shot[]): HoleScore {
  const penalties = shots.reduce((sum, s) => sum + (s.penalty || 0), 0)
  const strokes = shots.length + penalties
  // 그린에 처음 올라간 샷(=어프로치) 이후의 샷들이 퍼팅.
  const firstGreenIdx = shots.findIndex((s) => s.result === 'green')
  const putts = firstGreenIdx >= 0 ? shots.length - firstGreenIdx - 1 : 0
  const completed = shots.some((s) => HOLE_ENDING_RESULTS.includes(s.result))
  return {
    hole_number: holeNumber,
    par,
    shots: shots.length,
    penalties,
    strokes,
    putts,
    completed,
  }
}
