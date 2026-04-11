-- ============================================================
-- Péyi — Schéma initial
-- Migration 001 : communes, news, signalements, sondages
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";  -- pour requêtes géospatiales futures

-- ── Communes ─────────────────────────────────────────────────────────────────
create table communes (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  code_insee  text unique not null,
  department  text not null default '971',
  lat         float8,
  lng         float8,
  created_at  timestamptz default now()
);

alter table communes enable row level security;
create policy "communes_public_read" on communes for select using (true);

-- ── Actualités ───────────────────────────────────────────────────────────────
create table news_articles (
  id           uuid primary key default uuid_generate_v4(),
  commune_id   uuid references communes(id) on delete set null,
  title        text not null,
  slug         text unique not null,
  body         text not null default '',
  category     text not null check (category in ('politique','environnement','culture','sport','économie','social','sécurité')),
  author       text,
  published_at timestamptz not null default now(),
  image_url    text,
  source_url   text,
  created_at   timestamptz default now()
);

create index idx_news_commune    on news_articles(commune_id);
create index idx_news_category   on news_articles(category);
create index idx_news_published  on news_articles(published_at desc);

alter table news_articles enable row level security;
create policy "news_public_read"  on news_articles for select using (true);
create policy "news_admin_write"  on news_articles for all
  using (auth.jwt() ->> 'role' = 'peyi_admin');

-- ── Signalements ─────────────────────────────────────────────────────────────
create table reports (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete set null,
  commune_id   uuid not null references communes(id) on delete restrict,
  title        text not null,
  description  text not null default '',
  category     text not null check (category in ('voirie','eau','déchets','éclairage','végétation','autre')),
  status       text not null default 'ouvert' check (status in ('ouvert','en_cours','résolu','rejeté')),
  lat          float8 not null,
  lng          float8 not null,
  photos       text[] default '{}',
  upvotes      int not null default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index idx_reports_commune  on reports(commune_id);
create index idx_reports_status   on reports(status);
create index idx_reports_category on reports(category);
create index idx_reports_created  on reports(created_at desc);

alter table reports enable row level security;
create policy "reports_public_read"  on reports for select using (true);
create policy "reports_auth_insert"  on reports for insert with check (true); -- rate-limited by Edge Function
create policy "reports_admin_update" on reports for update
  using (auth.jwt() ->> 'role' = 'peyi_admin');

-- Trigger updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger reports_updated_at before update on reports
  for each row execute function set_updated_at();

-- Fonction RPC pour upvote atomique
create or replace function increment_report_upvotes(report_id uuid)
returns void language sql security definer as $$
  update reports set upvotes = upvotes + 1 where id = report_id;
$$;

-- ── Sondages ─────────────────────────────────────────────────────────────────
create table surveys (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  description  text,
  commune_id   uuid references communes(id) on delete set null,
  questions    jsonb not null default '[]',
  is_active    boolean not null default true,
  ends_at      timestamptz,
  created_at   timestamptz default now()
);

alter table surveys enable row level security;
create policy "surveys_public_read" on surveys for select using (is_active = true);
create policy "surveys_admin_write" on surveys for all
  using (auth.jwt() ->> 'role' = 'peyi_admin');

-- ── Réponses sondages ─────────────────────────────────────────────────────────
create table survey_responses (
  id             uuid primary key default uuid_generate_v4(),
  survey_id      uuid not null references surveys(id) on delete cascade,
  respondent_id  uuid not null,
  answers        jsonb not null default '{}',
  demographics   jsonb not null default '{}',
  created_at     timestamptz default now(),
  unique(survey_id, respondent_id)  -- une réponse par personne par sondage
);

create index idx_responses_survey on survey_responses(survey_id);

alter table survey_responses enable row level security;
-- Insertion publique, lecture agrégée seulement (pas de lecture individuelle)
create policy "responses_public_insert" on survey_responses for insert with check (true);
create policy "responses_admin_select"  on survey_responses for select
  using (auth.jwt() ->> 'role' = 'peyi_admin');
