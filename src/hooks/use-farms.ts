import { useDemo } from '@/data/demo';
import { MONITOR_FARMS, applyDemo, getMonitorFarm } from '@/data/monitor';

/** All farms as they are right now, including any demo-mode scenario. */
export function useFarms() {
  const demo = useDemo();
  return MONITOR_FARMS.map((f) => applyDemo(f, demo));
}

export function useFarm(id: string | undefined) {
  const demo = useDemo();
  return applyDemo(getMonitorFarm(id), demo);
}
