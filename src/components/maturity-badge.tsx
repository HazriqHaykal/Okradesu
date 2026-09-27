import { Badge } from '@/components/ui/badge';
import type { Maturity } from '@/data/harvest';

/**
 * Badge for a pod's maturity from the camera or phone check: Ready (orange), Overgrown (red) or Too small (neutral).
 * @category Harvest
 */
export function MaturityBadge({ maturity }: { maturity: Maturity }) {
  if (maturity === 'ready') return <Badge label="Ready" tone="solid" />;
  if (maturity === 'overgrown') return <Badge label="Overgrown" tone="danger" />;
  return <Badge label="Too small" tone="neutral" />;
}
