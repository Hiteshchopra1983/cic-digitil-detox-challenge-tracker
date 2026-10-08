-- Program length: 6 weeks (defaults and legacy 12-week rows).

ALTER TABLE program_config
  ALTER COLUMN program_duration_weeks SET DEFAULT 6;

ALTER TABLE program_config
  ALTER COLUMN program_weeks SET DEFAULT 6;

UPDATE program_config
SET program_duration_weeks = 6
WHERE program_duration_weeks = 12;

UPDATE program_config
SET program_weeks = 6
WHERE program_weeks = 12;
