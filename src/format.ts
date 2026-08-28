// 화면 표시용 포맷 헬퍼

/** 파 대비 스코어: 0=E, 양수=+n, 음수=-n. 플레이한 홀이 없으면 빈 문자열. */
export function formatRelPar(rel: number, playedHoles: number): string {
  if (playedHoles === 0) return ''
  if (rel === 0) return 'E'
  return rel > 0 ? `+${rel}` : `${rel}`
}

/** 'YYYY-MM-DD' → 'YYYY.MM.DD' */
export function formatDate(isoDate: string): string {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-')
  if (!y || !m || !d) return isoDate
  return `${y}.${m}.${d}`
}

/** 오늘 날짜를 'YYYY-MM-DD'로(로컬 타임존 기준) */
export function todayIsoDate(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
