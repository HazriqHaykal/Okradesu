import { useMemo } from 'react';

import { useDemo } from '@/data/demo';
import { allRows, harvestPlan, upcomingPods } from '@/data/harvest';

/** Harvest data with demo mode's extra camera pods applied, so every screen agrees. */
export function useHarvest() {
  const { newPods } = useDemo();
  const grid = useMemo(() => allRows(newPods), [newPods]);
  const plan = useMemo(() => harvestPlan(undefined, newPods), [newPods]);
  const upcoming = useMemo(() => upcomingPods(4, newPods), [newPods]);
  return { extraReady: newPods, grid, plan, upcoming };
}
