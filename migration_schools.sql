CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  admin_email TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE groups ADD COLUMN school_id TEXT DEFAULT 'school-1';

INSERT OR IGNORE INTO schools (id, name, city, code, address, admin_email)
VALUES 
  ('school-1', 'FZŠ Heyrovského Olomouc', 'Olomouc', 'FZSH-OLO', 'Heyrovského 33, 779 00 Olomouc', 'vedeni@fzs-heyrovskeho.cz'),
  ('school-2', 'FTK Univerzita Palackého (Laboratoř)', 'Olomouc', 'FTK-UPOL', 'Tř. Míru 117, 771 11 Olomouc', 'kinantropologie@upol.cz'),
  ('school-3', 'Gymnázium Čajkovského Olomouc', 'Olomouc', 'GYM-CAJK', 'Čajkovského 9, 779 00 Olomouc', 'info@gcajko.cz');
