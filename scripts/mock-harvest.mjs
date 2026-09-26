/**
 * Mock AI camera feed: every 30 s, inserts a fresh harvest_detections row
 * for every farm row, varying today's counts a little, until the real camera
 * module sends results. Run after supabase/market.sql:
 *
 *   node --env-file=.env.local scripts/mock-harvest.mjs
 *
 * Uses the same EXPO_PUBLIC_SUPABASE_* variables as the app.
 */
import { createClient } from '@supabase/supabase-js';

const EVERY_MS = 30_000;

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (e.g. in .env.local).');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const jstDay = (d) => new Date(d).toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });

// Today's latest result per row is the base the feed varies around.
const { data, error } = await db.from('harvest_detections_latest').select('*');
if (error) {
  console.error('Could not read harvest_detections_latest:', error.message);
  process.exit(1);
}
const today = jstDay(Date.now());
const bases = data.filter((d) => jstDay(d.recorded_at) === today);
if (!bases.length) {
  console.error('No camera results for today. Re-run supabase/market.sql to reseed.');
  process.exit(1);
}

const jitter = () => Math.round(Math.random() * 2) - 1;

async function tick() {
  const now = new Date().toISOString();
  const rows = bases.map((b) => ({
    farm_id: b.farm_id,
    row: b.row,
    flowers: b.flowers,
    ready_pods: Math.max(0, b.ready_pods + jitter()),
    overdue_pods: b.overdue_pods,
    recorded_at: now,
  }));
  const { error: insertError } = await db.from('harvest_detections').insert(rows);
  if (insertError) console.error(new Date().toLocaleTimeString(), 'insert failed:', insertError.message);
  else console.log(new Date().toLocaleTimeString(), `inserted ${rows.length} camera results`);
}

console.log(`Mock camera feed: ${bases.length} rows every ${EVERY_MS / 1000} s. Ctrl+C to stop.`);
await tick();
setInterval(tick, EVERY_MS);
