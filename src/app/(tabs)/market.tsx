import { Bell } from 'lucide-react-native';
import { useState } from 'react';

import { FarmerView, type Scope } from '@/components/market/farmer-view';
import { MarketError, MarketLoading } from '@/components/market/states';
import { Screen } from '@/components/screen';
import { IconButton } from '@/components/ui/button';
import { ScreenTitle } from '@/components/ui/section-header';
import { marketActions, useMarket } from '@/state/market-store';

/** Market Intelligence: the week's forecast, surplus alerts and listings, so okra sells before it spoils. */
export default function MarketScreen() {
  const { status, error, source } = useMarket((s) => s);
  const [scope, setScope] = useState<Scope>('all');

  return (
    <Screen>
      <ScreenTitle
        kicker={`Next 7 days · ${source === 'supabase' ? 'live' : 'demo data'}`}
        title="Market"
        right={<IconButton icon={Bell} label="Alerts" href="/alerts" />}
      />

      {status === 'loading' ? <MarketLoading /> : null}
      {status === 'error' ? (
        <MarketError message={error ?? 'Check your connection.'} onRetry={marketActions.retry} />
      ) : null}
      {status === 'ready' ? <FarmerView scope={scope} onScope={setScope} /> : null}
    </Screen>
  );
}
