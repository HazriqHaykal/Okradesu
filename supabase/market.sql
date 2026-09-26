-- Market Intelligence (module 5) for the Connected Okra Farm.
-- Paste into the Supabase SQL editor and run once. Safe to re-run: it drops
-- and recreates the market tables (not the other modules' tables).
--
-- farm_id is the app's farm id ('field-a', 'gymnasium', …) until a shared
-- farms table exists.

drop function if exists reserve_listing(uuid, uuid, numeric);
drop function if exists set_reservation_status(uuid, text);
drop view if exists harvest_detections_latest;
drop table if exists reservations;
drop table if exists listings;
drop table if exists buyers;
drop table if exists harvest_detections;

-- ── Tables ─────────────────────────────────────────────────────────
-- One camera result per row, the format agreed with the AI teammate.
create table harvest_detections (
  id           uuid primary key default gen_random_uuid(),
  farm_id      text not null,
  "row"        int  not null check ("row" > 0),
  flowers      int  not null default 0 check (flowers >= 0),
  ready_pods   int  not null default 0 check (ready_pods >= 0),
  overdue_pods int  not null default 0 check (overdue_pods >= 0),
  recorded_at  timestamptz not null default now()
);
create index harvest_detections_farm_time on harvest_detections (farm_id, recorded_at desc);

create table buyers (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,
  type     text not null check (type in ('restaurant', 'processor', 'wholesaler')),
  location text not null
);

create table listings (
  id           uuid primary key default gen_random_uuid(),
  farm_id      text not null,
  harvest_date date not null,
  quantity_kg  numeric(8, 2) not null check (quantity_kg > 0),
  grade        text not null check (grade in ('A', 'B', 'overgrown')),
  price_per_kg numeric(8, 0) not null check (price_per_kg >= 0),
  listing_type text not null default 'regular' check (listing_type in ('regular', 'surplus', 'overgrown')),
  status       text not null default 'open' check (status in ('open', 'reserved', 'sold')),
  created_at   timestamptz not null default now()
);
create index listings_farm_date on listings (farm_id, harvest_date);

create table reservations (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings (id) on delete cascade,
  buyer_id    uuid not null references buyers (id) on delete cascade,
  quantity_kg numeric(8, 2) not null check (quantity_kg > 0),
  status      text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at  timestamptz not null default now()
);
create index reservations_listing on reservations (listing_id);

-- Latest result per farm, row and (Japan) day for the last 14 days. The app
-- loads this instead of every raw result, which the mock feed adds every 30 s.
create view harvest_detections_latest as
select distinct on (farm_id, "row", (recorded_at at time zone 'Asia/Tokyo')::date) *
from harvest_detections
where recorded_at > now() - interval '14 days'
order by farm_id, "row", (recorded_at at time zone 'Asia/Tokyo')::date, recorded_at desc;

-- ── Reserve / update reservations atomically ──────────────────────
-- Locks the listing so two buyers can't reserve the same kilos.
create or replace function reserve_listing(p_listing_id uuid, p_buyer_id uuid, p_quantity_kg numeric)
returns reservations
language plpgsql as $$
declare
  l listings;
  taken numeric;
  r reservations;
begin
  select * into l from listings where id = p_listing_id for update;
  if not found then raise exception 'Listing not found.'; end if;
  if l.status <> 'open' then raise exception 'This listing is no longer open.'; end if;

  select coalesce(sum(quantity_kg), 0) into taken
  from reservations where listing_id = l.id and status <> 'cancelled';

  if p_quantity_kg <= 0 or p_quantity_kg > l.quantity_kg - taken then
    raise exception 'Only % kg left.', l.quantity_kg - taken;
  end if;

  insert into reservations (listing_id, buyer_id, quantity_kg)
  values (l.id, p_buyer_id, round(p_quantity_kg, 1))
  returning * into r;

  if taken + p_quantity_kg >= l.quantity_kg then
    update listings set status = 'reserved' where id = l.id;
  end if;
  return r;
end $$;

-- Confirm or cancel; a cancellation reopens a fully reserved listing.
create or replace function set_reservation_status(p_id uuid, p_status text)
returns reservations
language plpgsql as $$
declare
  r reservations;
  l listings;
  taken numeric;
begin
  update reservations set status = p_status where id = p_id returning * into r;
  if not found then raise exception 'Reservation not found.'; end if;

  select * into l from listings where id = r.listing_id for update;
  if l.status <> 'sold' then
    select coalesce(sum(quantity_kg), 0) into taken
    from reservations where listing_id = l.id and status <> 'cancelled';
    update listings
    set status = case when taken >= l.quantity_kg then 'reserved' else 'open' end
    where id = l.id;
  end if;
  return r;
end $$;

-- ── Access (demo: no login yet, anyone with the key can read and write) ─
alter table harvest_detections enable row level security;
alter table buyers enable row level security;
alter table listings enable row level security;
alter table reservations enable row level security;

create policy "demo read"   on harvest_detections for select using (true);
create policy "demo insert" on harvest_detections for insert with check (true);
create policy "demo read"   on buyers for select using (true);
create policy "demo read"   on listings for select using (true);
create policy "demo insert" on listings for insert with check (true);
create policy "demo update" on listings for update using (true);
create policy "demo read"   on reservations for select using (true);
create policy "demo insert" on reservations for insert with check (true);
create policy "demo update" on reservations for update using (true);

-- ── Realtime ───────────────────────────────────────────────────────
alter publication supabase_realtime add table listings;
alter publication supabase_realtime add table reservations;
-- So the forecast moves as the camera (or scripts/mock-harvest.mjs) reports.
alter publication supabase_realtime add table harvest_detections;

-- ── Seed ───────────────────────────────────────────────────────────
-- The farms are in Japan; the database clock is UTC.
create or replace function jst_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Tokyo')::date $$;

drop table if exists seed_rows;
drop table if exists seed_orders;

insert into buyers (name, type, location) values
  ('Izakaya Tanpopo',         'restaurant', 'Hinode'),
  ('Soba Kotobuki',           'restaurant', 'Kawabe'),
  ('Kawabe Pickles',          'processor',  'Kawabe'),
  ('Minami Wholesale Market', 'wholesaler', 'Minami');

-- Today's camera counts per row (same as src/data/detections.ts).
create temporary table seed_rows (farm_id text, "row" int, flowers int, ready int, overdue int);
insert into seed_rows values
  ('field-a', 1, 4, 6, 1), ('field-a', 2, 3, 9, 3), ('field-a', 3, 5, 4, 0),
  ('field-a', 4, 2, 7, 2), ('field-a', 5, 6, 3, 0), ('field-a', 6, 3, 5, 1),
  ('field-b', 1, 2, 4, 0), ('field-b', 2, 4, 6, 2), ('field-b', 3, 3, 2, 0),
  ('field-b', 4, 5, 5, 1), ('field-b', 5, 1, 3, 1),
  ('classroom-2', 1, 2, 4, 1), ('classroom-2', 2, 3, 3, 0),
  ('classroom-2', 3, 2, 5, 2), ('classroom-2', 4, 2, 2, 0),
  ('gymnasium', 1, 3, 5, 1), ('gymnasium', 2, 4, 4, 0), ('gymnasium', 3, 2, 6, 2),
  ('gymnasium', 4, 3, 3, 0), ('gymnasium', 5, 3, 5, 1), ('gymnasium', 6, 2, 3, 0),
  ('house-4', 1, 2, 3, 0), ('house-4', 2, 2, 4, 1), ('house-4', 3, 2, 2, 0),
  ('post-office', 1, 1, 2, 0), ('post-office', 2, 1, 3, 1),
  ('post-office', 3, 1, 2, 0), ('post-office', 4, 1, 2, 1);

-- 14 days of results at 05:40 Japan time. Earlier days vary around today
-- with the same formula as src/data/market-seed.ts.
insert into harvest_detections (farm_id, "row", flowers, ready_pods, overdue_pods, recorded_at)
select s.farm_id, s."row", c.flowers, c.ready, least(c.ready, c.overdue),
       ((jst_today() - d) + time '05:40') at time zone 'Asia/Tokyo'
from seed_rows s
cross join generate_series(0, 13) d
cross join lateral (
  select
    case when d = 0 then s.flowers else greatest(0, s.flowers + ((d * 7 + s."row" * 3) % 4) - 1) end as flowers,
    case when d = 0 then s.ready   else greatest(0, s.ready   + ((d * 5 + s."row") % 3) - 1) end as ready,
    case when d = 0 then s.overdue else case when (d + s."row") % 3 = 0 then 1 else 0 end end as overdue
) c;

-- Standing orders for the coming week (today … +6), fully reserved.
-- Thursday and Friday are under-booked, which raises the surplus alerts.
create temporary table seed_orders (farm_id text, day int, kg numeric, buyer text);
insert into seed_orders
select o.farm_id, o.day - 1, o.kg,
       (array['Izakaya Tanpopo', 'Soba Kotobuki', 'Minami Wholesale Market'])[((o.farm_idx + o.day - 1) % 3) + 1]
from (
  select f.farm_id, f.farm_idx, k.day, k.kg
  from (values
    ('field-a', 0,     array[1.7, 1.3, 1.2, 1.1, 1.1, 0.9, 0.7]),
    ('field-b', 1,     array[1.0, 0.9, 0.8, 0.8, 0.8, 0.6, 0.5]),
    ('classroom-2', 2, array[0.7, 0.6, 0.6, 0.6, 0.5, 0.4, 0.3]),
    ('gymnasium', 3,   array[1.3, 1.1, 0.9, 0.9, 0.8, 0.7, 0.5]),
    ('house-4', 4,     array[0.5, 0.4, 0.4, 0.4, 0.3, 0.3, 0.2]),
    ('post-office', 5, array[0.4, 0.3, 0.3, 0.3, 0.3, 0.2, 0.2])
  ) f(farm_id, farm_idx, kgs)
  cross join lateral unnest(f.kgs) with ordinality k(kg, day)
) o;

with l as (
  insert into listings (farm_id, harvest_date, quantity_kg, grade, price_per_kg, listing_type, status, created_at)
  select farm_id, jst_today() + day, kg, 'A', 1000, 'regular', 'reserved', now() - interval '2 days'
  from seed_orders
  returning id, farm_id, harvest_date, quantity_kg
)
insert into reservations (listing_id, buyer_id, quantity_kg, status, created_at)
select l.id, b.id, l.quantity_kg, 'confirmed', now() - interval '2 days'
from l
join seed_orders o on o.farm_id = l.farm_id and jst_today() + o.day = l.harvest_date
join buyers b on b.name = o.buyer;

-- A few open listings buyers can reserve right away.
insert into listings (farm_id, harvest_date, quantity_kg, grade, price_per_kg, listing_type, status) values
  ('field-b',   jst_today() + 5, 0.3, 'A', 1000, 'regular', 'open'),
  ('gymnasium', jst_today() + 4, 0.2, 'B',  700, 'regular', 'open');

-- Yesterday's overgrown pods went to the pickle maker.
with l as (
  insert into listings (farm_id, harvest_date, quantity_kg, grade, price_per_kg, listing_type, status)
  values ('field-a', jst_today() - 1, 0.6, 'overgrown', 300, 'overgrown', 'sold')
  returning id
)
insert into reservations (listing_id, buyer_id, quantity_kg, status)
select l.id, b.id, 0.6, 'confirmed' from l, buyers b where b.name = 'Kawabe Pickles';

drop table seed_rows;
drop table seed_orders;
