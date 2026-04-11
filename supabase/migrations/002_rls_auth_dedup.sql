-- Migration 002 — Déduplication authentifiée
-- À exécuter dans Supabase SQL Editor après migration 001

-- Politique d'insertion authentifiée : un user ne peut insérer que ses propres réponses
-- (empêche l'usurpation de respondent_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'survey_responses'
      AND policyname = 'survey_responses_auth_insert'
  ) THEN
    EXECUTE '
      CREATE POLICY survey_responses_auth_insert
        ON survey_responses
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid()::text = respondent_id)
    ';
  END IF;
END $$;

-- Contrainte d'unicité : un utilisateur authentifié répond une seule fois par sondage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'survey_responses_unique_respondent_survey'
  ) THEN
    ALTER TABLE survey_responses
      ADD CONSTRAINT survey_responses_unique_respondent_survey
      UNIQUE (survey_id, respondent_id);
  END IF;
END $$;
