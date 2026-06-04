-- ASCENSION — Schéma Supabase
create extension if not exists "pgcrypto";

create table if not exists public.apprenants (
  token             text primary key,
  pseudo            text not null,
  paye              boolean default false,
  status            text default 'pending' check (status in ('pending','demo','complet')),
  type              text default 'pre_inscrit',
  date              text,
  module_actuel     int default 1,
  badges            text[] default '{}',
  participation     int default 0,
  quiz_scores       jsonb default '{}',
  telephone         text,
  nom               text,
  prenom            text,
  device_fingerprint text,
  first_use_at      timestamptz,
  created_at        timestamptz default now()
);

create table if not exists public.projets (
  id            bigserial primary key,
  token         text references public.apprenants(token) on delete cascade,
  module_id     int not null,
  titre         text not null,
  url_fichier   text,
  commentaire   text,
  note          numeric(4,1),
  feedback      text,
  notif_vu      boolean default false,
  reviewed      boolean default false,
  created_at    timestamptz default now()
);

create index if not exists idx_projets_token on public.projets(token);
create index if not exists idx_apprenants_status on public.apprenants(status);

alter table public.apprenants enable row level security;
alter table public.projets enable row level security;

-- Lecture publique pour le classement
create policy "classement_public" on public.apprenants
  for select using (participation > 0);

-- Service role bypass RLS automatiquement (API routes Next.js)
