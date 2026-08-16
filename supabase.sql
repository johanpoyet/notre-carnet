-- À exécuter dans Supabase : SQL Editor > New query

create table if not exists couple_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table couple_data enable row level security;

-- Pas d'authentification dans cette app : on ouvre la table en lecture/écriture
-- via la clé anon. Le seul verrou est le secret de l'URL + de la clé anon.
create policy "Allow all on couple_data"
on couple_data
for all
using (true)
with check (true);

-- Active le realtime pour que les deux téléphones se synchronisent en direct
alter publication supabase_realtime add table couple_data;
