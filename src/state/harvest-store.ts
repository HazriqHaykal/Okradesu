/**
 * In-memory store for what the farmer records on the phone: picking batches
 * (the `harvest_batches` table) and phone photo checks. Resets on reload;
 * swap the actions for Supabase inserts when the backend is ready.
 */
import { useSyncExternalStore } from 'react';

import type { Grade, Maturity } from '@/data/harvest';

export type HarvestBatch = {
  id: string;
  farmId: string;
  rows: number[];
  pickedAt: Date;
  podCount: number;
  overgrownCount: number;
};

export type PodCheck = {
  id: string;
  at: Date;
  farmId?: string;
  row?: number;
  lengthCm: number;
  maturity: Maturity;
  grade: Grade;
  confidence: number;
  photoUri?: string;
  /** True while no pod-check model endpoint is configured. */
  simulated: boolean;
};

type State = { batches: HarvestBatch[]; checks: PodCheck[] };

const HOUR = 60 * 60 * 1000;
let state: State = {
  batches: [
    {
      id: 'b-seed-1',
      farmId: 'field-a',
      rows: [1, 2, 3],
      pickedAt: new Date(Date.now() - 30 * HOUR),
      podCount: 42,
      overgrownCount: 3,
    },
    {
      id: 'b-seed-2',
      farmId: 'classroom-2',
      rows: [1, 2],
      pickedAt: new Date(Date.now() - 26 * HOUR),
      podCount: 12,
      overgrownCount: 0,
    },
  ],
  checks: [],
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

let seq = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${seq++}`;

export const harvestActions = {
  addBatch(batch: Omit<HarvestBatch, 'id' | 'pickedAt'>) {
    const created: HarvestBatch = { ...batch, id: newId('b'), pickedAt: new Date() };
    state = { ...state, batches: [created, ...state.batches] };
    emit();
    return created;
  },
  addCheck(check: Omit<PodCheck, 'id' | 'at'>) {
    const created: PodCheck = { ...check, id: newId('c'), at: new Date() };
    state = { ...state, checks: [created, ...state.checks] };
    emit();
    return created;
  },
};

export function useHarvestStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(state),
  );
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Row keys (`farmId#row`) already picked today, with the time they were picked. */
export function pickedToday(batches: HarvestBatch[], now = new Date()) {
  const map = new Map<string, Date>();
  for (const b of batches) {
    if (!sameDay(b.pickedAt, now)) continue;
    for (const r of b.rows) map.set(`${b.farmId}#${r}`, b.pickedAt);
  }
  return map;
}

/** Batches older than this should go out first. */
export const DELIVER_FIRST_HOURS = 24;
