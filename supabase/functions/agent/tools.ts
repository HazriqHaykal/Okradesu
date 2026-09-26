/**
 * The advisor agent's tools, one group per app module. Read tools query the
 * same tables the app uses; `propose_*` tools never act — they record a
 * proposal the farmer confirms in the app (human in the loop).
 */
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

import { PRICE_PER_KG } from '@/constants/market';
import {
  addDays,
  dailyCounts,
  discountedPrice,
  forecastFarm,
  overgrownSuggestion,
  podsToKg,
  roundKg,
  supplyByDay,
  surplusAlerts,
} from '@/lib/forecast';
import type { HarvestDetection, Listing, Reservation } from '@/types/market';

// ── Shared types ───────────────────────────────────────────────────
export type Farm = {
  id: string;
  name: string;
  type: 'outdoor' | 'indoor';
  place: string;
  plants: number;
  rows: number;
  gateway: string;
  hazard: 'landslide' | 'flood' | null;
  mean_temp_c: number;
  disease_risk: string | null;
};

export type Proposal = {
  id: string;
  kind: 'device' | 'listing' | 'confirm_reservation';
  /** One line for the confirm card, e.g. "Water Field A". */
  title: string;
  reason: string;
  params: Record<string, unknown>;
};

export type ToolContext = {
  db: SupabaseClient;
  farms: Farm[];
  /** Japan calendar day, YYYY-MM-DD. */
  today: string;
  proposals: Proposal[];
};

// ── Time ───────────────────────────────────────────────────────────
const JST_MS = 9 * 3600 * 1000;
/** Japan calendar day. The edge runtime runs in UTC. */
export const jstDay = (d = new Date()) => new Date(d.getTime() + JST_MS).toISOString().slice(0, 10);
/**
 * forecast.ts groups camera results by the runtime's local day; the edge
 * runtime is UTC, so shift timestamps to Japan time first.
 */
const toJst = (d: HarvestDetection): HarvestDetection => ({
  ...d,
  recorded_at: new Date(Date.parse(d.recorded_at) + JST_MS).toISOString(),
});

// ── Sensor thresholds (mirror METRICS in src/data/monitor.ts) ──────
type Range = [number, number];
const METRICS: { key: string; column: string; label: string; unit: string; target: Range; limit: Range; low: string; high: string }[] = [
  { key: 'moisture', column: 'soil_moisture', label: 'Soil moisture', unit: '%', target: [35, 45], limit: [30, 60], low: 'soil is dry', high: 'soil is waterlogged' },
  { key: 'ph', column: 'ph', label: 'Soil pH', unit: '', target: [6, 6.8], limit: [5.5, 7.5], low: 'soil too acidic', high: 'soil too alkaline' },
  { key: 'ec', column: 'ec', label: 'Nutrients (EC)', unit: 'mS/cm', target: [1.2, 2], limit: [0.8, 2.8], low: 'nutrients low', high: 'too much fertiliser' },
  { key: 'air', column: 'temp', label: 'Air temperature', unit: '°C', target: [24, 30], limit: [15, 35], low: 'too cold for okra', high: 'heat stress' },
  { key: 'humidity', column: 'humidity', label: 'Humidity', unit: '%', target: [60, 75], limit: [40, 85], low: 'air very dry', high: 'humid, fungal risk rising' },
];
const INDOOR_LIGHT = { target: [350, 500] as Range, limit: [250, 700] as Range };
/** No reading for this long = the LoRa link is down (same rule as the app). */
const OFFLINE_AFTER_MIN = 5;
/** LEDs run 20:00–10:00 Japan time. */
const ledsScheduledOn = (jstHour: number) => jstHour >= 20 || jstHour < 10;

function levelOf(v: number, target: Range, limit: Range) {
  if (v < limit[0] || v > limit[1]) return 'critical';
  if (v < target[0] || v > target[1]) return 'warning';
  return 'ok';
}

// ── Tool definitions (plain JSON Schema, any model provider) ───────
export type ToolDef = { name: string; description: string; parameters: Record<string, unknown> };

const farmIdProp = { type: 'string', description: 'Farm id, e.g. "field-a", "gymnasium", or "all".' };
const reasonProp = { type: 'string', description: 'One or two plain sentences the farmer will read on the confirm card: why this helps.' };

export const TOOLS: ToolDef[] = [
  {
    name: 'get_farms_overview',
    description:
      'Farm Monitor: every farm with its latest sensor reading (soil moisture, pH, EC, air temp, humidity, light), how old it is, whether the LoRa link is online, out-of-range alerts and any unresolved disease risk. Start here for any question about farm condition.',
    parameters: { type: 'object', properties: {}, required: [], additionalProperties: false },
  },
  {
    name: 'get_sensor_history',
    description:
      'Farm Monitor: hourly average readings for one farm over the last N hours (max 24). Use it to spot trends, e.g. humidity staying high overnight (mildew) or soil drying out.',
    parameters: {
      type: 'object',
      properties: { farm_id: farmIdProp, hours: { type: 'integer', description: '1 to 24' } },
      required: ['farm_id', 'hours'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_weather',
    description:
      'Weather for the farm area (Hinode, Japan): current conditions and the next 3 days (rain mm, rain chance, temperatures). Heavy rain means outdoor pumps should skip watering, and warns of landslide (Hillside) or flood (Field A) risk.',
    parameters: { type: 'object', properties: {}, required: [], additionalProperties: false },
  },
  {
    name: 'get_harvest_plan',
    description:
      "Smart Harvest: today's camera results per row — pods ready, pods that will be overgrown by tomorrow (must pick today), open flowers — ranked by urgency, with estimated kg.",
    parameters: {
      type: 'object',
      properties: { farm_id: farmIdProp },
      required: ['farm_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_market_outlook',
    description:
      'Market Intelligence: 7-day yield forecast per day (kg), kg already reserved by buyers, surplus alerts (amber over 10% unsold, red over 25%) with the kg not yet listed, and overgrown pods that could go to processors.',
    parameters: {
      type: 'object',
      properties: { farm_id: farmIdProp },
      required: ['farm_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_listings',
    description:
      'Market Intelligence: listings from today on with their reservations, including pending reservations waiting for the farmer to confirm (with reservation ids and buyer names).',
    parameters: { type: 'object', properties: {}, required: [], additionalProperties: false },
  },
  {
    name: 'propose_device_command',
    description:
      'Smart Control: propose switching a device. Nothing happens until the farmer taps Confirm. pump = water for 20 s (all farms); led = grow lights on/off with brightness level; fan = air fans on/off (led and fan exist on indoor farms only).',
    parameters: {
      type: 'object',
      properties: {
        farm_id: farmIdProp,
        device: { type: 'string', enum: ['pump', 'led', 'fan'] },
        on: { type: 'boolean' },
        level: { type: 'integer', description: 'LED brightness 10–100; use 100 for pump and fan.' },
        reason: reasonProp,
      },
      required: ['farm_id', 'device', 'on', 'level', 'reason'],
      additionalProperties: false,
    },
  },
  {
    name: 'propose_listing',
    description:
      'Market Intelligence: propose listing okra for buyers. listing_type "surplus" = grade A at 20% off, for a surplus alert; "overgrown" = pods past fresh-market size for processors, harvest_date must be today. Nothing is listed until the farmer confirms.',
    parameters: {
      type: 'object',
      properties: {
        farm_id: farmIdProp,
        harvest_date: { type: 'string', description: 'YYYY-MM-DD, today up to 6 days ahead' },
        quantity_kg: { type: 'number' },
        listing_type: { type: 'string', enum: ['surplus', 'overgrown'] },
        reason: reasonProp,
      },
      required: ['farm_id', 'harvest_date', 'quantity_kg', 'listing_type', 'reason'],
      additionalProperties: false,
    },
  },
  {
    name: 'propose_confirm_reservation',
    description: "Market Intelligence: propose confirming a buyer's pending reservation (id from get_listings). Nothing happens until the farmer confirms.",
    parameters: {
      type: 'object',
      properties: { reservation_id: { type: 'string' }, reason: reasonProp },
      required: ['reservation_id', 'reason'],
      additionalProperties: false,
    },
  },
];

// ── Tool implementations ───────────────────────────────────────────
class ToolError extends Error {}

function farmsFor(ctx: ToolContext, farmId: string) {
  if (farmId === 'all') return ctx.farms;
  const farm = ctx.farms.find((f) => f.id === farmId);
  if (!farm) throw new ToolError(`Unknown farm "${farmId}". Farms: ${ctx.farms.map((f) => f.id).join(', ')}.`);
  return [farm];
}

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

async function farmsOverview(ctx: ToolContext) {
  const since = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
  const rows = check(
    await ctx.db
      .from('sensor_readings')
      .select('*')
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: false })
      .limit(500),
  ) as Record<string, number | string>[];
  const jstHour = new Date(Date.now() + JST_MS).getUTCHours();

  return ctx.farms.map((farm) => {
    const r = rows.find((x) => x.farm_id === farm.id);
    if (!r) {
      return { farm: farm.id, name: farm.name, type: farm.type, link: 'offline', note: 'No reading in the last 2 hours.', disease_risk: farm.disease_risk };
    }
    const minutesAgo = Math.round((Date.now() - Date.parse(String(r.recorded_at))) / 60000);
    const alerts: string[] = [];
    const reading: Record<string, string> = {};
    for (const m of METRICS) {
      const v = Number(r[m.column]);
      reading[m.label] = `${v}${m.unit ? ' ' + m.unit : ''}`;
      const level = levelOf(v, m.target, m.limit);
      if (level !== 'ok') alerts.push(`${level}: ${m.label} ${v}${m.unit} (${v < m.target[0] ? m.low : m.high}; target ${m.target.join('–')})`);
    }
    reading.Light = `${Number(r.light)}`;
    if (farm.type === 'indoor' && ledsScheduledOn(jstHour)) {
      const v = Number(r.light);
      const level = levelOf(v, INDOOR_LIGHT.target, INDOOR_LIGHT.limit);
      if (level !== 'ok') alerts.push(`${level}: LED light ${v} µmol while the LEDs should be on (target 350–500)`);
    }
    return {
      farm: farm.id,
      name: farm.name,
      type: farm.type,
      plants: farm.plants,
      link: minutesAgo > OFFLINE_AFTER_MIN ? `offline (last reading ${minutesAgo} min ago)` : 'online',
      reading,
      alerts,
      disease_risk: farm.disease_risk,
      rain_hazard: farm.hazard,
    };
  });
}

async function sensorHistory(ctx: ToolContext, input: { farm_id: string; hours: number }) {
  const [farm] = farmsFor(ctx, input.farm_id);
  if (input.farm_id === 'all') throw new ToolError('Pick one farm for history.');
  const hours = Math.min(24, Math.max(1, input.hours));
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  const rows = check(
    await ctx.db.from('sensor_readings_hourly').select('*').eq('farm_id', farm.id).gte('hour', since).order('hour'),
  ) as Record<string, number | string>[];
  return rows.map((h) => ({
    hour_jst: new Date(Date.parse(String(h.hour)) + JST_MS).toISOString().slice(11, 16),
    soil_moisture: +Number(h.soil_moisture).toFixed(1),
    air_temp: +Number(h.temp).toFixed(1),
    humidity: +Number(h.humidity).toFixed(1),
    ec: +Number(h.ec).toFixed(2),
    light: Math.round(Number(h.light)),
  }));
}

async function weather() {
  const params = new URLSearchParams({
    latitude: '35.742',
    longitude: '139.257',
    timezone: 'Asia/Tokyo',
    forecast_days: '3',
    current: 'temperature_2m,relative_humidity_2m,precipitation',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new ToolError(`Weather service error ${res.status}.`);
  const w = await res.json();
  return {
    now: { temp_c: w.current.temperature_2m, humidity: w.current.relative_humidity_2m, rain_mm: w.current.precipitation },
    days: w.daily.time.map((date: string, i: number) => ({
      date,
      max_c: w.daily.temperature_2m_max[i],
      min_c: w.daily.temperature_2m_min[i],
      rain_mm: w.daily.precipitation_sum[i],
      rain_chance: w.daily.precipitation_probability_max[i],
    })),
    heavy_rain_mm: 50,
  };
}

async function detections(ctx: ToolContext) {
  return (check(await ctx.db.from('harvest_detections_latest').select('*')) as HarvestDetection[]).map(toJst);
}

async function harvestPlan(ctx: ToolContext, input: { farm_id: string }) {
  const farms = farmsFor(ctx, input.farm_id);
  const det = await detections(ctx);
  const rows = det
    .filter((d) => d.recorded_at.slice(0, 10) === ctx.today && farms.some((f) => f.id === d.farm_id))
    .filter((d) => d.ready_pods > 0 || d.overdue_pods > 0)
    .sort((a, b) => b.overdue_pods - a.overdue_pods || b.ready_pods - a.ready_pods)
    .map((d) => ({
      farm: d.farm_id,
      row: d.row,
      must_pick_today: d.overdue_pods,
      ready: d.ready_pods,
      flowers: d.flowers,
      est_kg: roundKg(podsToKg(d.ready_pods)),
    }));
  if (!rows.length) return { note: 'No camera results for today yet.' };
  return {
    total_must_pick: rows.reduce((n, r) => n + r.must_pick_today, 0),
    total_ready: rows.reduce((n, r) => n + r.ready, 0),
    total_est_kg: roundKg(rows.reduce((n, r) => n + r.est_kg, 0)),
    rows_by_urgency: rows,
  };
}

async function marketData(ctx: ToolContext) {
  const [det, listings, reservations] = await Promise.all([
    detections(ctx),
    ctx.db.from('listings').select('*').then(check) as Promise<Listing[]>,
    ctx.db.from('reservations').select('*').then(check) as Promise<Reservation[]>,
  ]);
  const clean = {
    listings: listings.map((l) => ({ ...l, quantity_kg: Number(l.quantity_kg), price_per_kg: Number(l.price_per_kg), harvest_date: String(l.harvest_date).slice(0, 10) })),
    reservations: reservations.map((r) => ({ ...r, quantity_kg: Number(r.quantity_kg) })),
  };
  return { det, ...clean };
}

async function marketOutlook(ctx: ToolContext, input: { farm_id: string }) {
  const farms = farmsFor(ctx, input.farm_id);
  const { det, listings, reservations } = await marketData(ctx);
  const forecasts = farms.map((f) =>
    forecastFarm({
      farmId: f.id,
      history: dailyCounts(det, f.id),
      today: ctx.today,
      meanTempC: f.mean_temp_c,
      diseaseRisk: f.disease_risk ?? undefined,
    }),
  );
  const supply = supplyByDay(forecasts, listings, reservations);
  const overgrown = farms
    .map((f) => ({ farm: f.id, ...overgrownSuggestion(dailyCounts(det, f.id), ctx.today) }))
    .filter((o) => o.kg > 0);
  return {
    days: supply.map((d) => ({
      date: d.date,
      forecast_kg: roundKg(d.forecastKg),
      reserved_kg: roundKg(d.reservedKg),
      surplus_kg: roundKg(d.surplusKg),
    })),
    surplus_alerts: surplusAlerts(forecasts, listings, reservations).map((a) => ({
      farm: a.farmId,
      date: a.date,
      surplus_kg: roundKg(a.surplusKg),
      unsold_pct: Math.round(a.pct * 100),
      level: a.level,
      not_yet_listed_kg: a.toListKg,
    })),
    forecast_notes: forecasts.flatMap((f) => [
      ...(f.penalty ? [`${f.farmId}: ${f.penalty.reason}`] : []),
      ...(f.warm ? [`${f.farmId}: warm, pods ready ${f.lagDays} days after flowering`] : []),
    ]),
    overgrown_today: overgrown,
    prices_yen_per_kg: { A: PRICE_PER_KG.A, B: PRICE_PER_KG.B, surplus: discountedPrice(PRICE_PER_KG.A), overgrown: PRICE_PER_KG.overgrown },
  };
}

async function listingsWithReservations(ctx: ToolContext) {
  const { listings, reservations } = await marketData(ctx);
  const buyers = check(await ctx.db.from('buyers').select('id, name, type')) as { id: string; name: string; type: string }[];
  return listings
    .filter((l) => l.harvest_date >= ctx.today)
    .sort((a, b) => a.harvest_date.localeCompare(b.harvest_date))
    .map((l) => ({
      listing_id: l.id,
      farm: l.farm_id,
      date: l.harvest_date,
      kg: l.quantity_kg,
      type: l.listing_type,
      grade: l.grade,
      price_per_kg: l.price_per_kg,
      status: l.status,
      reservations: reservations
        .filter((r) => r.listing_id === l.id && r.status !== 'cancelled')
        .map((r) => ({
          reservation_id: r.id,
          buyer: buyers.find((b) => b.id === r.buyer_id)?.name ?? 'Buyer',
          kg: r.quantity_kg,
          status: r.status,
        })),
    }));
}

// ── Proposals (farmer confirms in the app) ─────────────────────────
function propose(ctx: ToolContext, p: Omit<Proposal, 'id'>) {
  // Two agents may reach the same conclusion; the farmer sees it once.
  if (ctx.proposals.some((x) => x.title === p.title)) {
    return { status: 'already proposed', note: 'Another agent already suggested this; the farmer will see it once.' };
  }
  const proposal = { ...p, id: crypto.randomUUID() };
  ctx.proposals.push(proposal);
  return { status: 'proposed', title: p.title, note: 'Shown to the farmer with a Confirm button. It has NOT happened yet.' };
}

function proposeDevice(
  ctx: ToolContext,
  input: { farm_id: string; device: 'pump' | 'led' | 'fan'; on: boolean; level: number; reason: string },
) {
  const [farm] = farmsFor(ctx, input.farm_id);
  if (input.farm_id === 'all') throw new ToolError('Propose one farm at a time.');
  if (farm.type === 'outdoor' && input.device !== 'pump') throw new ToolError(`${farm.name} is outdoor: only the pump can be controlled.`);
  const level = input.device === 'led' ? Math.min(100, Math.max(10, input.level)) : 100;
  const verb = input.device === 'pump' ? 'Water' : `${input.on ? 'Turn on' : 'Turn off'} ${input.device === 'led' ? 'LEDs' : 'fans'} at`;
  return propose(ctx, {
    kind: 'device',
    title: `${verb} ${farm.name}${input.device === 'led' && input.on && level < 100 ? ` (${level}%)` : ''}`,
    reason: input.reason,
    params: { farm_id: farm.id, device: input.device, on: input.device === 'pump' ? true : input.on, level },
  });
}

function proposeListing(
  ctx: ToolContext,
  input: { farm_id: string; harvest_date: string; quantity_kg: number; listing_type: 'surplus' | 'overgrown'; reason: string },
) {
  const [farm] = farmsFor(ctx, input.farm_id);
  if (input.farm_id === 'all') throw new ToolError('Propose one farm at a time.');
  const last = addDays(ctx.today, 6);
  if (input.harvest_date < ctx.today || input.harvest_date > last) throw new ToolError(`harvest_date must be ${ctx.today} … ${last}.`);
  if (input.listing_type === 'overgrown' && input.harvest_date !== ctx.today) throw new ToolError('Overgrown listings are for today.');
  const kg = roundKg(input.quantity_kg);
  if (kg < 0.1 || kg > 50) throw new ToolError('quantity_kg must be between 0.1 and 50.');
  const surplus = input.listing_type === 'surplus';
  const price = surplus ? discountedPrice(PRICE_PER_KG.A) : PRICE_PER_KG.overgrown;
  return propose(ctx, {
    kind: 'listing',
    title: `List ${kg} kg ${surplus ? 'surplus' : 'overgrown'} from ${farm.name} · ¥${price}/kg`,
    reason: input.reason,
    params: {
      farm_id: farm.id,
      harvest_date: input.harvest_date,
      quantity_kg: kg,
      grade: surplus ? 'A' : 'overgrown',
      price_per_kg: price,
      listing_type: input.listing_type,
    },
  });
}

async function proposeConfirm(ctx: ToolContext, input: { reservation_id: string; reason: string }) {
  const { data } = await ctx.db.from('reservations').select('id, status, quantity_kg, buyer_id').eq('id', input.reservation_id).maybeSingle();
  if (!data) throw new ToolError('No reservation with that id. Use get_listings.');
  if (data.status !== 'pending') throw new ToolError(`That reservation is already ${data.status}.`);
  const { data: buyer } = await ctx.db.from('buyers').select('name').eq('id', data.buyer_id).maybeSingle();
  return propose(ctx, {
    kind: 'confirm_reservation',
    title: `Confirm ${Number(data.quantity_kg)} kg for ${buyer?.name ?? 'buyer'}`,
    reason: input.reason,
    params: { reservation_id: data.id },
  });
}

// ── Dispatch ───────────────────────────────────────────────────────
export type ToolOutcome = { ok: true; result: unknown } | { ok: false; error: string };

// deno-lint-ignore no-explicit-any
export async function runTool(ctx: ToolContext, name: string, input: any): Promise<ToolOutcome> {
  try {
    const result = await (async () => {
      switch (name) {
        case 'get_farms_overview': return farmsOverview(ctx);
        case 'get_sensor_history': return sensorHistory(ctx, input);
        case 'get_weather': return weather();
        case 'get_harvest_plan': return harvestPlan(ctx, input);
        case 'get_market_outlook': return marketOutlook(ctx, input);
        case 'get_listings': return listingsWithReservations(ctx);
        case 'propose_device_command': return proposeDevice(ctx, input);
        case 'propose_listing': return proposeListing(ctx, input);
        case 'propose_confirm_reservation': return proposeConfirm(ctx, input);
        default: throw new ToolError(`Unknown tool ${name}.`);
      }
    })();
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: e instanceof ToolError ? e.message : `Tool failed: ${e instanceof Error ? e.message : String(e)}` };
  }
}

// ── References: what data each tool call read ──────────────────────
/** A short citation shown to the farmer, e.g. "Live sensors · 5/6 farms · 08:09". */
export type Source = { tool: string; label: string; detail: string };

const jstClock = (d = new Date()) => new Date(d.getTime() + JST_MS).toISOString().slice(11, 16);

// deno-lint-ignore no-explicit-any
export function sourceOf(ctx: ToolContext, name: string, input: any, outcome: ToolOutcome): Source | null {
  if (!outcome.ok) return null;
  // deno-lint-ignore no-explicit-any
  const r = outcome.result as any;
  const farm = (id: string) => ctx.farms.find((f) => f.id === id)?.name ?? id;
  switch (name) {
    case 'get_farms_overview': {
      const online = (r as { link: string }[]).filter((f) => f.link === 'online').length;
      return { tool: name, label: 'Live sensors', detail: `${online}/${r.length} farms reporting · ${jstClock()}` };
    }
    case 'get_sensor_history':
      return { tool: name, label: 'Sensor history', detail: `${farm(input.farm_id)} · last ${input.hours} h` };
    case 'get_weather':
      return { tool: name, label: 'Weather', detail: `Open-Meteo · 3-day forecast · ${jstClock()}` };
    case 'get_harvest_plan':
      return {
        tool: name,
        label: 'Camera counts',
        detail: r.rows_by_urgency ? `${ctx.today} · ${r.rows_by_urgency.length} rows · ${r.total_ready} ready` : `${ctx.today} · none yet`,
      };
    case 'get_market_outlook':
      return {
        tool: name,
        label: 'Market forecast',
        detail: `7 days from ${ctx.today} · ${r.surplus_alerts.length} surplus alerts`,
      };
    case 'get_listings':
      return { tool: name, label: 'Listings', detail: `${r.length} from today · buyers' reservations` };
    default:
      return null; // propose_* tools don't read data
  }
}
