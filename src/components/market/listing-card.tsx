import { CalendarDays, Minus, Plus, ShoppingBasket, Sun, Warehouse } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { GRADE_LABEL, TYPE_LABEL, dayLabel, discountPct, farmById, farmName, kg, yen } from '@/components/market/format';
import { Badge } from '@/components/ui/badge';
import { Button, IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { PRICE_PER_KG } from '@/constants/market';
import { Colors, Fonts, Radius, Shadow, TextSize } from '@/constants/theme';
import { roundKg } from '@/lib/forecast';
import type { Listing } from '@/types/market';

const STEP_KG = 0.1;

/** An open listing a buyer can reserve part or all of. */
export function ListingCard({
  listing,
  available,
  today,
  onReserve,
}: {
  listing: Listing;
  available: number;
  today: string;
  onReserve: (kg: number) => Promise<void>;
}) {
  const [text, setText] = useState(available.toFixed(1));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qty = Number(text.replace(',', '.'));
  const invalid =
    !Number.isFinite(qty) || qty <= 0
      ? 'Enter how many kg.'
      : qty > available
        ? `Only ${kg(available)} available.`
        : null;

  const farm = farmById(listing.farm_id);
  const off = discountPct(listing);
  const fullPrice = listing.listing_type === 'overgrown' ? PRICE_PER_KG.A : PRICE_PER_KG[listing.grade];

  const step = (d: number) => {
    const base = Number.isFinite(qty) ? qty : 0;
    setText(Math.min(available, Math.max(STEP_KG, roundKg(base + d))).toFixed(1));
    setError(null);
  };

  async function reserve() {
    if (invalid) return;
    setBusy(true);
    setError(null);
    try {
      await onReserve(roundKg(qty));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reserve. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.titleRow}>
            <Txt variant="bodyLg" weight={800} numberOfLines={1} style={{ flexShrink: 1 }}>
              {farmName(listing.farm_id)}
            </Txt>
            {farm ? (
              <Badge
                label={farm.kind === 'outdoor' ? 'Outdoor' : 'Indoor'}
                tone="neutral"
                icon={farm.kind === 'outdoor' ? Sun : Warehouse}
              />
            ) : null}
          </View>
          <View style={styles.meta}>
            <CalendarDays size={13} color={Colors.textSecondary} strokeWidth={2} />
            <Txt variant="small" color={Colors.textSecondary}>
              Harvest {dayLabel(listing.harvest_date, today).toLowerCase()} · {GRADE_LABEL[listing.grade]}
            </Txt>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Txt variant="title" tabular>
            {yen(listing.price_per_kg)}
          </Txt>
          <Txt variant="caption" color={Colors.textSecondary}>
            per kg
          </Txt>
        </View>
      </View>

      <View style={styles.badges}>
        {off > 0 ? <Badge label={`−${off}%`} tone="danger" /> : null}
        {listing.listing_type !== 'regular' ? (
          <Badge label={TYPE_LABEL[listing.listing_type]} tone={listing.listing_type === 'surplus' ? 'solid' : 'accent'} />
        ) : null}
        {off > 0 ? (
          <Txt variant="caption" color={Colors.textSecondary} style={styles.strike}>
            {yen(fullPrice)}/kg
          </Txt>
        ) : null}
        <Txt variant="small" weight={700} tabular style={{ marginLeft: 'auto' }}>
          {kg(available)} available
        </Txt>
      </View>

      <View style={styles.reserveRow}>
        <View style={styles.qty}>
          <IconButton icon={Minus} label="Less" size={36} onPress={() => step(-STEP_KG)} />
          <TextInput
            accessibilityLabel="Quantity in kg"
            value={text}
            onChangeText={(t) => {
              setText(t);
              setError(null);
            }}
            keyboardType="decimal-pad"
            inputMode="decimal"
            selectTextOnFocus
            style={styles.input}
          />
          <Txt variant="small" weight={700} color={Colors.textSecondary}>
            kg
          </Txt>
          <IconButton icon={Plus} label="More" size={36} onPress={() => step(STEP_KG)} />
        </View>
        <Button
          label={busy ? 'Reserving…' : 'Reserve'}
          icon={ShoppingBasket}
          size="md"
          disabled={busy || !!invalid}
          onPress={reserve}
          style={{ flexGrow: 1 }}
        />
      </View>
      {(error ?? (text && invalid)) ? (
        <Txt variant="small" weight={700} color={Colors.dangerFg}>
          {error ?? invalid}
        </Txt>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  badges: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  strike: { textDecorationLine: 'line-through' },
  reserveRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  qty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceSunken,
  },
  input: {
    width: 52,
    height: 36,
    textAlign: 'center',
    fontFamily: Fonts.extrabold,
    fontSize: TextSize.bodyLg,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.sm,
    boxShadow: Shadow.tile,
    outlineWidth: 0,
  },
});
