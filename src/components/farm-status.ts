import { Colors, Palette } from '@/constants/theme';
import type { FarmAlert, MonitorFarm } from '@/data/monitor';

export type FarmStatus = { label: string; dot: string; text: string; tone: 'ok' | 'warn' | 'bad' };

const BAD = { dot: Colors.danger, text: Colors.dangerFg, tone: 'bad' as const };
const WARN = { dot: Colors.accent, text: Palette.orange800, tone: 'warn' as const };
const OK = { dot: Colors.success, text: Colors.successFg, tone: 'ok' as const };

/** One or two words per farm, readable in a glance. */
export function farmStatus(farm: MonitorFarm, alerts: FarmAlert[]): FarmStatus {
  const mine = alerts.filter((a) => a.farmId === farm.id);
  if (mine.some((a) => a.kind === 'disaster')) {
    return { label: farm.hazard === 'flood' ? 'Flood risk' : 'Landslide', ...BAD };
  }
  if (farm.risk) return { label: farm.risk, ...BAD };
  if (mine.some((a) => a.severity === 'critical')) return { label: 'Needs you', ...BAD };
  if (farm.status === 'local') return { label: 'Offline', ...WARN };
  const first = mine[0];
  if (first) {
    const label = first.id.endsWith('-moisture')
      ? 'Dry soil'
      : first.id.endsWith('-ec')
        ? 'Low nutrients'
        : first.kind === 'facility'
          ? 'Fix device'
          : first.kind === 'network'
            ? 'Offline'
            : 'Check';
    return { label, ...WARN };
  }
  return { label: 'All good', ...OK };
}
