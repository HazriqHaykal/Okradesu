/**
 * Smart Harvest & Quality (module 3) logic: flower countdown, the ranked
 * daily harvest plan and pod grading. Pure functions over the sample
 * detections so the same code can run on Supabase rows later.
 */
import { DETECTIONS, type DetectionRow } from '@/data/detections';
import { FARMS, getFarm, type Farm, type FarmKind } from '@/data/farms';

/** Sample "today". Swap for `new Date()` once detections are live. */
export const TODAY = new Date(2026, 8, 26);

// ── Camera schedule ────────────────────────────────────────────────
/**
 * Outdoor cameras shoot at a fixed afternoon time (consistent sunlight) and
 * the countdown projects overnight growth, so the map is ready before the
 * cool early-morning picking window. Indoor cameras shoot when the LEDs reach
 * full brightness (light trigger from person A).
 */
export const CAPTURE = {
  outdoor: { label: 'Photo 16:00 yesterday', detail: 'projected to 06:00 today' },
  indoor: { label: 'Photo 05:40 today', detail: 'taken with LEDs at full brightness' },
} as const satisfies Record<FarmKind, { label: string; detail: string }>;

export const captureFor = (farm: Farm) => CAPTURE[farm.kind];

// ── Flower countdown ───────────────────────────────────────────────
/**
 * Growing-degree-day model: each day adds (mean °C − base) degree-days and a
 * pod reaches picking size after ~GDD_TO_PICK. Starting values; calibrate
 * from each farm's flower → pick records.
 */
export const GDD_BASE_C = 10;
export const GDD_TO_PICK = 60;

export type FlowerCohort = {
  openedOn: Date;
  count: number;
  readyFrom: Date;
  readyTo: Date;
  status: 'waiting' | 'ready' | 'late';
  /** Days until the window opens (negative once open). */
  daysToReady: number;
};

const DAY = 24 * 60 * 60 * 1000;
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
const dayDiff = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / DAY);

export function readyWindow(openedOn: Date, meanTempC: number) {
  const perDay = Math.max(1, meanTempC - GDD_BASE_C);
  const days = GDD_TO_PICK / perDay;
  return { readyFrom: addDays(openedOn, Math.floor(days)), readyTo: addDays(openedOn, Math.ceil(days)) };
}

/**
 * Flowers the camera logged in this row over the last 6 days (sample history:
 * today's count comes from the detection, earlier days are derived).
 */
export function flowerCountdown(farm: Farm, det: DetectionRow): FlowerCohort[] {
  return [0, 1, 2, 3, 4, 5].map((ago) => {
    const openedOn = addDays(TODAY, -ago);
    const count = ago === 0 ? det.flowers : ((det.row + ago * 2) % 4) + 1;
    const { readyFrom, readyTo } = readyWindow(openedOn, farm.meanTempC);
    const daysToReady = dayDiff(readyFrom, TODAY);
    const status = dayDiff(TODAY, readyTo) > 0 ? 'late' : daysToReady <= 0 ? 'ready' : 'waiting';
    return { openedOn, count, readyFrom, readyTo, status, daysToReady };
  });
}

// ── Daily harvest plan (the `harvest_plan` view) ───────────────────
export type Urgency = 'must' | 'ready' | 'processor';

export type PlanRow = DetectionRow & {
  key: string;
  farm: Farm;
  urgency: Urgency;
  /** Rough picking time: 12 s per pod plus 1 min to walk the row. */
  minutes: number;
  /** Rough weight at ~12 g per fresh pod. */
  grams: number;
};

export const rowKey = (farmId: string, row: number) => `${farmId}#${row}`;

/**
 * Demo mode's "camera found new pods" lands on Field A, row 1 — the same farm
 * the Farm Monitor demo bumps — so Home and Harvest show the same number.
 */
export const DEMO_POD_ROW = { farmId: 'field-a', row: 1 } as const;

function withExtra(farmId: string, d: DetectionRow, extraReady: number): DetectionRow {
  if (!extraReady || farmId !== DEMO_POD_ROW.farmId || d.row !== DEMO_POD_ROW.row) return d;
  return { ...d, ready: d.ready + extraReady };
}

export function getRow(farmId: string, row: number, extraReady = 0) {
  const d = DETECTIONS[farmId]?.find((r) => r.row === row);
  return d ? withExtra(farmId, d, extraReady) : undefined;
}

const toPlanRow = (farm: Farm, d: DetectionRow): PlanRow => ({
  ...d,
  key: rowKey(farm.id, d.row),
  farm,
  urgency: d.overdue > 0 ? 'must' : d.ready > 0 ? 'ready' : 'processor',
  minutes: Math.max(1, Math.round((d.ready + d.overgrown) * 0.2 + 1)),
  grams: d.ready * 12,
});

/** Every row of every farm in bed order, including rows with nothing to pick (for the map). */
export function allRows(extraReady = 0): { farm: Farm; rows: PlanRow[] }[] {
  return FARMS.map((farm) => ({
    farm,
    rows: (DETECTIONS[farm.id] ?? []).map((d) => toPlanRow(farm, withExtra(farm.id, d, extraReady))),
  }));
}

/** Every row with something to pick, most urgent first. */
export function harvestPlan(filter?: { kind?: FarmKind; farmId?: string }, extraReady = 0): PlanRow[] {
  return allRows(extraReady)
    .filter(
      ({ farm }) =>
        (!filter?.kind || farm.kind === filter.kind) && (!filter?.farmId || farm.id === filter.farmId),
    )
    .flatMap(({ rows }) => rows)
    .filter((r) => r.ready > 0 || r.overgrown > 0)
    .sort((a, b) => b.overdue - a.overdue || b.ready - a.ready || b.overgrown - a.overgrown);
}

/**
 * Pods expected over the next days: today's ready pods, then every flower
 * whose ready window opens on that day (the flower countdown, summed).
 */
export function upcomingPods(days = 4, extraReady = 0): { date: Date; pods: number }[] {
  const grid = allRows(extraReady);
  const today = grid.flatMap((g) => g.rows).reduce((n, r) => n + r.ready, 0);
  const out = [{ date: TODAY, pods: today }];
  for (let i = 1; i < days; i++) {
    const day = addDays(TODAY, i);
    let pods = 0;
    for (const { farm, rows } of grid) {
      for (const r of rows) {
        for (const c of flowerCountdown(farm, r)) if (dayDiff(c.readyFrom, day) === 0) pods += c.count;
      }
    }
    out.push({ date: day, pods });
  }
  return out;
}

export function planTotals(rows: PlanRow[]) {
  return rows.reduce(
    (t, r) => ({
      must: t.must + r.overdue,
      ready: t.ready + r.ready,
      overgrown: t.overgrown + r.overgrown,
      flowers: t.flowers + r.flowers,
      minutes: t.minutes + r.minutes,
    }),
    { must: 0, ready: 0, overgrown: 0, flowers: 0, minutes: 0 },
  );
}

export const HARVEST_TOTALS = planTotals(harvestPlan());

// ── Pod grading (phone photo check + size from the fixed camera) ───
export type Maturity = 'too_small' | 'ready' | 'overgrown';
export type Grade = 'A' | 'B' | 'Processor' | '—';

/** Size bands in cm. Grade by shape and colour stays on the roadmap. */
export const SIZE = { readyMin: 7, gradeAMax: 10, overgrownFrom: 12 } as const;

export function gradePod(lengthCm: number): { maturity: Maturity; grade: Grade } {
  if (lengthCm < SIZE.readyMin) return { maturity: 'too_small', grade: '—' };
  if (lengthCm <= SIZE.gradeAMax) return { maturity: 'ready', grade: 'A' };
  if (lengthCm < SIZE.overgrownFrom) return { maturity: 'ready', grade: 'B' };
  return { maturity: 'overgrown', grade: 'Processor' };
}

// ── Formatting ─────────────────────────────────────────────────────
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const shortDay = (d: Date) => `${WEEKDAY[d.getDay()]} ${d.getDate()}`;

export function ago(from: Date, now = new Date()) {
  const mins = Math.max(0, Math.round((now.getTime() - from.getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  return `${h} h ago`;
}

/** "row 2" or "rows 1, 2, 3". */
export const rowsLabel = (rows: number[]) => `${rows.length === 1 ? 'row' : 'rows'} ${rows.join(', ')}`;

export const farmRowLabel = (farmId: string, row: number) => `${getFarm(farmId).name} · Row ${row}`;
