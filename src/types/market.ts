/**
 * Market Intelligence rows, shaped exactly like the tables in
 * `supabase/market.sql` (snake_case, dates as ISO strings) so the same
 * objects come from the in-memory demo store or from Supabase.
 */

/** One camera result per row, the format agreed with the AI teammate (B → C). */
export type HarvestDetection = {
  id: string;
  farm_id: string;
  row: number;
  flowers: number;
  ready_pods: number;
  /** Ready pods that will be overgrown by tomorrow. */
  overdue_pods: number;
  recorded_at: string;
};

export type BuyerType = 'restaurant' | 'processor' | 'wholesaler';

export type Buyer = {
  id: string;
  name: string;
  type: BuyerType;
  location: string;
};

export type ListingGrade = 'A' | 'B' | 'overgrown';
export type ListingType = 'regular' | 'surplus' | 'overgrown';
export type ListingStatus = 'open' | 'reserved' | 'sold';

export type Listing = {
  id: string;
  farm_id: string;
  /** Local calendar day, `YYYY-MM-DD`. */
  harvest_date: string;
  quantity_kg: number;
  grade: ListingGrade;
  price_per_kg: number;
  listing_type: ListingType;
  status: ListingStatus;
  created_at: string;
};

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export type Reservation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  quantity_kg: number;
  status: ReservationStatus;
  created_at: string;
};

export type NewListing = Pick<
  Listing,
  'farm_id' | 'harvest_date' | 'quantity_kg' | 'grade' | 'price_per_kg' | 'listing_type'
>;
