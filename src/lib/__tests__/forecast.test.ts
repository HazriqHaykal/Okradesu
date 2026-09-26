import { describe, expect, it } from '@jest/globals';

import { AVG_POD_WEIGHT_G, CAMERA_ROW_COVERAGE } from '@/constants/market';
import {
  addDays,
  availableKg,
  dailyCounts,
  discountedPrice,
  estimateRevenue,
  forecastFarm,
  maturityLag,
  overgrownSuggestion,
  podsToKg,
  statusAfter,
  surplusAlerts,
  surplusFor,
  surplusLevel,
  type DailyCounts,
} from '@/lib/forecast';
import type { HarvestDetection, Listing, Reservation } from '@/types/market';

const TODAY = '2026-09-26';

/** Same flowers and ready pods every day for the last two weeks. */
function flatHistory(flowers: number, ready = 0, overdue = 0): DailyCounts[] {
  return Array.from({ length: 14 }, (_, i) => ({ date: addDays(TODAY, -i), flowers, ready, overdue }));
}

const listing = (p: Partial<Listing> = {}): Listing => ({
  id: 'l1',
  farm_id: 'field-a',
  harvest_date: TODAY,
  quantity_kg: 2,
  grade: 'A',
  price_per_kg: 1000,
  listing_type: 'regular',
  status: 'open',
  created_at: '2026-09-24T00:00:00Z',
  ...p,
});

const reservation = (p: Partial<Reservation> = {}): Reservation => ({
  id: 'r1',
  listing_id: 'l1',
  buyer_id: 'b1',
  quantity_kg: 1,
  status: 'pending',
  created_at: '2026-09-25T00:00:00Z',
  ...p,
});

describe('units', () => {
  it('converts pods to kg at the configured pod weight and camera coverage', () => {
    expect(podsToKg(100)).toBeCloseTo((100 / CAMERA_ROW_COVERAGE) * AVG_POD_WEIGHT_G / 1000);
    expect(podsToKg(100, 12, 1)).toBeCloseTo(1.2);
  });

  it('gives a 20% discount by default', () => {
    expect(discountedPrice(1000)).toBe(800);
    expect(discountedPrice(1000, 0.5)).toBe(500);
  });
});

describe('dailyCounts', () => {
  it('keeps only the latest result per row per day, then sums rows', () => {
    const det = (row: number, ready: number, at: string): HarvestDetection => ({
      id: `${row}-${at}`,
      farm_id: 'field-a',
      row,
      flowers: 1,
      ready_pods: ready,
      overdue_pods: 0,
      recorded_at: at,
    });
    const days = dailyCounts(
      [
        det(1, 5, new Date(2026, 8, 26, 5, 40).toISOString()),
        det(1, 8, new Date(2026, 8, 26, 9, 0).toISOString()), // later today: replaces 5
        det(2, 3, new Date(2026, 8, 26, 5, 40).toISOString()),
        det(1, 4, new Date(2026, 8, 25, 5, 40).toISOString()),
        { ...det(1, 99, new Date(2026, 8, 26, 5, 40).toISOString()), farm_id: 'other' },
      ],
      'field-a',
    );
    expect(days).toEqual([
      { date: '2026-09-25', flowers: 1, ready: 4, overdue: 0 },
      { date: '2026-09-26', flowers: 2, ready: 11, overdue: 0 },
    ]);
  });
});

describe('forecastFarm', () => {
  const base = { farmId: 'field-a', today: TODAY, meanTempC: 25 };

  it('uses ready pods today and flowers from 4–6 days earlier after that', () => {
    const history = flatHistory(10, 30);
    // A burst of 50 flowers 4 days ago, i.e. 5 days before tomorrow.
    history[4] = { ...history[4], flowers: 50 };
    const f = forecastFarm({ ...base, history });
    expect(f.days).toHaveLength(7);
    expect(f.days[0].pods).toBe(30);
    // Tomorrow = 0.25 × flowers(−3) + 0.5 × flowers(−4) + 0.25 × flowers(−5).
    expect(f.days[1].pods).toBeCloseTo(0.25 * 10 + 0.5 * 50 + 0.25 * 10);
    expect(f.days[1].kg).toBeCloseTo(podsToKg(f.days[1].pods));
  });

  it('estimates flowers that have not opened yet from the weekly average', () => {
    const f = forecastFarm({ ...base, history: flatHistory(12) });
    // Day +6 needs flowers from +1 … −1; future ones come from the 12/day rate.
    expect(f.days[6].pods).toBeCloseTo(12);
  });

  it('brings pods forward a day when it is warm', () => {
    expect(maturityLag(25)).toBe(5);
    expect(maturityLag(28)).toBe(4);
    const history = flatHistory(0);
    history[3] = { ...history[3], flowers: 40 }; // opened 3 days ago
    const cool = forecastFarm({ ...base, history });
    const warm = forecastFarm({ ...base, meanTempC: 28, history });
    // Peak (lag) lands on day +2 when cool, day +1 when warm.
    expect(cool.days[2].pods).toBeCloseTo(20);
    expect(warm.days[1].pods).toBeCloseTo(20);
    expect(warm.warm).toBe(true);
  });

  it('cuts the forecast while a disease-risk alert is unresolved and says why', () => {
    const history = flatHistory(10, 20);
    const healthy = forecastFarm({ ...base, history });
    const sick = forecastFarm({ ...base, history, diseaseRisk: 'Mildew risk' });
    expect(sick.totalKg).toBeCloseTo(healthy.totalKg * 0.85);
    expect(sick.penalty?.reason).toMatch(/Mildew risk.*15%/);
    expect(healthy.penalty).toBeNull();
    expect(forecastFarm({ ...base, history, diseaseRisk: 'x', penaltyPct: 0.3 }).totalKg).toBeCloseTo(
      healthy.totalKg * 0.7,
    );
  });
});

describe('surplus', () => {
  it('flags amber over 10% and red over 25%', () => {
    expect(surplusLevel(0.1)).toBe('none');
    expect(surplusLevel(0.11)).toBe('amber');
    expect(surplusLevel(0.25)).toBe('amber');
    expect(surplusLevel(0.26)).toBe('red');
  });

  it('is forecast minus reserved and never negative', () => {
    expect(surplusFor(10, 7)).toEqual({ kg: 3, pct: 0.3, level: 'red' });
    expect(surplusFor(10, 12).kg).toBe(0);
    expect(surplusFor(0, 0).pct).toBe(0);
  });

  it('builds alerts per farm-day and only offers the part not already listed', () => {
    const forecast = forecastFarm({ farmId: 'field-a', today: TODAY, meanTempC: 25, history: flatHistory(0, 100) });
    const todayKg = forecast.days[0].kg; // 100 pods → 4.8 kg
    const listings = [
      listing({ id: 'standing', quantity_kg: todayKg / 2, status: 'reserved' }),
      listing({ id: 'open', quantity_kg: 1, listing_type: 'surplus' }),
    ];
    const reservations = [reservation({ listing_id: 'standing', quantity_kg: todayKg / 2, status: 'confirmed' })];
    const [alert] = surplusAlerts([forecast], listings, reservations);
    expect(alert.date).toBe(TODAY);
    expect(alert.level).toBe('red');
    expect(alert.surplusKg).toBeCloseTo(todayKg / 2);
    expect(alert.toListKg).toBeCloseTo(todayKg / 2 - 1, 1);
  });
});

describe('listings and reservations', () => {
  it('ignores cancelled reservations in available kg and status', () => {
    const l = listing({ quantity_kg: 2 });
    const res = [reservation({ quantity_kg: 1.5 }), reservation({ id: 'r2', quantity_kg: 0.5, status: 'cancelled' })];
    expect(availableKg(l, res)).toBe(0.5);
    expect(statusAfter(l, res)).toBe('open');
    expect(statusAfter(l, [...res, reservation({ id: 'r3', quantity_kg: 0.5 })])).toBe('reserved');
    expect(statusAfter({ ...l, status: 'sold' }, [])).toBe('sold');
  });

  it('adds reserved value and discounted surplus into revenue', () => {
    const r = estimateRevenue({
      listings: [listing(), listing({ id: 'l2', farm_id: 'other' })],
      reservations: [reservation({ quantity_kg: 2 }), reservation({ id: 'r2', listing_id: 'l2', quantity_kg: 5 })],
      farmIds: ['field-a'],
      from: TODAY,
      to: addDays(TODAY, 6),
      surplusKg: 1,
    });
    expect(r.reservedYen).toBe(2000);
    expect(r.surplusYen).toBe(800);
    expect(r.totalYen).toBe(2800);
  });
});

describe('overgrownSuggestion', () => {
  it("turns today's overdue pods into processor kg", () => {
    const s = overgrownSuggestion(flatHistory(0, 0, 10), TODAY);
    expect(s.pods).toBe(10);
    expect(s.kg).toBeGreaterThan(0);
    expect(overgrownSuggestion([], TODAY)).toEqual({ pods: 0, kg: 0 });
  });
});
