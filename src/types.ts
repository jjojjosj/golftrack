// 골프 도메인 타입 정의

export type ShotResult =
  | 'fairway' // 페어웨이
  | 'rough' // 러프
  | 'bunker' // 벙커
  | 'green' // 그린 온
  | 'holed' // 컵인 (홀 종료)
  | 'ob' // OB (벌타 +1)
  | 'hazard' // 워터/해저드 (벌타 +1)

export type ShotDirection = 'left' | 'straight' | 'right'

export interface Round {
  id: number
  course_name: string
  played_on: string // YYYY-MM-DD
  num_holes: number // 9 | 18
  started_at: string
  finished_at: string | null
  notes: string | null
}

export interface Hole {
  id: number
  round_id: number
  hole_number: number
  par: number
}

export interface Shot {
  id: number
  round_id: number
  hole_number: number
  shot_number: number
  result: ShotResult
  direction: ShotDirection | null
  penalty: number
  created_at: string
}

/** 홀 단위 집계 결과 */
export interface HoleScore {
  hole_number: number
  par: number
  shots: number // 실제 친 샷 수
  penalties: number // 벌타 합
  strokes: number // 스코어 = shots + penalties
  putts: number // 그린 온 이후 친 샷 수
  completed: boolean // 컵인 여부
}

/** 라운드 요약 */
export interface RoundSummary {
  round: Round
  holeScores: HoleScore[]
  totalPar: number // 플레이한 홀들의 파 합
  totalStrokes: number
  totalPutts: number
  relativeToPar: number // totalStrokes - totalPar
  playedHoles: number // 샷이 하나라도 기록된 홀 수
}

/** OB / 해저드는 벌타 1을 유발한다 */
export const PENALTY_RESULTS: ShotResult[] = ['ob', 'hazard']

/** 홀을 종료시키는 결과 */
export const HOLE_ENDING_RESULTS: ShotResult[] = ['holed']

export const RESULT_LABELS: Record<ShotResult, string> = {
  fairway: '페어웨이',
  rough: '러프',
  bunker: '벙커',
  green: '그린',
  holed: '컵인',
  ob: 'OB',
  hazard: '워터',
}

export const DIRECTION_LABELS: Record<ShotDirection, string> = {
  left: '왼쪽',
  straight: '똑바로',
  right: '오른쪽',
}
