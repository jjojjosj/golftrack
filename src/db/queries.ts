// 도메인 쿼리 + 스코어 계산 로직.
import { all, one, run, lastInsertId } from './sqlite'
import {
  type Hole,
  type Round,
  type RoundSummary,
  type Shot,
  type ShotDirection,
  type ShotResult,
  PENALTY_RESULTS,
} from '../types'
import { computeHoleScore } from '../score'

export { computeHoleScore }

const nowIso = () => new Date().toISOString()

/** 새 라운드 + 홀들 생성. pars 길이는 numHoles와 같아야 한다. 생성된 round id 반환. */
export function createRound(
  courseName: string,
  playedOn: string,
  numHoles: number,
  pars: number[],
): number {
  run(
    `INSERT INTO rounds (course_name, played_on, num_holes, started_at, finished_at, notes)
     VALUES (?, ?, ?, ?, NULL, NULL)`,
    [courseName, playedOn, numHoles, nowIso()],
  )
  const roundId = lastInsertId()
  for (let i = 0; i < numHoles; i++) {
    run(`INSERT INTO holes (round_id, hole_number, par) VALUES (?, ?, ?)`, [
      roundId,
      i + 1,
      pars[i] ?? 4,
    ])
  }
  return roundId
}

export function listRounds(): Round[] {
  return all<Round>(`SELECT * FROM rounds ORDER BY started_at DESC`)
}

/** 아직 끝나지 않은(진행 중) 가장 최근 라운드 */
export function getOngoingRound(): Round | null {
  return one<Round>(
    `SELECT * FROM rounds WHERE finished_at IS NULL ORDER BY started_at DESC LIMIT 1`,
  )
}

export function getRound(roundId: number): Round | null {
  return one<Round>(`SELECT * FROM rounds WHERE id = ?`, [roundId])
}

export function getHoles(roundId: number): Hole[] {
  return all<Hole>(`SELECT * FROM holes WHERE round_id = ? ORDER BY hole_number`, [roundId])
}

export function setPar(roundId: number, holeNumber: number, par: number): void {
  run(`UPDATE holes SET par = ? WHERE round_id = ? AND hole_number = ?`, [
    par,
    roundId,
    holeNumber,
  ])
}

export function getShots(roundId: number, holeNumber: number): Shot[] {
  return all<Shot>(
    `SELECT * FROM shots WHERE round_id = ? AND hole_number = ? ORDER BY shot_number`,
    [roundId, holeNumber],
  )
}

export function getAllShots(roundId: number): Shot[] {
  return all<Shot>(
    `SELECT * FROM shots WHERE round_id = ? ORDER BY hole_number, shot_number`,
    [roundId],
  )
}

/** 홀에 샷 하나 추가. 순번과 벌타는 자동 계산. */
export function addShot(
  roundId: number,
  holeNumber: number,
  result: ShotResult,
  direction: ShotDirection | null,
): void {
  const row = one<{ n: number }>(
    `SELECT COALESCE(MAX(shot_number), 0) AS n FROM shots WHERE round_id = ? AND hole_number = ?`,
    [roundId, holeNumber],
  )
  const nextNumber = (row?.n ?? 0) + 1
  const penalty = PENALTY_RESULTS.includes(result) ? 1 : 0
  run(
    `INSERT INTO shots (round_id, hole_number, shot_number, result, direction, penalty, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [roundId, holeNumber, nextNumber, result, direction, penalty, nowIso()],
  )
}

/** 홀의 마지막 샷 삭제(되돌리기). 삭제되면 true. */
export function deleteLastShot(roundId: number, holeNumber: number): boolean {
  const last = one<{ id: number }>(
    `SELECT id FROM shots WHERE round_id = ? AND hole_number = ?
     ORDER BY shot_number DESC LIMIT 1`,
    [roundId, holeNumber],
  )
  if (!last) return false
  run(`DELETE FROM shots WHERE id = ?`, [last.id])
  return true
}

export function finishRound(roundId: number): void {
  run(`UPDATE rounds SET finished_at = ? WHERE id = ?`, [nowIso(), roundId])
}

export function reopenRound(roundId: number): void {
  run(`UPDATE rounds SET finished_at = NULL WHERE id = ?`, [roundId])
}

export function deleteRound(roundId: number): void {
  // ON DELETE CASCADE가 없더라도 확실히 지우기 위해 명시적으로 삭제.
  run(`DELETE FROM shots WHERE round_id = ?`, [roundId])
  run(`DELETE FROM holes WHERE round_id = ?`, [roundId])
  run(`DELETE FROM rounds WHERE id = ?`, [roundId])
}

/** 라운드 전체 요약(스코어카드 + 합계) */
export function getRoundSummary(roundId: number): RoundSummary | null {
  const round = getRound(roundId)
  if (!round) return null
  const holes = getHoles(roundId)
  const allShots = getAllShots(roundId)
  const byHole = new Map<number, Shot[]>()
  for (const s of allShots) {
    const arr = byHole.get(s.hole_number) ?? []
    arr.push(s)
    byHole.set(s.hole_number, arr)
  }
  const holeScores = holes.map((h) =>
    computeHoleScore(h.par, h.hole_number, byHole.get(h.hole_number) ?? []),
  )
  const played = holeScores.filter((h) => h.shots > 0)
  const totalStrokes = played.reduce((s, h) => s + h.strokes, 0)
  const totalPar = played.reduce((s, h) => s + h.par, 0)
  const totalPutts = played.reduce((s, h) => s + h.putts, 0)
  return {
    round,
    holeScores,
    totalPar,
    totalStrokes,
    totalPutts,
    relativeToPar: totalStrokes - totalPar,
    playedHoles: played.length,
  }
}
