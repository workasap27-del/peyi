-- ============================================================
-- Péyi v2 — Tables IA, questions, résultats
-- À appliquer via Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. media_watch : titres d'actualité scrapés
CREATE TABLE IF NOT EXISTS media_watch (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text,
  source      text,
  url         text,
  scraped_at  timestamptz DEFAULT now(),
  used        boolean DEFAULT false
);

ALTER TABLE media_watch ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_watch_read_public" ON media_watch FOR SELECT USING (true);
CREATE POLICY "media_watch_write_admin" ON media_watch FOR ALL
  USING (auth.role() = 'service_role');

-- 2. question_proposals : propositions générées par l'IA
CREATE TABLE IF NOT EXISTS question_proposals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_type     text,
  question_text text,
  context       text,
  why           text,
  expected_split text,
  generated_at  timestamptz DEFAULT now(),
  status        text DEFAULT 'pending',
  selected_at   timestamptz
);

ALTER TABLE question_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposals_read_public" ON question_proposals FOR SELECT USING (true);
CREATE POLICY "proposals_write_admin" ON question_proposals FOR ALL
  USING (auth.role() = 'service_role');

-- 3. questions : questions publiées (récurrentes ou flash)
CREATE TABLE IF NOT EXISTS questions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text               text NOT NULL,
  slot_type          text,
  recurrence_type    text DEFAULT 'flash_daily',
  parent_question_id uuid REFERENCES questions(id),
  published_at       timestamptz,
  closes_at          timestamptz,
  status             text DEFAULT 'active',
  proposal_id        uuid
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_read_public" ON questions FOR SELECT USING (true);
CREATE POLICY "questions_write_admin" ON questions FOR ALL
  USING (auth.role() = 'service_role');

-- 4. survey_results : résultats calculés à la clôture
CREATE TABLE IF NOT EXISTS survey_results (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id           uuid REFERENCES questions(id),
  n_total               int,
  margin_error          float,
  reliability_score     text,
  bias_flags            jsonb,
  demographic_breakdown jsonb,
  commune_breakdown     jsonb,
  interpretation        text,
  calculated_at         timestamptz DEFAULT now()
);

ALTER TABLE survey_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "results_read_public" ON survey_results FOR SELECT USING (true);
CREATE POLICY "results_write_admin" ON survey_results FOR ALL
  USING (auth.role() = 'service_role');

-- 5. Colonne recurrence_type sur surveys existante (si absente)
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS recurrence_type text DEFAULT 'flash_daily';
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS parent_survey_id uuid REFERENCES surveys(id);
