import { Bell } from 'lucide-react-native';
import { useState } from 'react';

import { BuyerView } from '@/components/market/buyer-view';
import { FarmerView, type Scope } from '@/components/market/farmer-view';
import { MarketError, MarketLoading } from '@/components/market/states';
import { Screen } from '@/components/screen';
import { IconButton } from '@/components/ui/button';
import { Segmented } from '@/components/ui/chip';
import { ScreenTitle } from '@/components/ui/section-header';
import { marketActions, useMarket } from '@/state/market-store';

type Role = 'farmer' | 'buyer';

/**
 * Market Intelligence: the farmer sees the week's forecast, surplus and
 * listings; the buyer browses and reserves. The switch stands in for login.
 */
export default function MarketScreen() {
  const { status, error, source, buyers } = useMarket((s) => s);
  const [role, setRole] = useState<Role>('farmer');
  const [scope, setScope] = useState<Scope>('all');
  const [buyerId, setBuyerId] = useState<string | null>(null);

  return (
    <Screen>
      <ScreenTitle
        kicker={`Next 7 days · ${source === 'supabase' ? 'live' : 'demo data'}`}
        title="Market"
        right={<IconButton icon={Bell} label="Alerts" href="/alerts" />}
      />

      <Segmented
        value={role}
        onChange={setRole}
        options={[
          { value: 'farmer', label: 'Farmer' },
          { value: 'buyer', label: 'Buyer' },
        ]}
      />

      {status === 'loading' ? <MarketLoading /> : null}
      {status === 'error' ? (
        <MarketError message={error ?? 'Check your connection.'} onRetry={marketActions.retry} />
      ) : null}
      {status === 'ready' && role === 'farmer' ? <FarmerView scope={scope} onScope={setScope} /> : null}
      {status === 'ready' && role === 'buyer' ? (
        <BuyerView buyerId={buyerId ?? buyers[0]?.id ?? ''} onBuyer={setBuyerId} />
      ) : null}
    </Screen>
  );
}
