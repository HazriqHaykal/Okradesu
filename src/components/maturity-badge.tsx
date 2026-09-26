import { Badge } from '@/components/ui/badge';
import type { Maturity } from '@/data/harvest';

export function MaturityBadge({ maturity }: { maturity: Maturity }) {
  if (maturity === 'ready') return <Badge label="Ready" tone="solid" />;
  if (maturity === 'overgrown') return <Badge label="Overgrown" tone="danger" />;
  return <Badge label="Too small" tone="neutral" />;
}
