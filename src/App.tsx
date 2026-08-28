import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { initDb } from './db/sqlite'
import { NavContext, type View } from './state/nav'
import Home from './screens/Home'
import NewRound from './screens/NewRound'
import Play from './screens/Play'
import Scorecard from './screens/Scorecard'
import RoundDetail from './screens/RoundDetail'
import Settings from './screens/Settings'

export default function App() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>({ name: 'home' })
  const history = useRef<View[]>([])

  useEffect(() => {
    initDb()
      .then(() => setReady(true))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  const go = useCallback((next: View) => {
    setView((cur) => {
      history.current.push(cur)
      return next
    })
  }, [])

  const back = useCallback(() => {
    setView((cur) => {
      const prev = history.current.pop()
      return prev ?? (cur.name === 'home' ? cur : { name: 'home' })
    })
  }, [])

  const nav = useMemo(() => ({ view, go, back }), [view, go, back])

  if (error) {
    return (
      <div className="center-screen">
        <div className="error-box">
          <h2>불러오기 오류</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="center-screen">
        <div className="loading">
          <div className="ball-spinner" aria-hidden />
          <p>데이터베이스 준비 중…</p>
        </div>
      </div>
    )
  }

  return (
    <NavContext.Provider value={nav}>
      <Screen view={view} />
    </NavContext.Provider>
  )
}

function Screen({ view }: { view: View }) {
  switch (view.name) {
    case 'home':
      return <Home />
    case 'newRound':
      return <NewRound />
    case 'play':
      return <Play roundId={view.roundId} initialHole={view.hole} />
    case 'scorecard':
      return <Scorecard roundId={view.roundId} />
    case 'roundDetail':
      return <RoundDetail roundId={view.roundId} />
    case 'settings':
      return <Settings />
  }
}
