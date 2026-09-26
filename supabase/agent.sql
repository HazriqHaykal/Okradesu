-- AI farm advisor (the `agent` Edge Function). Run after market.sql and
-- monitor.sql. Safe to re-run.
--
-- farms: the farm facts the agent needs on the server (the app keeps its own
-- copy in src/data/farms.ts + monitor.ts; keep the two in step).
-- agent_briefings: the morning briefing, written by the agent every day at
-- 05:45 Japan time and shown on the Advisor tab.
-- agent_steps: live progress of a run (which agent is doing what), so the
-- app can show the orchestration as it happens.

drop table if exists agent_steps;
drop table if exists agent_briefings;
drop table if exists farms;

create table farms (
  id           text primary key,
  name         text not null,
  type         text not null check (type in ('outdoor', 'indoor')),
  place        text not null,
  plants       int  not null,
  "rows"       int  not null,
  gateway      text not null,
  -- What heavy rain threatens (outdoor fields only).
  hazard       text check (hazard in ('landslide', 'flood')),
  -- Mean air temperature over the last day; drives the flower → pod countdown.
  mean_temp_c  real not null,
  -- Unresolved disease-risk alert, if any (cuts the yield forecast).
  disease_risk text
);

insert into farms (id, name, type, place, plants, "rows", gateway, hazard, mean_temp_c, disease_risk) values
  ('field-a',     'Field A',     'outdoor', 'Riverside',           120, 6, 'G-01', 'flood',     25.5, null),
  ('hillside',    'Hillside',    'outdoor', 'Kawabe slope',         80, 5, 'G-01', 'landslide', 24.0, null),
  ('classroom-2', 'Classroom 2', 'indoor',  'Hinode School',        48, 4, 'G-02', null,        27.4, null),
  ('gymnasium',   'Gymnasium',   'indoor',  'Hinode School',        96, 6, 'G-02', null,        26.8, null),
  ('house-4',     'House 4',     'indoor',  'Minami vacant house',  32, 3, 'G-01', null,        25.9, null),
  ('post-office', 'Post Office', 'indoor',  'Kawabe closed branch', 40, 4, 'G-01', null,        26.1, 'Mildew risk');

create table agent_briefings (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  -- The agent's plan for the day, in plain language.
  summary    text not null,
  -- Actions it suggests; the farmer confirms each one in the app.
  proposals  jsonb not null default '[]'::jsonb,
  -- What each specialist agent was asked, reported, and which data it read.
  trace      jsonb not null default '[]'::jsonb
);

create table agent_steps (
  id         bigint generated always as identity primary key,
  run_id     uuid not null,
  -- orchestrator | monitor | health | harvest | market
  agent      text not null,
  message    text not null,
  created_at timestamptz not null default now()
);
create index agent_steps_run on agent_steps (run_id, id);

alter table farms enable row level security;
alter table agent_briefings enable row level security;
alter table agent_steps enable row level security;
create policy "demo read" on farms for select using (true);
create policy "demo read" on agent_briefings for select using (true);
create policy "demo read" on agent_steps for select using (true);
-- Briefings are written by the Edge Function with the service role.

alter publication supabase_realtime add table agent_briefings;
alter publication supabase_realtime add table agent_steps;

-- ── Morning briefing: every day at 05:45 Japan time (20:45 UTC) ───
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('morning-briefing')
where exists (select 1 from cron.job where jobname = 'morning-briefing');

select cron.schedule(
  'morning-briefing',
  '45 20 * * *',
  $$
  select net.http_post(
    url     := 'https://tokmalebshpsozexhxxs.supabase.co/functions/v1/agent',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{"mode": "briefing"}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
