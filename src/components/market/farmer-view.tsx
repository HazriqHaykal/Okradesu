import {
  Check,
  ChevronDown,
  ChevronUp,
  Factory,
  ShieldAlert,
  Sun,
  Tag,
  Thermometer,
  Warehouse,
} from 'lucide-react-native';
import { Fragment, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ForecastChart } from '@/components/forecast-chart';
import { OkraPod } from '@/components/illustrations';
import {
  GRADE_LABEL,
  TYPE_LABEL,
  cap,
  chartDay,
  dayLabel,
  farmName,
  kg,
  yen,
} from '@/components/market/format';
import { Banner, EmptyNote, StatTile } from '@/components/market/states';
import { SupplyCalendar } from '@/components/market/supply-calendar';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Chip, ChipRow } from '@/components/ui/chip';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, Divider } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { AVG_POD_WEIGHT_G, MIN_SURPLUS_KG, PRICE_PER_KG, SURPLUS_DISCOUNT } from '@/constants/market';
import { Colors, Palette, Radius } from '@/constants/theme';
import { FARMS } from '@/data/farms';
import { useMarketForecast } from '@/hooks/use-market-forecast';
import {
  addDays,
  discountedPrice,
  estimateRevenue,
  overgrownSuggestion,
  supplyByDay,
  surplusAlerts,
  surplusLevel,
  type SurplusAlert,
} from '@/lib/forecast';
import { marketActions, useMarket } from '@/state/market-store';
import type { Listing, ListingStatus } from '@/types/market';

/** Alerts and listings shown before "Show all". */
const ALERT_LIMIT = 4;
const LISTING_LIMIT = 6;

const STATUS_TONE: Record<ListingStatus, BadgeTone> = { open: 'accent', reserved: 'success', sold: 'neutral' };

export type Scope = 'all' | string;

export function FarmerView({ scope, onScope }: { scope: Scope; onScope: (s: Scope) => void }) {
  const market = useMarket((s) => s);
  const { listings, reservations } = market;
  const { forecasts, histories, today } = useMarketForecast();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const farmIds = scope === 'all' ? FARMS.map((f) => f.id) : [scope];
  const scoped = forecasts.filter((f) => farmIds.includes(f.farmId));
  const supply = supplyByDay(scoped, listings, reservations);
  const week = supply.reduce(
    (t, d) => ({
      forecast: t.forecast + d.forecastKg,
      reserved: t.reserved + d.reservedKg,
      surplus: t.surplus + d.surplusKg,
    }),
    { forecast: 0, reserved: 0, surplus: 0 },
  );
  const revenue = estimateRevenue({
    listings,
    reservations,
    farmIds,
    from: today,
    to: addDays(today, supply.length - 1),
    surplusKg: week.surplus,
  });
  const weekLevel = surplusLevel(week.forecast > 0 ? week.surplus / week.forecast : 0);
  const alerts = surplusAlerts(scoped, listings, reservations);

  // Overgrown pods per farm, unless they're already listed today.
  const overgrown = farmIds
    .filter((id) => !listings.some((l) => l.farm_id === id && l.listing_type === 'overgrown' && l.harvest_date === today))
    .map((id) => ({ farmId: id, ...overgrownSuggestion(histories[id] ?? [], today) }))
    .filter((o) => o.kg > 0);
  const overgrownKg = overgrown.reduce((n, o) => n + o.kg, 0);
  const overgrownListedToday = listings.some(
    (l) => farmIds.includes(l.farm_id) && l.listing_type === 'overgrown' && l.harvest_date === today,
  );

  const chartMax = Math.max(0.1, ...supply.map((d) => Math.max(d.forecastKg, d.reservedKg)));
  const chart = supply.map((d) => {
    const sold = Math.min(d.reservedKg, d.forecastKg);
    return {
      day: chartDay(d.date, today),
      sold,
      open: d.surplusKg,
      hot: surplusLevel(d.forecastKg > 0 ? d.surplusKg / d.forecastKg : 0) === 'red',
    };
  });

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(null);
    }
  }

  const listSurplus = (a: SurplusAlert) =>
    run(`surplus-${a.farmId}-${a.date}`, () =>
      marketActions.createListing({
        farm_id: a.farmId,
        harvest_date: a.date,
        quantity_kg: a.toListKg,
        grade: 'A',
        price_per_kg: discountedPrice(PRICE_PER_KG.A),
        listing_type: 'surplus',
      }),
    );

  const listOvergrown = () =>
    run('overgrown', async () => {
      for (const o of overgrown) {
        await marketActions.createListing({
          farm_id: o.farmId,
          harvest_date: today,
          quantity_kg: o.kg,
          grade: 'overgrown',
          price_per_kg: PRICE_PER_KG.overgrown,
          listing_type: 'overgrown',
        });
      }
    });

  const penalties = scoped.filter((f) => f.penalty);
  const warm = scoped.filter((f) => f.warm);

  return (
    <View style={styles.stack}>
      <ChipRow>
        <Chip label="All farms" selected={scope === 'all'} onPress={() => onScope('all')} size="sm" />
        {FARMS.map((f) => (
          <Chip
            key={f.id}
            label={f.name}
            icon={f.kind === 'outdoor' ? Sun : Warehouse}
            selected={scope === f.id}
            onPress={() => onScope(f.id)}
            size="sm"
          />
        ))}
      </ChipRow>

      <View style={styles.stats}>
        <StatTile label="Expected this week" value={kg(week.forecast)} bg={Colors.accent} />
        <StatTile label="Reserved" value={kg(week.reserved)} note={`${pct(week.reserved, week.forecast)} of forecast`} />
        <StatTile
          label="Surplus"
          value={kg(week.surplus)}
          note={`${pct(week.surplus, week.forecast)} unsold`}
          bg={weekLevel === 'red' ? Colors.danger : weekLevel === 'amber' ? Palette.orange200 : Colors.surfaceCard}
          fg={weekLevel === 'red' ? Colors.surfaceCard : weekLevel === 'amber' ? Palette.orange800 : Colors.textPrimary}
        />
        <StatTile
          label="Est. revenue"
          value={yen(revenue.totalYen)}
          note={`${yen(revenue.reservedYen)} reserved`}
        />
      </View>

      <Card style={styles.forecast}>
        <View style={{ gap: 2 }}>
          <Txt variant="heading">7-day yield forecast</Txt>
          <Txt variant="small" color={Colors.textSecondary}>
            Today&apos;s ready pods, then flowers counted 4–6 days earlier, at {AVG_POD_WEIGHT_G} g a pod.
          </Txt>
        </View>
        <ForecastChart
          data={chart}
          maxKg={chartMax}
          soldLabel="Reserved"
          openLabel="Surplus"
          hotLabel="Surplus over 25%"
        />
        {warm.length ? (
          <View style={styles.note}>
            <Thermometer size={14} color={Colors.textSecondary} strokeWidth={2} />
            <Txt variant="caption" weight={600} color={Colors.textSecondary} style={{ flex: 1 }}>
              Warm at {warm.map((f) => farmName(f.farmId)).join(', ')}: pods ready {warm[0].lagDays} days after
              flowering, a day sooner.
            </Txt>
          </View>
        ) : null}
      </Card>

      {penalties.map((f) => (
        <Banner key={f.farmId} tone="danger" icon={ShieldAlert} title={`${farmName(f.farmId)} forecast −${Math.round(f.penalty!.pct * 100)}%.`}>
          {f.penalty!.reason}.
        </Banner>
      ))}

      {error ? <Banner tone="danger" icon={ShieldAlert} title="Not saved.">{error}</Banner> : null}

      <SectionHeader title="Surplus Alerts" />
      <SurplusAlerts alerts={alerts} today={today} busy={busy} onList={listSurplus} />

      {overgrownKg > 0 ? (
        <View style={styles.processor}>
          <OkraPod width={56} tone="overgrown" />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ gap: 2 }}>
              <Txt variant="body" weight={800} color={Palette.orange800}>
                {kg(overgrownKg)} overgrown, list for processors?
              </Txt>
              <Txt variant="small" color={Palette.orange800}>
                {overgrown.reduce((n, o) => n + o.pods, 0)} pods pass fresh-market size by tomorrow. Pickle makers pay{' '}
                {yen(PRICE_PER_KG.overgrown)}/kg.
              </Txt>
            </View>
            <Button
              label={busy === 'overgrown' ? 'Listing…' : 'List for processors'}
              icon={Factory}
              size="sm"
              disabled={busy !== null}
              onPress={listOvergrown}
            />
          </View>
        </View>
      ) : overgrownListedToday ? (
        <Banner tone="success" icon={Check} title="Overgrown pods listed.">
          Processors can reserve them in the Buyer view.
        </Banner>
      ) : null}

      <SectionHeader title="My Listings" />
      <MyListings
        listings={listings.filter((l) => farmIds.includes(l.farm_id))}
        today={today}
        busy={busy}
        onConfirm={(id) => run(`confirm-${id}`, () => marketActions.setReservationStatus(id, 'confirmed'))}
      />

      <SectionHeader title="Year-round Supply" />
      <SupplyCalendar month={new Date().getMonth() + 1} />
    </View>
  );
}

const pct = (part: number, whole: number) => `${whole > 0 ? Math.round((part / whole) * 100) : 0}%`;

// ── Surplus alerts ─────────────────────────────────────────────────
function SurplusAlerts({
  alerts,
  today,
  busy,
  onList,
}: {
  alerts: SurplusAlert[];
  today: string;
  busy: string | null;
  onList: (a: SurplusAlert) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  if (!alerts.length) {
    return (
      <Banner tone="success" icon={Check} title="No surplus this week.">
        Reservations cover the forecast on every day.
      </Banner>
    );
  }
  const shown = showAll ? alerts : alerts.slice(0, ALERT_LIMIT);
  const price = discountedPrice(PRICE_PER_KG.A);
  return (
    <View style={{ gap: 10 }}>
      {shown.map((a) => {
        const key = `surplus-${a.farmId}-${a.date}`;
        const when = dayLabel(a.date, today);
        return (
          <Card key={key} style={styles.alert}>
            <View style={styles.alertHead}>
              <Badge
                label={`${Math.round(a.pct * 100)}% unsold`}
                tone={a.level === 'red' ? 'danger' : 'accent'}
              />
              <Txt variant="caption" weight={700} color={Colors.textSecondary}>
                {farmName(a.farmId)}
              </Txt>
            </View>
            <Txt variant="bodyLg" weight={800}>
              ~{kg(a.surplusKg)} extra {when === 'Today' || when === 'Tomorrow' ? when.toLowerCase() : `on ${when}`}
            </Txt>
            <Txt variant="small" color={Colors.textSecondary} tabular>
              Forecast {kg(a.forecastKg)} · reserved {kg(a.reservedKg)}
            </Txt>
            {a.toListKg >= MIN_SURPLUS_KG ? (
              <Button
                label={busy === key ? 'Listing…' : `List ${kg(a.toListKg)} as surplus · ${yen(price)}/kg`}
                icon={Tag}
                size="sm"
                disabled={busy !== null}
                onPress={() => onList(a)}
              />
            ) : (
              <Badge label="Listed · waiting for buyers" tone="success" icon={Check} />
            )}
          </Card>
        );
      })}
      {alerts.length > ALERT_LIMIT ? (
        <ShowAll open={showAll} count={alerts.length} noun="alerts" onToggle={() => setShowAll((s) => !s)} />
      ) : null}
      <Txt variant="caption" color={Colors.textSecondary}>
        Surplus listings go out {Math.round(SURPLUS_DISCOUNT * 100)}% off so they sell before the pods get tough.
      </Txt>
    </View>
  );
}

// ── My listings ────────────────────────────────────────────────────
function MyListings({
  listings,
  today,
  busy,
  onConfirm,
}: {
  listings: Listing[];
  today: string;
  busy: string | null;
  onConfirm: (reservationId: string) => void;
}) {
  const { reservations, buyers } = useMarket((s) => s);
  const [showAll, setShowAll] = useState(false);
  if (!listings.length) {
    return (
      <EmptyNote art={<OkraPod width={56} />}>
        No listings yet. List a surplus above and buyers can reserve it.
      </EmptyNote>
    );
  }
  // Newest first, so a listing made from an alert sits on top.
  const sorted = [...listings].sort(
    (a, b) => b.created_at.localeCompare(a.created_at) || a.harvest_date.localeCompare(b.harvest_date),
  );
  const shown = showAll ? sorted : sorted.slice(0, LISTING_LIMIT);
  const buyerName = (id: string) => buyers.find((b) => b.id === id)?.name ?? 'Buyer';

  return (
    <View style={{ gap: 10 }}>
      <Card style={styles.list}>
        {shown.map((l, i) => {
          const res = reservations.filter((r) => r.listing_id === l.id && r.status !== 'cancelled');
          const resKg = res.reduce((n, r) => n + r.quantity_kg, 0);
          const pending = res.filter((r) => r.status === 'pending');
          return (
            <Fragment key={l.id}>
              {i > 0 ? <Divider /> : null}
              <View style={styles.listing}>
                <View style={styles.listingTop}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt variant="body" weight={800}>
                      {dayLabel(l.harvest_date, today)} · {farmName(l.farm_id)}
                    </Txt>
                    <Txt variant="small" color={Colors.textSecondary} tabular>
                      {kg(l.quantity_kg)} · {GRADE_LABEL[l.grade]} · {yen(l.price_per_kg)}/kg
                    </Txt>
                  </View>
                  <View style={styles.badgesRight}>
                    <Badge label={cap(l.status)} tone={STATUS_TONE[l.status]} />
                    {l.listing_type !== 'regular' ? (
                      <Badge label={TYPE_LABEL[l.listing_type]} tone={l.listing_type === 'surplus' ? 'solid' : 'accent'} />
                    ) : null}
                  </View>
                </View>
                <Txt variant="caption" color={Colors.textSecondary} tabular>
                  {res.length
                    ? `${res.length} ${res.length === 1 ? 'reservation' : 'reservations'} · ${kg(resKg)}`
                    : 'No reservations yet'}
                </Txt>
                {pending.map((r) => (
                  <View key={r.id} style={styles.pending}>
                    <Txt variant="small" weight={700} style={{ flex: 1 }}>
                      {buyerName(r.buyer_id)} wants {kg(r.quantity_kg)}
                    </Txt>
                    <Button
                      label={busy === `confirm-${r.id}` ? 'Saving…' : 'Confirm'}
                      size="sm"
                      disabled={busy !== null}
                      onPress={() => onConfirm(r.id)}
                    />
                  </View>
                ))}
              </View>
            </Fragment>
          );
        })}
      </Card>
      {sorted.length > LISTING_LIMIT ? (
        <ShowAll open={showAll} count={sorted.length} noun="listings" onToggle={() => setShowAll((s) => !s)} />
      ) : null}
    </View>
  );
}

function ShowAll({ open, count, noun, onToggle }: { open: boolean; count: number; noun: string; onToggle: () => void }) {
  return (
    <Button
      label={open ? 'Show fewer' : `Show all ${count} ${noun}`}
      variant="ghost"
      size="md"
      icon={open ? ChevronUp : ChevronDown}
      block
      onPress={onToggle}
    />
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  forecast: { padding: 18, gap: 16 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alert: { padding: 16, gap: 6 },
  alertHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  processor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: Palette.orange200,
  },
  list: { paddingHorizontal: 16, paddingVertical: 4 },
  listing: { paddingVertical: 12, gap: 6 },
  listingTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  badgesRight: { alignItems: 'flex-end', gap: 4 },
  pending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceTint,
  },
});
