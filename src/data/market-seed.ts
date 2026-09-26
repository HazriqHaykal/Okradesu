/**
 * Demo data for Market Intelligence, the same rows `supabase/market.sql`
 * seeds: 4 buyers, 14 days of camera results per farm, standing orders for
 * the coming week and a few open listings. Used when Supabase isn't set up.
 */
import { DETECTIONS, type DetectionRow } from '@/data/detections';
import { FARMS } from '@/data/farms';
import { addDays, dailyCounts, forecastFarm, isoDay, roundKg } from '@/lib/forecast';
import { PRICE_PER_KG } from '@/constants/market';
import type { Buyer, HarvestDetection, Listing, Reservation } from '@/types/market';

export const SEED_BUYERS: Buyer[] = [
  { id: 'buyer-tanpopo', name: 'Izakaya Tanpopo', type: 'restaurant', location: 'Hinode' },
  { id: 'buyer-kotobuki', name: 'Soba Kotobuki', type: 'restaurant', location: 'Kawabe' },
  { id: 'buyer-pickles', name: 'Kawabe Pickles', type: 'processor', location: 'Kawabe' },
  { id: 'buyer-minami', name: 'Minami Wholesale Market', type: 'wholesaler', location: 'Minami' },
];

/** Standing orders take the restaurants and the wholesaler in turn. */
const STANDING_BUYERS = ['buyer-tanpopo', 'buyer-kotobuki', 'buyer-minami'];

/**
 * Share of each day's forecast already covered by standing orders (today …
 * +6 days). The end of the week is under-booked, which raises the alerts.
 */
const COVERAGE = [1, 1, 0.97, 0.95, 0.92, 0.8, 0.6];
/** Small indoor rooms are easier to sell out. */
const FARM_BOOST: Record<string, number> = { 'classroom-2': 1.1, 'house-4': 1.2, 'post-office': 1.2 };

/**
 * Camera counts `daysAgo` days back for one row. Today is the sample
 * detection itself (so the Harvest tab agrees); earlier days vary around it.
 * `supabase/market.sql` uses the same formula.
 */
export function pastCounts(base: DetectionRow, daysAgo: number) {
  if (daysAgo === 0) return { flowers: base.flowers, ready: base.ready, overdue: base.overdue };
  const flowers = Math.max(0, base.flowers + ((daysAgo * 7 + base.row * 3) % 4) - 1);
  const ready = Math.max(0, base.ready + ((daysAgo * 5 + base.row) % 3) - 1);
  const overdue = Math.min(ready, (daysAgo + base.row) % 3 === 0 ? 1 : 0);
  return { flowers, ready, overdue };
}

const at0540 = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 5, 40).toISOString();
};

export function seedDetections(today: string): HarvestDetection[] {
  return FARMS.flatMap((farm) =>
    (DETECTIONS[farm.id] ?? []).flatMap((base) =>
      Array.from({ length: 14 }, (_, daysAgo) => {
        const c = pastCounts(base, daysAgo);
        return {
          id: `det-${farm.id}-${base.row}-${daysAgo}`,
          farm_id: farm.id,
          row: base.row,
          flowers: c.flowers,
          ready_pods: c.ready,
          overdue_pods: c.overdue,
          recorded_at: at0540(addDays(today, -daysAgo)),
        };
      }),
    ),
  );
}

export function seedMarket(now = new Date()) {
  const today = isoDay(now);
  const detections = seedDetections(today);
  const created = new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString();
  const listings: Listing[] = [];
  const reservations: Reservation[] = [];

  FARMS.forEach((farm, fi) => {
    const forecast = forecastFarm({
      farmId: farm.id,
      history: dailyCounts(detections, farm.id),
      today,
      meanTempC: farm.meanTempC,
      diseaseRisk: farm.risk,
    });
    forecast.days.forEach((day, k) => {
      const share = Math.min(1, COVERAGE[k] * (FARM_BOOST[farm.id] ?? 1));
      // Fully booked days round up so rounding never shows up as surplus.
      const kg = share === 1 ? Math.ceil(day.kg * 10) / 10 : roundKg(day.kg * share);
      if (kg <= 0) return;
      const id = `lst-${farm.id}-${k}`;
      listings.push({
        id,
        farm_id: farm.id,
        harvest_date: day.date,
        quantity_kg: kg,
        grade: 'A',
        price_per_kg: PRICE_PER_KG.A,
        listing_type: 'regular',
        status: 'reserved',
        created_at: created,
      });
      reservations.push({
        id: `res-${farm.id}-${k}`,
        listing_id: id,
        buyer_id: STANDING_BUYERS[(fi + k) % STANDING_BUYERS.length],
        quantity_kg: kg,
        status: 'confirmed',
        created_at: created,
      });
    });
  });

  // A few open listings buyers can reserve right away.
  const open = (id: string, farmId: string, k: number, kg: number, grade: 'A' | 'B'): Listing => ({
    id,
    farm_id: farmId,
    harvest_date: addDays(today, k),
    quantity_kg: kg,
    grade,
    price_per_kg: PRICE_PER_KG[grade],
    listing_type: 'regular',
    status: 'open',
    created_at: created,
  });
  listings.push(open('lst-open-1', 'field-b', 5, 0.3, 'A'), open('lst-open-2', 'gymnasium', 4, 0.2, 'B'));

  // Yesterday's overgrown pods went to the pickle maker.
  listings.push({
    id: 'lst-overgrown-1',
    farm_id: 'field-a',
    harvest_date: addDays(today, -1),
    quantity_kg: 0.6,
    grade: 'overgrown',
    price_per_kg: PRICE_PER_KG.overgrown,
    listing_type: 'overgrown',
    status: 'sold',
    created_at: created,
  });
  reservations.push({
    id: 'res-overgrown-1',
    listing_id: 'lst-overgrown-1',
    buyer_id: 'buyer-pickles',
    quantity_kg: 0.6,
    status: 'confirmed',
    created_at: created,
  });

  return { buyers: SEED_BUYERS, detections, listings, reservations };
}
