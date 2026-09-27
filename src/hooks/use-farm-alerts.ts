import { alertsFor } from '@/data/monitor';
import { useFarms } from '@/hooks/use-farms';
import { useWeather } from '@/hooks/use-weather';

/**
 * Farms plus the alerts Home, Alerts and the dashboard show: events and soil
 * problems (humidity warnings stay on each farm's page), one gateway alert for all farms.
 */
export function useFarmAlerts() {
  const { weather } = useWeather();
  const farms = useFarms();
  const alerts = farms
    .flatMap((f) => alertsFor(f, weather))
    .filter((a) => a.kind !== 'sensor' || a.severity === 'critical' || /-(moisture|ec)$/.test(a.id))
    .filter((a, i, list) => list.findIndex((b) => b.id === a.id) === i)
    .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'critical' ? -1 : 1));
  return { farms, alerts, weather };
}
