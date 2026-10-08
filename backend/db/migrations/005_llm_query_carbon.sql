-- LLM / GPT-style query footprint: grams per query in config, counts on baseline & weekly.
SET search_path TO public;

ALTER TABLE emission_config
  ADD COLUMN IF NOT EXISTS llm_per_query double precision DEFAULT 4;

COMMENT ON COLUMN emission_config.llm_per_query IS 'CO2e per generative AI query (grams); default ~4 g/query.';

INSERT INTO co2_factors (key, value)
SELECT 'llm_per_query', 4
WHERE NOT EXISTS (SELECT 1 FROM co2_factors WHERE key = 'llm_per_query');

ALTER TABLE baseline_metrics
  ADD COLUMN IF NOT EXISTS llm_queries_per_week integer DEFAULT 0;

ALTER TABLE weekly_progress
  ADD COLUMN IF NOT EXISTS llm_queries_reduced integer DEFAULT 0;
