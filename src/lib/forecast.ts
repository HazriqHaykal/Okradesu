/**
 * Market Intelligence (module 5) logic: yield forecast, surplus alerts,
 * overgrown suggestions and revenue. Pure functions over table rows, so they
 * run the same on the demo store, on Supabase data and in unit tests.
 */
import {
  AVG_POD_WEIGHT_G,
  CAMERA_ROW_COVERAGE,
  DISEASE_PENALTY,
  FLOWER_TO_POD_DAYS,
  FORECAST_DAYS,
  MATURITY_SPREAD,
  MIN_SURPLUS_KG,
  OVERGROWN_POD_WEIGHT_G,
  PRICE_PER_KG,
  SURPLUS_AMBER,
  SURPLUS_DISCOUNT,
  SURPLUS_RED,
  WARM_TEMP_C,
} from '@/constants/market';
import type { HarvestDetection, Listing, Reservation } from '@/types/market';

// ── Dates ──────────────────────────────────────────────────────────
/** Local calendar day as `YYYY-MM-DD` (not UTC, so early-morning Japan stays "today"). */
export function isoDay(d: Date) {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseDay(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number) {
  const d = parseDay(iso);
  d.setDate(d.getDate() + n);
  return isoDay(d);
}

// ── Units ──────────────────────────────────────────────────────────
export const roundKg = (kg: number) => Math.round(kg * 10) / 10;

/**
 * Camera pod counts → kg. Counts cover `coverage` of the row, so they are
 * scaled up to the whole row first.
 */
export function podsToKg(pods: number, gramsPerPod = AVG_POD_WEIGHT_G, coverage = CAMERA_ROW_COVERAGE) {
  return ((pods / coverage) * gramsPerPod) / 1000;
}

// ── Camera history ─────────────────────────────────────────────────
export type DailyCounts = { date: string; flowers: number; ready: number; overdue: number };

/**
 * One total per day for a farm. The camera can report a row several times a
 * day; only the latest result per row counts, then rows are summed.
 */
export function dailyCounts(detections: HarvestDetection[], farmId: string): DailyCounts[] {
  const latest = new Map<string, HarvestDetection>();
  for (const d of detections) {
    if (d.farm_id !== farmId) continue;
    const key = `${isoDay(new Date(d.recorded_at))}|${d.row}`;
    const prev = latest.get(key);
    if (!prev || prev.recorded_at < d.recorded_at) latest.set(key, d);
  }
  const days = new Map<string, DailyCounts>();
  for (const [key, d] of latest) {
    const date = key.split('|')[0];
    const t = days.get(date) ?? { date, flowers: 0, ready: 0, overdue: 0 };
    t.flowers += d.flowers;
    t.ready += d.ready_pods;
    t.overdue += d.overdue_pods;
    days.set(date, t);
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// ── Yield forecast ─────────────────────────────────────────────────
/** Days from flower to pod: warmer weather (from sensor_readings) brings pods ~1 day sooner. */
export const maturityLag = (meanTempC: number) => FLOWER_TO_POD_DAYS - (meanTempC >= WARM_TEMP_C ? 1 : 0);

/** Average new flowers per day over the last week of camera results. */
export function flowerRate(history: DailyCounts[], today: string, days = 7) {
  const from = addDays(today, -(days - 1));
  const recent = history.filter((h) => h.date >= from && h.date <= today);
  return recent.length ? recent.reduce((n, h) => n + h.flowers, 0) / recent.length : 0;
}

export type ForecastPoint = { date: string; pods: number; kg: number };

export type FarmForecast = {
  farmId: string;
  days: ForecastPoint[];
  totalKg: number;
  lagDays: number;
  warm: boolean;
  /** Set while a disease-risk alert is unresolved. */
  penalty: { pct: number; reason: string } | null;
};

/**
 * Next `FORECAST_DAYS` days for one farm:
 * - today = ready pods the camera counted today;
 * - day D = flowers that opened `lag` days before D, spread over lag−1 … lag+1
 *   (MATURITY_SPREAD), because pods don't all mature on the same day;
 * - flowers that haven't opened yet (D − lag is after today) are estimated
 *   from the last week's average flower rate;
 * - an unresolved disease risk cuts the whole forecast by DISEASE_PENALTY.
 */
export function forecastFarm(input: {
  farmId: string;
  history: DailyCounts[];
  today: string;
  meanTempC: number;
  diseaseRisk?: string;
  days?: number;
  penaltyPct?: number;
}): FarmForecast {
  const { farmId, history, today, meanTempC, diseaseRisk } = input;
  const horizon = input.days ?? FORECAST_DAYS;
  const penaltyPct = input.penaltyPct ?? DISEASE_PENALTY;

  const byDate = new Map(history.map((h) => [h.date, h]));
  const rate = flowerRate(history, today);
  const flowersOn = (date: string) => (date > today ? rate : (byDate.get(date)?.flowers ?? rate));

  const lag = maturityLag(meanTempC);
  const factor = diseaseRisk ? 1 - penaltyPct : 1;

  const days: ForecastPoint[] = Array.from({ length: horizon }, (_, k) => {
    const date = addDays(today, k);
    const pods =
      k === 0
        ? (byDate.get(today)?.ready ?? 0)
        : MATURITY_SPREAD.reduce((n, w, i) => n + w * flowersOn(addDays(date, -(lag - 1 + i))), 0);
    return { date, pods, kg: podsToKg(pods) * factor };
  });

  return {
    farmId,
    days,
    totalKg: days.reduce((n, d) => n + d.kg, 0),
    lagDays: lag,
    warm: meanTempC >= WARM_TEMP_C,
    penalty: diseaseRisk
      ? {
          pct: penaltyPct,
          reason: `${diseaseRisk}: forecast cut ${Math.round(penaltyPct * 100)}% until the alert is resolved`,
        }
      : null,
  };
}

// ── Reservations ───────────────────────────────────────────────────
const active = (r: Reservation) => r.status !== 'cancelled';

/** kg still free on a listing after pending and confirmed reservations. */
export function availableKg(listing: Listing, reservations: Reservation[]) {
  const taken = reservations
    .filter((r) => r.listing_id === listing.id && active(r))
    .reduce((n, r) => n + r.quantity_kg, 0);
  return Math.max(0, roundKg(listing.quantity_kg - taken));
}

/** Status a listing should have once its reservations change (sold stays sold). */
export function statusAfter(listing: Listing, reservations: Reservation[]): Listing['status'] {
  if (listing.status === 'sold') return 'sold';
  return availableKg(listing, reservations) <= 0 ? 'reserved' : 'open';
}

/** Reserved kg per `farm|date`, for fresh (non-overgrown) listings. */
export function reservedByFarmDate(listings: Listing[], reservations: Reservation[]) {
  const byId = new Map(listings.map((l) => [l.id, l]));
  const out = new Map<string, number>();
  for (const r of reservations) {
    const l = byId.get(r.listing_id);
    if (!l || !active(r) || l.listing_type === 'overgrown') continue;
    const key = `${l.farm_id}|${l.harvest_date}`;
    out.set(key, (out.get(key) ?? 0) + r.quantity_kg);
  }
  return out;
}

/** Unreserved kg already offered on open fresh listings for a farm and day. */
export function listedOpenKg(listings: Listing[], reservations: Reservation[], farmId: string, date: string) {
  return listings
    .filter(
      (l) => l.farm_id === farmId && l.harvest_date === date && l.status === 'open' && l.listing_type !== 'overgrown',
    )
    .reduce((n, l) => n + availableKg(l, reservations), 0);
}

// ── Surplus ────────────────────────────────────────────────────────
export type SurplusLevel = 'none' | 'amber' | 'red';

/** Over 10% of the forecast unsold is amber, over 25% red. */
export function surplusLevel(pct: number): SurplusLevel {
  if (pct > SURPLUS_RED) return 'red';
  if (pct > SURPLUS_AMBER) return 'amber';
  return 'none';
}

/** Surplus = forecast − reserved (never negative). */
export function surplusFor(forecastKg: number, reservedKg: number) {
  const kg = Math.max(0, forecastKg - reservedKg);
  const pct = forecastKg > 0 ? kg / forecastKg : 0;
  return { kg, pct, level: surplusLevel(pct) };
}

export type SurplusAlert = {
  farmId: string;
  date: string;
  forecastKg: number;
  reservedKg: number;
  surplusKg: number;
  pct: number;
  level: Exclude<SurplusLevel, 'none'>;
  /** Surplus not yet on an open listing; the one-click listing offers this. */
  toListKg: number;
};

/** Every farm-day whose surplus crosses the amber line (and is at least MIN_SURPLUS_KG), biggest first. */
export function surplusAlerts(
  forecasts: FarmForecast[],
  listings: Listing[],
  reservations: Reservation[],
): SurplusAlert[] {
  const reserved = reservedByFarmDate(listings, reservations);
  return forecasts
    .flatMap((f) =>
      f.days.map((d) => {
        const reservedKg = reserved.get(`${f.farmId}|${d.date}`) ?? 0;
        const s = surplusFor(d.kg, reservedKg);
        const listed = listedOpenKg(listings, reservations, f.farmId, d.date);
        return {
          farmId: f.farmId,
          date: d.date,
          forecastKg: d.kg,
          reservedKg,
          surplusKg: s.kg,
          pct: s.pct,
          level: s.level,
          toListKg: roundKg(Math.max(0, s.kg - listed)),
        };
      }),
    )
    .filter((a): a is SurplusAlert => a.level !== 'none' && a.surplusKg >= MIN_SURPLUS_KG)
    .sort((a, b) => b.surplusKg - a.surplusKg);
}

// ── Chart + summary ────────────────────────────────────────────────
export type DaySupply = { date: string; forecastKg: number; reservedKg: number; surplusKg: number };

/** Farms added up per day: forecast, reserved (capped at forecast) and surplus. */
export function supplyByDay(forecasts: FarmForecast[], listings: Listing[], reservations: Reservation[]) {
  const reserved = reservedByFarmDate(listings, reservations);
  const dates = forecasts[0]?.days.map((d) => d.date) ?? [];
  return dates.map<DaySupply>((date, i) => {
    let forecastKg = 0;
    let reservedKg = 0;
    for (const f of forecasts) {
      forecastKg += f.days[i].kg;
      reservedKg += reserved.get(`${f.farmId}|${date}`) ?? 0;
    }
    return { date, forecastKg, reservedKg, surplusKg: Math.max(0, forecastKg - reservedKg) };
  });
}

export const discountedPrice = (price: number, pct = SURPLUS_DISCOUNT) => Math.round(price * (1 - pct));

/**
 * Money expected this week: every active reservation at its listing price,
 * plus the remaining surplus if it sells at the surplus discount.
 */
export function estimateRevenue(input: {
  listings: Listing[];
  reservations: Reservation[];
  farmIds: string[];
  from: string;
  to: string;
  surplusKg: number;
}) {
  const byId = new Map(input.listings.map((l) => [l.id, l]));
  const reservedYen = input.reservations.reduce((n, r) => {
    const l = byId.get(r.listing_id);
    if (!l || !active(r) || !input.farmIds.includes(l.farm_id)) return n;
    if (l.harvest_date < input.from || l.harvest_date > input.to) return n;
    return n + r.quantity_kg * l.price_per_kg;
  }, 0);
  const surplusYen = input.surplusKg * discountedPrice(PRICE_PER_KG.A);
  return { reservedYen, surplusYen, totalYen: Math.round(reservedYen + surplusYen) };
}

// ── Overgrown ──────────────────────────────────────────────────────
/** Today's overdue pods (overgrown by tomorrow) as a processor listing suggestion. */
export function overgrownSuggestion(history: DailyCounts[], today: string) {
  const pods = history.find((h) => h.date === today)?.overdue ?? 0;
  return { pods, kg: roundKg(podsToKg(pods, OVERGROWN_POD_WEIGHT_G)) };
}
