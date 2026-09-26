/**
 * Mock LoRa gateway: plays person A's gateway until the hardware is ready.
 * Every 5 s it writes one sensor_readings row per farm (the agreed format:
 * farm_id, type, soil_moisture, ph, ec, temp, humidity, light), and it
 * carries out pump / LED / fan commands from the app, marking them done
 * after one LoRa hop. Run after supabase/monitor.sql:
 *
 *   node --env-file=.env.local scripts/mock-gateway.mjs
 *   node --env-file=.env.local scripts/mock-gateway.mjs --offline house-4,post-office
 *   node --env-file=.env.local scripts/mock-gateway.mjs --offline none
 *
 * Farms listed after --offline send nothing (a lost LoRa link); their
 * commands wait as queued. The default matches the app: Field E (house-4) is offline.
 * Stop the script and every farm goes offline in the app after 5 minutes.
 */
import { createClient } from '@supabase/supabase-js';

const EVERY_MS = 5000;
const LORA_HOP_MS = 1200;

// Same farms and baselines as src/data/monitor.ts.
const FARMS = [
  { id: 'field-a', type: 'outdoor', base: { moisture: 32, ph: 6.4, ec: 1.0, air: 29, humidity: 65, light: 1400 } },
  { id: 'hillside', type: 'outdoor', base: { moisture: 54, ph: 6.2, ec: 1.4, air: 27.5, humidity: 78, light: 1100 } },
  { id: 'classroom-2', type: 'indoor', base: { moisture: 38, ph: 6.5, ec: 1.6, air: 27.4, humidity: 81, light: 420 } },
  { id: 'gymnasium', type: 'indoor', base: { moisture: 41, ph: 6.6, ec: 1.5, air: 26.8, humidity: 72, light: 455 } },
  { id: 'house-4', type: 'indoor', base: { moisture: 36, ph: 6.3, ec: 1.4, air: 25.9, humidity: 69, light: 390 } },
  { id: 'post-office', type: 'indoor', base: { moisture: 44, ph: 6.7, ec: 1.7, air: 26.1, humidity: 84, light: 410 } },
];

const NOISE = { moisture: 0.8, ph: 0.06, ec: 0.05, air: 0.4, humidity: 1.2, light: 10 };
const SCALE = { moisture: [0, 100], ph: [4, 9], ec: [0, 3.2], air: [0, 45], humidity: [0, 100], light: [0, 1800] };
/** LEDs run 20:00–10:00 at night rates. */
const lightsScheduledOn = (hour) => hour >= 20 || hour < 10;

// ── Setup ──────────────────────────────────────────────────────────
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (e.g. in .env.local).');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const flag = process.argv.indexOf('--offline');
const offlineArg = flag > -1 ? process.argv[flag + 1] ?? '' : 'house-4';
const offline = new Set(offlineArg === 'none' ? [] : offlineArg.split(',').filter(Boolean));

/** What each farm's devices are doing; null = following its automatic rule. */
const devices = Object.fromEntries(
  FARMS.map((f) => [f.id, { led: null, level: 100, fan: null, wateredAt: null }]),
);

// ── Readings ───────────────────────────────────────────────────────
function reading(farm, at, withDevices = true) {
  const hour = at.getHours() + at.getMinutes() / 60;
  const outdoor = farm.type === 'outdoor';
  const b = farm.base;
  const d = withDevices ? devices[farm.id] : { led: null, level: 100, fan: null, wateredAt: null };
  const jitter = (k) => (Math.random() - 0.5) * NOISE[k] * (outdoor && k === 'light' ? 4 : 1);

  const dayCurve = Math.sin((2 * Math.PI * (hour - 9)) / 24);
  const sun = Math.max(0, Math.sin((Math.PI * (hour - 5)) / 14));
  const ledOn = d.led ?? lightsScheduledOn(at.getHours());
  const fanOn = d.fan ?? b.humidity > 75;
  const light = outdoor ? b.light * sun : ledOn ? (b.light * d.level) / 100 : 0;
  const sinceWater = d.wateredAt ? (at.getTime() - d.wateredAt) / 60000 : Infinity;
  const watered = sinceWater >= 0 && sinceWater < 30 ? 9 * (1 - sinceWater / 30) : 0;

  const r = {
    moisture: b.moisture + watered + jitter('moisture'),
    ph: b.ph + jitter('ph'),
    ec: b.ec + jitter('ec'),
    air: b.air + (outdoor ? 3 : 1) * dayCurve + jitter('air'),
    humidity: b.humidity - (outdoor ? 8 : 3) * dayCurve - (!outdoor && fanOn ? 7 : 0) + jitter('humidity'),
    light: light > 0 ? Math.max(0, light + jitter('light')) : 0,
  };
  for (const k of Object.keys(r)) r[k] = Math.min(SCALE[k][1], Math.max(SCALE[k][0], r[k]));

  return {
    farm_id: farm.id,
    type: farm.type,
    soil_moisture: +r.moisture.toFixed(1),
    ph: +r.ph.toFixed(2),
    ec: +r.ec.toFixed(2),
    temp: +r.air.toFixed(1),
    humidity: +r.humidity.toFixed(1),
    light: Math.round(r.light),
    recorded_at: at.toISOString(),
  };
}

/** First run: fill the last 24 h hourly so the app's charts aren't empty. */
async function backfill() {
  const { data, error } = await db.from('sensor_readings_hourly').select('farm_id');
  if (error) throw new Error(`Could not read sensor_readings_hourly: ${error.message}. Run supabase/monitor.sql first.`);
  const have = new Set(data.map((r) => r.farm_id));
  const rows = [];
  const hourStart = new Date();
  hourStart.setMinutes(0, 0, 0);
  for (const farm of FARMS) {
    if (have.has(farm.id)) continue;
    for (let h = 24; h >= 1; h--) rows.push(reading(farm, new Date(hourStart.getTime() - h * 3600000), false));
  }
  if (rows.length) {
    const { error: e } = await db.from('sensor_readings').insert(rows);
    if (e) throw new Error(`Backfill failed: ${e.message}`);
    console.log(`Backfilled ${rows.length} hourly readings for the charts.`);
  }
}

async function tick() {
  const now = new Date();
  const rows = FARMS.filter((f) => !offline.has(f.id)).map((f) => reading(f, now));
  const { error } = await db.from('sensor_readings').insert(rows);
  if (error) console.error(now.toLocaleTimeString(), 'readings failed:', error.message);
}

// ── Commands ───────────────────────────────────────────────────────
const handled = new Set();

async function carryOut(cmd) {
  if (handled.has(cmd.id) || cmd.status !== 'sent' || offline.has(cmd.farm_id)) return;
  handled.add(cmd.id);
  await new Promise((r) => setTimeout(r, LORA_HOP_MS));
  const d = devices[cmd.farm_id];
  if (d) {
    if (cmd.device === 'led') {
      d.led = cmd.on;
      d.level = cmd.level;
    }
    if (cmd.device === 'fan') d.fan = cmd.on;
    if (cmd.device === 'pump' && cmd.on) d.wateredAt = Date.now();
  }
  const { error } = await db
    .from('commands')
    .update({ status: 'done', acked_at: new Date().toISOString() })
    .eq('id', cmd.id);
  console.log(
    new Date().toLocaleTimeString(),
    error ? `command ${cmd.id} failed: ${error.message}` : `${cmd.farm_id} ${cmd.device} ${cmd.on ? 'on' : 'off'} · done`,
  );
}

// ── Run ────────────────────────────────────────────────────────────
try {
  await backfill();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

// Commands sent while the gateway was down run now.
const { data: queued } = await db.from('commands').select('*').eq('status', 'sent').order('created_at');
for (const cmd of queued ?? []) carryOut(cmd);

db.channel('gateway')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'commands' }, (p) => carryOut(p.new))
  .subscribe();

console.log(
  `Mock gateway: ${FARMS.length - offline.size} farms every ${EVERY_MS / 1000} s` +
    (offline.size ? `, offline: ${[...offline].join(', ')}` : '') +
    '. Ctrl+C to stop.',
);
await tick();
setInterval(tick, EVERY_MS);
