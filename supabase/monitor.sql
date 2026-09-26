-- Farm Monitor + Smart Control (modules 1–2) for the Connected Okra Farm.
-- Paste into the Supabase SQL editor and run once. Safe to re-run: it drops
-- and recreates only these tables.
--
-- Person A's LoRa gateway writes sensor_readings and carries out commands.
-- Until the hardware is ready, scripts/mock-gateway.mjs plays the gateway.

drop view if exists sensor_readings_hourly;
drop table if exists commands;
drop table if exists sensor_readings;

-- ── Sensor readings (A → C), the agreed handoff format ────────────
create table sensor_readings (
  id            bigint generated always as identity primary key,
  farm_id       text not null,
  type          text not null check (type in ('outdoor', 'indoor')),
  soil_moisture real not null,   -- %
  ph            real not null,
  ec            real not null,   -- mS/cm
  temp          real not null,   -- air °C
  humidity      real not null,   -- %
  light         real not null,   -- µmol (indoor LEDs) or sunlight
  recorded_at   timestamptz not null default now()
);
create index sensor_readings_farm_time on sensor_readings (farm_id, recorded_at desc);

-- Hourly averages for the 24 h charts, so the app doesn't load every 5 s reading.
create view sensor_readings_hourly as
select farm_id,
       date_trunc('hour', recorded_at) as hour,
       avg(soil_moisture) as soil_moisture,
       avg(ph)            as ph,
       avg(ec)            as ec,
       avg(temp)          as temp,
       avg(humidity)      as humidity,
       avg(light)         as light
from sensor_readings
where recorded_at > now() - interval '25 hours'
group by farm_id, date_trunc('hour', recorded_at);

-- ── Commands (C → A): device, on/off, level ───────────────────────
-- The app inserts 'sent'; the gateway sets 'done' once the node confirms.
-- Commands sent while the gateway is down stay 'sent' and run when it's back.
create table commands (
  id         bigint generated always as identity primary key,
  farm_id    text not null,
  device     text not null check (device in ('pump', 'led', 'fan')),
  "on"       boolean not null,
  level      int not null default 100 check (level between 0 and 100),
  status     text not null default 'sent' check (status in ('sent', 'done', 'failed')),
  created_at timestamptz not null default now(),
  acked_at   timestamptz
);
create index commands_pending on commands (created_at) where status = 'sent';

-- ── Access (demo: no login yet) ────────────────────────────────────
alter table sensor_readings enable row level security;
alter table commands enable row level security;

create policy "demo read"   on sensor_readings for select using (true);
create policy "demo insert" on sensor_readings for insert with check (true);
create policy "demo read"   on commands for select using (true);
create policy "demo insert" on commands for insert with check (true);
create policy "demo update" on commands for update using (true);

-- ── Realtime ───────────────────────────────────────────────────────
alter publication supabase_realtime add table sensor_readings;
alter publication supabase_realtime add table commands;
