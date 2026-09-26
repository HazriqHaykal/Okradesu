import { Check, FilterX, Store, TriangleAlert } from 'lucide-react-native';
import { Fragment, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { OkraPod } from '@/components/illustrations';
import { ListingCard } from '@/components/market/listing-card';
import {
  BUYER_TYPE_LABEL,
  GRADE_LABEL,
  RESERVATION_TONE,
  TYPE_LABEL,
  cap,
  dayLabel,
  farmName,
  kg,
  yen,
} from '@/components/market/format';
import { Banner, EmptyNote } from '@/components/market/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Chip, ChipRow } from '@/components/ui/chip';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, Divider } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors } from '@/constants/theme';
import { availableKg } from '@/lib/forecast';
import { marketActions, marketToday, useMarket } from '@/state/market-store';
import type { ListingGrade, ListingType } from '@/types/market';

const GRADES: ListingGrade[] = ['A', 'B', 'overgrown'];
const TYPES: ListingType[] = ['regular', 'surplus', 'overgrown'];

export function BuyerView({ buyerId, onBuyer }: { buyerId: string; onBuyer: (id: string) => void }) {
  const { buyers, listings, reservations } = useMarket((s) => s);
  const today = marketToday();
  const [date, setDate] = useState<string | null>(null);
  const [grade, setGrade] = useState<ListingGrade | null>(null);
  const [type, setType] = useState<ListingType | null>(null);
  const [justReserved, setJustReserved] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const buyer = buyers.find((b) => b.id === buyerId) ?? buyers[0];

  // Open listings from today on, with something left to reserve.
  const open = listings
    .filter((l) => l.status === 'open' && l.harvest_date >= today)
    .map((l) => ({ listing: l, available: availableKg(l, reservations) }))
    .filter((x) => x.available > 0)
    .sort((a, b) => a.listing.harvest_date.localeCompare(b.listing.harvest_date));
  const dates = [...new Set(open.map((x) => x.listing.harvest_date))];
  const shown = open.filter(
    (x) =>
      (!date || x.listing.harvest_date === date) &&
      (!grade || x.listing.grade === grade) &&
      (!type || x.listing.listing_type === type),
  );
  const filtered = !!(date || grade || type);

  const mine = reservations
    .filter((r) => r.buyer_id === buyer?.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  if (!buyer) {
    return <EmptyNote art={<OkraPod width={56} />}>No buyers yet. Run supabase/market.sql to add them.</EmptyNote>;
  }

  return (
    <View style={styles.stack}>
      <View style={{ gap: 8 }}>
        <Txt variant="micro" color={Colors.textSecondary}>
          Buying as
        </Txt>
        <ChipRow>
          {buyers.map((b) => (
            <Chip key={b.id} label={b.name} selected={b.id === buyer.id} onPress={() => onBuyer(b.id)} size="sm" />
          ))}
        </ChipRow>
        <Txt variant="small" color={Colors.textSecondary}>
          {BUYER_TYPE_LABEL[buyer.type]} · {buyer.location}
        </Txt>
      </View>

      {justReserved ? (
        <Banner tone="success" icon={Check} title="Reserved.">
          {justReserved} The farmer sees it now and will confirm.
        </Banner>
      ) : null}

      <SectionHeader title="Open Listings" />
      <View style={{ gap: 8 }}>
        <ChipRow>
          <Chip label="Any day" selected={!date} onPress={() => setDate(null)} size="sm" />
          {dates.map((d) => (
            <Chip key={d} label={dayLabel(d, today)} selected={date === d} onPress={() => setDate(d)} size="sm" />
          ))}
        </ChipRow>
        <ChipRow>
          <Chip label="Any grade" selected={!grade} onPress={() => setGrade(null)} size="sm" />
          {GRADES.map((g) => (
            <Chip key={g} label={GRADE_LABEL[g]} selected={grade === g} onPress={() => setGrade(g)} size="sm" />
          ))}
        </ChipRow>
        <ChipRow>
          <Chip label="Any type" selected={!type} onPress={() => setType(null)} size="sm" />
          {TYPES.map((t) => (
            <Chip key={t} label={TYPE_LABEL[t]} selected={type === t} onPress={() => setType(t)} size="sm" />
          ))}
        </ChipRow>
      </View>

      {shown.length ? (
        <View style={{ gap: 10 }}>
          {shown.map(({ listing, available }) => (
            <ListingCard
              // Remount when the available kg changes so the default quantity follows it.
              key={`${listing.id}-${available}`}
              listing={listing}
              available={available}
              today={today}
              onReserve={async (qty) => {
                await marketActions.reserve(listing.id, buyer.id, qty);
                setJustReserved(
                  `${kg(qty)} from ${farmName(listing.farm_id)} for ${dayLabel(listing.harvest_date, today).toLowerCase()}.`,
                );
              }}
            />
          ))}
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <EmptyNote art={<Store size={28} color={Colors.textSecondary} strokeWidth={2} />}>
            {filtered
              ? 'No open listings match these filters.'
              : 'Nothing open right now. Farmers list surplus as soon as the forecast shows it.'}
          </EmptyNote>
          {filtered ? (
            <Button
              label="Clear filters"
              icon={FilterX}
              variant="ghost"
              size="md"
              onPress={() => {
                setDate(null);
                setGrade(null);
                setType(null);
              }}
            />
          ) : null}
        </View>
      )}

      <SectionHeader title="My Reservations" />
      {cancelError ? (
        <Banner tone="danger" icon={TriangleAlert} title="Not cancelled.">
          {cancelError}
        </Banner>
      ) : null}
      {mine.length ? (
        <Card style={styles.list}>
          {mine.map((r, i) => {
            const l = listings.find((x) => x.id === r.listing_id);
            return (
              <Fragment key={r.id}>
                {i > 0 ? <Divider /> : null}
                <View style={styles.row}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt variant="body" weight={800} tabular>
                      {kg(r.quantity_kg)}
                      {l ? ` · ${farmName(l.farm_id)}` : ''}
                    </Txt>
                    {l ? (
                      <Txt variant="small" color={Colors.textSecondary} tabular>
                        {dayLabel(l.harvest_date, today)} · {GRADE_LABEL[l.grade]} · {yen(l.price_per_kg * r.quantity_kg)}
                      </Txt>
                    ) : null}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Badge label={cap(r.status)} tone={RESERVATION_TONE[r.status]} />
                    {r.status === 'pending' ? (
                      <Button
                        label={cancelling === r.id ? 'Cancelling…' : 'Cancel'}
                        variant="ghost"
                        size="sm"
                        disabled={cancelling !== null}
                        onPress={async () => {
                          setCancelling(r.id);
                          setCancelError(null);
                          try {
                            await marketActions.setReservationStatus(r.id, 'cancelled');
                          } catch (e) {
                            setCancelError(e instanceof Error ? e.message : 'Could not cancel. Try again.');
                          } finally {
                            setCancelling(null);
                          }
                        }}
                        style={{ height: 28, paddingHorizontal: 8 }}
                      />
                    ) : null}
                  </View>
                </View>
              </Fragment>
            );
          })}
        </Card>
      ) : (
        <EmptyNote art={<OkraPod width={56} />}>
          No reservations yet. Reserve from a listing above; pending ones turn confirmed when the farmer accepts.
        </EmptyNote>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  list: { paddingHorizontal: 16, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
});
