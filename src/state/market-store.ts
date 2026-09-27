/**
 * Market Intelligence store: buyers, listings, reservations and camera
 * results, kept live. With Supabase configured it loads the tables and
 * follows realtime changes; otherwise it runs on the in-memory demo seed and
 * adds camera results every 30 s. Reservations arrive from buyers outside
 * the app (LINE, phone) and show up in the farmer view as they land.
 */
import { useSyncExternalStore } from 'react';

import { MOCK_DETECTION_EVERY_MS } from '@/constants/market';
import { DETECTIONS } from '@/data/detections';
import { FARMS } from '@/data/farms';
import { seedMarket } from '@/data/market-seed';
import { isoDay, statusAfter } from '@/lib/forecast';
import { supabase, uniqueChannel } from '@/lib/supabase';
import type {
  Buyer,
  HarvestDetection,
  Listing,
  NewListing,
  Reservation,
  ReservationStatus,
} from '@/types/market';

type Tables = {
  buyers: Buyer[];
  listings: Listing[];
  reservations: Reservation[];
  detections: HarvestDetection[];
};

export type MarketState = Tables & {
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  source: 'demo' | 'supabase';
};

type TableKey = keyof Tables;
type Change = {
  [K in TableKey]: { table: K; type: 'upsert' | 'delete'; row: Tables[K][number] };
}[TableKey];

type Backend = {
  load(): Promise<Tables>;
  /** Starts realtime (or the demo camera feed); returns a stop function. */
  listen(onChange: (c: Change) => void): () => void;
  createListing(input: NewListing): Promise<Listing>;
  setReservationStatus(id: string, status: ReservationStatus): Promise<void>;
};

const EMPTY: Tables = { buyers: [], listings: [], reservations: [], detections: [] };

let state: MarketState = { ...EMPTY, status: 'loading', error: null, source: supabase ? 'supabase' : 'demo' };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function apply({ table, type, row }: Change) {
  const list: { id: string }[] = state[table];
  const next =
    type === 'delete'
      ? list.filter((r) => r.id !== row.id)
      : list.some((r) => r.id === row.id)
        ? list.map((r) => (r.id === row.id ? row : r))
        : [...list, row];
  state = { ...state, [table]: next };
  emit();
}

// ── Demo backend (no Supabase) ─────────────────────────────────────
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let seq = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${seq++}`;

/** Small delay so busy states are visible, like a real round trip. */
const LATENCY_MS = 350;

const demoBackend: Backend = {
  async load() {
    return seedMarket();
  },
  listen(onChange) {
    // Stand-in for the AI camera: a fresh result for every row every 30 s.
    const t = setInterval(() => {
      const now = new Date();
      for (const farm of FARMS) {
        for (const base of DETECTIONS[farm.id] ?? []) {
          const wobble = Math.round(Math.random() * 2) - 1;
          onChange({
            table: 'detections',
            type: 'upsert',
            row: {
              id: newId('det'),
              farm_id: farm.id,
              row: base.row,
              flowers: base.flowers,
              ready_pods: Math.max(0, base.ready + wobble),
              overdue_pods: base.overdue,
              recorded_at: now.toISOString(),
            } satisfies HarvestDetection,
          });
        }
      }
    }, MOCK_DETECTION_EVERY_MS);
    return () => clearInterval(t);
  },
  async createListing(input) {
    await wait(LATENCY_MS);
    const listing: Listing = { ...input, id: newId('lst'), status: 'open', created_at: new Date().toISOString() };
    apply({ table: 'listings', type: 'upsert', row: listing });
    return listing;
  },
  async setReservationStatus(id, status) {
    await wait(LATENCY_MS);
    const r = state.reservations.find((x) => x.id === id);
    if (!r) throw new Error('Reservation not found.');
    apply({ table: 'reservations', type: 'upsert', row: { ...r, status } });
    const listing = state.listings.find((l) => l.id === r.listing_id);
    if (listing) {
      apply({ table: 'listings', type: 'upsert', row: { ...listing, status: statusAfter(listing, state.reservations) } });
    }
  },
};

// ── Supabase backend ───────────────────────────────────────────────
/** Postgres numerics can arrive as strings. */
const num = (v: unknown) => Number(v);
const cleanListing = (l: Listing): Listing => ({ ...l, quantity_kg: num(l.quantity_kg), price_per_kg: num(l.price_per_kg) });
const cleanReservation = (r: Reservation): Reservation => ({ ...r, quantity_kg: num(r.quantity_kg) });

const TABLE_OF: Record<string, TableKey> = {
  listings: 'listings',
  reservations: 'reservations',
  harvest_detections: 'detections',
};

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

function supabaseBackend(db: NonNullable<typeof supabase>): Backend {
  return {
    async load() {
      const [buyers, listings, reservations, detections] = await Promise.all([
        db.from('buyers').select('*').order('name'),
        db.from('listings').select('*').order('harvest_date'),
        db.from('reservations').select('*').order('created_at'),
        // Latest result per row and day for the last 14 days (see market.sql).
        db.from('harvest_detections_latest').select('*'),
      ]);
      return {
        buyers: check(buyers) as Buyer[],
        listings: (check(listings) as Listing[]).map(cleanListing),
        reservations: (check(reservations) as Reservation[]).map(cleanReservation),
        detections: check(detections) as HarvestDetection[],
      };
    },
    listen(onChange) {
      const channel = db.channel(uniqueChannel('market'));
      for (const table of Object.keys(TABLE_OF)) {
        channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          const key = TABLE_OF[table];
          if (payload.eventType === 'DELETE') {
            onChange({ table: key, type: 'delete', row: payload.old } as Change);
            return;
          }
          let row = payload.new;
          if (key === 'listings') row = cleanListing(row as Listing);
          if (key === 'reservations') row = cleanReservation(row as Reservation);
          onChange({ table: key, type: 'upsert', row } as Change);
        });
      }
      channel.subscribe();
      return () => {
        db.removeChannel(channel);
      };
    },
    async createListing(input) {
      const listing = cleanListing(check(await db.from('listings').insert(input).select().single()) as Listing);
      apply({ table: 'listings', type: 'upsert', row: listing });
      return listing;
    },
    async setReservationStatus(id, status) {
      check(await db.rpc('set_reservation_status', { p_id: id, p_status: status }));
    },
  };
}

const backend: Backend = supabase ? supabaseBackend(supabase) : demoBackend;

// ── Lifecycle ──────────────────────────────────────────────────────
let started = false;
let stop: (() => void) | null = null;

async function start() {
  stop?.();
  state = { ...state, status: 'loading', error: null };
  emit();
  try {
    const tables = await backend.load();
    state = { ...state, ...tables, status: 'ready' };
    stop = backend.listen(apply);
  } catch (e) {
    state = { ...state, status: 'error', error: e instanceof Error ? e.message : 'Could not load the market.' };
  }
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  if (!started) {
    started = true;
    start();
  }
  return () => listeners.delete(l);
}

export function useMarket<T>(select: (s: MarketState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(state),
  );
}

export const marketActions = {
  retry: start,
  createListing: (input: NewListing) => backend.createListing(input),
  setReservationStatus: (id: string, status: ReservationStatus) => backend.setReservationStatus(id, status),
};

/** Today as the market sees it (local calendar day). */
export const marketToday = () => isoDay(new Date());
