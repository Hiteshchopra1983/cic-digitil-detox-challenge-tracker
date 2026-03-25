-- Run once against your detox database.
ALTER TABLE baseline_metrics
ADD COLUMN IF NOT EXISTS baseline_co2_kg double precision;
