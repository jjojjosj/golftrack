// sql.js(SQLite→WASM) 초기화 + IndexedDB 스냅샷 영속화 레이어.
// DB 전체는 메모리에 두고, 변경이 있을 때마다 바이트로 직렬화해 IndexedDB에 저장한다.
import initSqlJs, { type Database, type SqlValue } from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { get as idbGet, set as idbSet } from 'idb-keyval'
import { SCHEMA_SQL } from './schema'

const IDB_KEY = 'golftrack-db'

let db: Database | null = null
let initPromise: Promise<void> | null = null
let persistTimer: ReturnType<typeof setTimeout> | null = null

/** 앱 부팅 시 호출. IndexedDB에 저장된 DB가 있으면 복원, 없으면 새로 만든다.
 *  StrictMode 등으로 여러 번 불려도 한 번만 초기화되도록 프로미스를 캐시한다. */
export async function initDb(): Promise<void> {
  if (initPromise) return initPromise
  initPromise = (async () => {
    const SQL = await initSqlJs({ locateFile: () => wasmUrl })
    const saved = (await idbGet(IDB_KEY)) as Uint8Array | undefined
    db = saved ? new SQL.Database(saved) : new SQL.Database()
    db.run(SCHEMA_SQL)
    if (!saved) await persistNow()
  })()
  return initPromise
}

function requireDb(): Database {
  if (!db) throw new Error('DB가 초기화되지 않았습니다. initDb()를 먼저 호출하세요.')
  return db
}

type Params = Record<string, SqlValue> | SqlValue[] | undefined

/** SELECT 실행 → 객체 배열로 반환 */
export function all<T = Record<string, SqlValue>>(sql: string, params?: Params): T[] {
  const stmt = requireDb().prepare(sql)
  try {
    if (params) stmt.bind(params as never)
    const rows: T[] = []
    while (stmt.step()) rows.push(stmt.getAsObject() as T)
    return rows
  } finally {
    stmt.free()
  }
}

/** 단일 행 SELECT */
export function one<T = Record<string, SqlValue>>(sql: string, params?: Params): T | null {
  const rows = all<T>(sql, params)
  return rows.length ? rows[0] : null
}

/** INSERT/UPDATE/DELETE 실행 후 영속화 예약 */
export function run(sql: string, params?: Params): void {
  requireDb().run(sql, params as never)
  schedulePersist()
}

/** 방금 INSERT된 행의 rowid */
export function lastInsertId(): number {
  const row = one<{ id: number }>('SELECT last_insert_rowid() AS id')
  return row ? row.id : 0
}

/** 변경분을 디바운스하여 IndexedDB에 저장 */
export function schedulePersist(): void {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    void persistNow()
  }, 350)
}

/** 즉시 저장(내보내기 직전 등에 사용) */
export async function persistNow(): Promise<void> {
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  const bytes = requireDb().export()
  await idbSet(IDB_KEY, bytes)
}

/** 현재 DB를 .sqlite 바이트로 내보내기(백업 다운로드용) */
export async function exportBytes(): Promise<Uint8Array> {
  await persistNow()
  return requireDb().export()
}

/** .sqlite 바이트로 DB 교체(백업 복원용) */
export async function importBytes(bytes: Uint8Array): Promise<void> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl })
  if (db) db.close()
  db = new SQL.Database(bytes)
  db.run(SCHEMA_SQL)
  await persistNow()
}
