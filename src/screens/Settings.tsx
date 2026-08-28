import { useRef, useState } from 'react'
import { useNav } from '../state/nav'
import { exportBytes, importBytes } from '../db/sqlite'
import { todayIsoDate } from '../format'

export default function Settings() {
  const nav = useNav()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function doExport() {
    try {
      const bytes = await exportBytes()
      // 새 ArrayBuffer로 복사해 BlobPart 타입(ArrayBufferLike→ArrayBuffer)을 만족시킨다.
      const copy = new Uint8Array(bytes.byteLength)
      copy.set(bytes)
      const blob = new Blob([copy], { type: 'application/x-sqlite3' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `golftrack-${todayIsoDate()}.sqlite`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setMsg('백업 파일을 내보냈습니다.')
    } catch (e) {
      setMsg('내보내기 실패: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!confirm('가져오면 현재 데이터가 파일 내용으로 완전히 대체됩니다. 계속할까요?')) {
      e.target.value = ''
      return
    }
    try {
      const buf = await file.arrayBuffer()
      await importBytes(new Uint8Array(buf))
      setMsg('가져오기 완료. 새로고침합니다…')
      setTimeout(() => location.reload(), 700)
    } catch (err) {
      setMsg('가져오기 실패: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div className="screen">
      <header className="app-bar">
        <button type="button" className="icon-btn" aria-label="뒤로" onClick={nav.back}>
          ←
        </button>
        <h1 className="app-title">설정 · 백업</h1>
        <span className="icon-btn placeholder" aria-hidden />
      </header>

      <main className="content">
        <div className="info-card">
          <p>
            모든 기록은 이 기기의 브라우저에 <b>SQLite로 저장</b>되며 인터넷 없이 동작합니다.
            기기를 바꾸거나 데이터를 안전하게 보관하려면 아래에서 백업 파일을 내보내세요.
          </p>
        </div>

        <button type="button" className="primary-btn big" onClick={doExport}>
          ⬇ 백업 내보내기 (.sqlite)
        </button>

        <button type="button" className="ghost-btn wide" onClick={() => fileRef.current?.click()}>
          ⬆ 백업 가져오기
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".sqlite,.db,application/x-sqlite3,application/octet-stream"
          hidden
          onChange={onFile}
        />

        {msg && <p className="settings-msg">{msg}</p>}

        <p className="hint-text">
          ※ 브라우저 데이터를 지우면 저장된 기록도 사라집니다. 중요한 기록은 주기적으로 백업하세요.
        </p>
      </main>
    </div>
  )
}
