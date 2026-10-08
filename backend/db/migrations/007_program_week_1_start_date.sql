-- Monday (UTC calendar date) when program week 1 opens. Weekly submissions for week N are only
-- accepted between Monday 00:00 UTC and Sunday 23:59:59.999 UTC of that program week.
-- When NULL, no calendar window is enforced (legacy behavior).

ALTER TABLE program_config
  ADD COLUMN IF NOT EXISTS program_week_1_start_date date;
