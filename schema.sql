-- Gamifiter Cloudflare D1 Database Schema
-- FTK Univerzita Palackého v Olomouci

CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  module_type TEXT NOT NULL,
  target_steps INTEGER NOT NULL,
  valid_from TEXT,
  valid_to TEXT,
  file_path TEXT,
  custom_task_prompt TEXT DEFAULT '',
  custom_clue TEXT DEFAULT '',
  subject_category TEXT DEFAULT 'obecne',
  solution_answer TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  admin_email TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  admin_name TEXT,
  school_id TEXT DEFAULT 'school-1',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  group_id TEXT NOT NULL,
  steps INTEGER DEFAULT 0,
  device TEXT,
  token TEXT UNIQUE,
  last_sync TEXT,
  avatar TEXT DEFAULT '🦊',
  morning_steps INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 5,
  is_real INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  steps INTEGER NOT NULL,
  step_delta INTEGER NOT NULL,
  device TEXT,
  source TEXT,
  integrity_hash TEXT,
  is_real INTEGER DEFAULT 0
);

-- Seed initial real data for Schools, Groups, David Prycl & default challenges
INSERT OR IGNORE INTO schools (id, name, city, code, address, admin_email)
VALUES 
  ('school-1', 'FZŠ Heyrovského Olomouc', 'Olomouc', 'FZSH-OLO', 'Heyrovského 33, 779 00 Olomouc', 'vedeni@fzs-heyrovskeho.cz'),
  ('school-2', 'FTK Univerzita Palackého (Laboratoř)', 'Olomouc', 'FTK-UPOL', 'Tř. Míru 117, 771 11 Olomouc', 'kinantropologie@upol.cz'),
  ('school-3', 'Gymnázium Čajkovského Olomouc', 'Olomouc', 'GYM-CAJK', 'Čajkovského 9, 779 00 Olomouc', 'info@gcajko.cz');

INSERT OR IGNORE INTO groups (id, name, admin_name, school_id) 
VALUES ('group-1', 'Třída 8.A (FTK UP)', 'David Prycl', 'school-1');

INSERT OR IGNORE INTO students (id, name, group_id, steps, device, token, last_sync, is_real)
VALUES ('student-1', 'David Prycl', 'group-1', 6464, 'Garmin Vívoactive 4', 'ftk-prycl-garmin', CURRENT_TIMESTAMP, 1);

INSERT OR IGNORE INTO challenges (id, name, description, module_type, target_steps, valid_from, valid_to, file_path)
VALUES 
  ('challenge-1', 'Tour de Europe', 'Virtuální trasa napříč Evropou. Ujděte s celou třídou 500 000 kroků a odhalte zajímavá evropská města.', 'map', 500000, '2026-06-01', '2026-07-31', '/tour_de_cities.geojson'),
  ('challenge-2', 'Okresy České republiky', 'Postupně odemykejte okresy ČR. Každých 5 000 kroků celé třídy odemkne jeden okres s jeho detailními statistikami.', 'districts', 70000, '2026-06-15', '2026-08-15', '/districts.geojson'),
  ('challenge-3', 'Odkrývání: Zámek Český Krumlov', 'Zlepšete svou kondici a odhalte skrytý historický klenot z ptačí perspektivy. Každý krok pomáhá odkrýt obrázek.', 'puzzle', 120000, '2026-06-20', '2026-07-20', '/krumlov.jpg'),
  ('challenge-4', 'Zaostřování: Tajemství DNA', 'Každý krok zpřesňuje vaše vidění světa. Vyostřete detailní makro snímek DNA řetězce a získejte edukační bonus.', 'pixelate', 100000, '2026-06-10', '2026-07-10', '/dna.jpg'),
  ('challenge-5', 'Síťování: Lidské tělo', 'Propojte uzly nervové soustavy. Aktivita celé třídy buduje komplexní neuronovou síť.', 'network', 80000, '2026-06-05', '2026-07-05', '/dataset.json');
