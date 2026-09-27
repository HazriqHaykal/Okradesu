/**
 * Market Intelligence settings: one place to tune the forecast, alerts and
 * prices. Starting values; calibrate from real picking and sales records.
 */
import type { ListingGrade } from '@/types/market';

/** Average weight of one fresh pod at picking size. */
export const AVG_POD_WEIGHT_G = 12;
/** Overgrown pods are longer and heavier. */
export const OVERGROWN_POD_WEIGHT_G = 20;

/**
 * Share of a row one camera frame sees. Counts are divided by this to get
 * whole-row pods. Set to 1 once each camera covers its full row.
 */
export const CAMERA_ROW_COVERAGE = 0.25;

/** Days from an open flower to a pod at picking size, in normal weather. */
export const FLOWER_TO_POD_DAYS = 5;
/** Pods mature over a window around that day: 1 day early, on time, 1 day late. */
export const MATURITY_SPREAD = [0.25, 0.5, 0.25] as const;
/** At or above this mean air temperature pods are ready ~1 day sooner. */
export const WARM_TEMP_C = 27;

/** Forecast cut while a farm has an unresolved disease-risk alert. */
export const DISEASE_PENALTY = 0.15;

/** Surplus as a share of the day's forecast. */
export const SURPLUS_AMBER = 0.1;
export const SURPLUS_RED = 0.25;
/** Smaller surpluses aren't worth a listing. */
export const MIN_SURPLUS_KG = 0.1;

/** Farm-gate prices, ¥ per kg. */
export const PRICE_PER_KG: Record<ListingGrade, number> = { A: 1000, B: 700, overgrown: 300 };
/** Discount on a one-click surplus listing. */
export const SURPLUS_DISCOUNT = 0.2;

export const FORECAST_DAYS = 7;

/** Outdoor fields supply summer, indoor rooms the off-season; June and October overlap. */
export const SUPPLY_MONTHS = {
  outdoor: [6, 7, 8, 9, 10],
  indoor: [10, 11, 12, 1, 2, 3, 4, 5, 6],
} as const;

/** How often the demo store (and `scripts/mock-harvest.mjs`) adds camera results. */
export const MOCK_DETECTION_EVERY_MS = 30_000;
