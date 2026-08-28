import { createContext, useContext } from 'react'

// 경량 화면 라우팅(외부 라우터 의존성 없이).
export type View =
  | { name: 'home' }
  | { name: 'newRound' }
  | { name: 'play'; roundId: number; hole: number }
  | { name: 'scorecard'; roundId: number }
  | { name: 'roundDetail'; roundId: number }
  | { name: 'settings' }

export interface Nav {
  view: View
  go: (view: View) => void
  back: () => void
}

export const NavContext = createContext<Nav | null>(null)

export function useNav(): Nav {
  const nav = useContext(NavContext)
  if (!nav) throw new Error('NavContext가 없습니다.')
  return nav
}
