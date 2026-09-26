import { PRICE_PER_KG } from '@/constants/market';
import { FARMS } from '@/data/farms';
import { shortDay } from '@/data/harvest';
import { addDays, parseDay } from '@/lib/forecast';
import type { BuyerType, Listing, ListingType, ReservationStatus } from '@/types/market';

export const farmById = (id: string) => FARMS.find((f) => f.id === id);
export const farmName = (id: string) => farmById(id)?.name ?? id;

/** "Today", "Tomorrow" or "Fri 2". */
export function dayLabel(date: string, today: string) {
  if (date === today) return 'Today';
  if (date === addDays(today, 1)) return 'Tomorrow';
  return shortDay(parseDay(date));
}

/** "Fri" or "Today" for chart columns. */
export function chartDay(date: string, today: string) {
  if (date === today) return 'Today';
  return shortDay(parseDay(date)).split(' ')[0];
}

export const kg = (n: number) => `${n.toFixed(1)} kg`;
export const yen = (n: number) => `¥${Math.round(n).toLocaleString('en-US')}`;

export const TYPE_LABEL: Record<ListingType, string> = {
  regular: 'Regular',
  surplus: 'Surplus',
  overgrown: 'Overgrown',
};

export const GRADE_LABEL = { A: 'Grade A', B: 'Grade B', overgrown: 'Overgrown' } as const;

export const BUYER_TYPE_LABEL: Record<BuyerType, string> = {
  restaurant: 'Restaurant',
  processor: 'Processor',
  wholesaler: 'Wholesaler',
};

export const RESERVATION_TONE: Record<ReservationStatus, 'accent' | 'success' | 'neutral'> = {
  pending: 'accent',
  confirmed: 'success',
  cancelled: 'neutral',
};

/** Discount against the regular grade-A price (overgrown) or the same grade (surplus). */
export function discountPct(l: Listing) {
  if (l.listing_type === 'regular') return 0;
  const full = l.listing_type === 'overgrown' ? PRICE_PER_KG.A : PRICE_PER_KG[l.grade];
  return Math.max(0, Math.round((1 - l.price_per_kg / full) * 100));
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
