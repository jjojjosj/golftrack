// SQLite 스키마. 앱 시작 시 (없으면) 생성한다.
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_name TEXT NOT NULL DEFAULT '',
  played_on TEXT NOT NULL,
  num_holes INTEGER NOT NULL DEFAULT 18,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS holes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL,
  par INTEGER NOT NULL DEFAULT 4,
  UNIQUE(round_id, hole_number)
);

CREATE TABLE IF NOT EXISTS shots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL,
  shot_number INTEGER NOT NULL,
  result TEXT NOT NULL,
  direction TEXT,
  penalty INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_holes_round ON holes(round_id);
CREATE INDEX IF NOT EXISTS idx_shots_round_hole ON shots(round_id, hole_number, shot_number);
`
