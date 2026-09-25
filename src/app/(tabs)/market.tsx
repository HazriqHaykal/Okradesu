import { Bell, Check, Store, TriangleAlert, Truck } from 'lucide-react-native';
import { Fragment, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ForecastChart } from '@/components/forecast-chart';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { Button, IconButton } from '@/components/ui/button';
import { ScreenTitle, SectionHeader } from '@/components/ui/section-header';
import { Card, Divider } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Palette, Radius } from '@/constants/theme';
import { BUYERS, FORECAST_OPEN, FORECAST_TOTAL, type BuyerStatus } from '@/data/farms';

export default function MarketScreen() {
  const [status, setStatus] = useState<Record<string, BuyerStatus>>(() =>
    Object.fromEntries(BUYERS.map((b) => [b.id, b.status])),
  );
  const [offered, setOffered] = useState(false);
  const soldPct = Math.round(((FORECAST_TOTAL - FORECAST_OPEN) / FORECAST_TOTAL) * 100);

  return (
    <Screen>
      <ScreenTitle
        kicker="Next 7 days · all farms"
        title="Market"
        right={<IconButton icon={Bell} label="Alerts, 2 new" href="/alerts" dot />}
      />

      <Card style={styles.forecast}>
        <View style={styles.kpis}>
          <View style={styles.kpi}>
            <Txt variant="micro" color={Colors.textSecondary}>
              Harvest forecast
            </Txt>
            <Txt variant="title" tabular style={styles.kpiValue}>
              {FORECAST_TOTAL} kg
            </Txt>
          </View>
          <View style={styles.kpi}>
            <Txt variant="micro" color={Colors.textSecondary}>
              Sold ahead
            </Txt>
            <Txt variant="title" tabular color={Colors.successFg} style={styles.kpiValue}>
              {soldPct}%
            </Txt>
          </View>
        </View>
        <ForecastChart />
      </Card>

      {offered ? (
        <View style={[styles.banner, { backgroundColor: Colors.successBg }]}>
          <Check size={20} color={Colors.successFg} strokeWidth={2.5} />
          <Txt variant="body" color={Colors.successFg} style={{ flex: 1 }}>
            <Txt variant="body" weight={800} color={Colors.successFg}>
              Offer sent.
            </Txt>{' '}
            We shared {FORECAST_OPEN} kg with nearby restaurants and processors. You&apos;ll get replies in
            LINE.
          </Txt>
        </View>
      ) : (
        <>
          <View style={[styles.banner, { backgroundColor: Palette.orange200 }]}>
            <TriangleAlert size={20} color={Palette.orange800} strokeWidth={2} />
            <Txt variant="body" color={Palette.orange800} style={{ flex: 1 }}>
              <Txt variant="body" weight={800} color={Palette.orange800}>
                {FORECAST_OPEN} kg unmatched for Tue–Fri.
              </Txt>{' '}
              Offer it now, before pods grow past fresh-market size.
            </Txt>
          </View>
          <Button
            label={`Offer ${FORECAST_OPEN} kg to buyers`}
            icon={Store}
            block
            onPress={() => setOffered(true)}
          />
        </>
      )}

      <SectionHeader title="Matched Buyers" />
      <Card style={styles.buyers}>
        {BUYERS.map((b, i) => {
          const s = status[b.id];
          return (
            <Fragment key={b.id}>
              {i > 0 ? <Divider /> : null}
              <View style={styles.buyer}>
                <View style={styles.avatar}>
                  <Txt variant="small" weight={800}>
                    {b.initials}
                  </Txt>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="bodyLg" weight={800}>
                    {b.name}
                  </Txt>
                  <Txt variant="small" color={Colors.textSecondary}>
                    {b.kind} · {b.detail}
                  </Txt>
                </View>
                {s === 'confirmed' ? <Badge label="Confirmed" tone="success" /> : null}
                {s === 'pending' ? <Badge label="Pending" tone="accent" /> : null}
                {s === 'offer' ? (
                  <Button
                    label="Accept"
                    size="sm"
                    onPress={() => setStatus((st) => ({ ...st, [b.id]: 'confirmed' }))}
                  />
                ) : null}
              </View>
            </Fragment>
          );
        })}
      </Card>

      <View style={styles.note}>
        <Truck size={18} color={Colors.textSecondary} strokeWidth={2} />
        <Txt variant="small" color={Colors.textSecondary} style={{ flex: 1 }}>
          Pickup from each farm at 12:00 on delivery days. Overgrown pods go to processors instead of the bin.
        </Txt>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  forecast: { padding: 18, gap: 16 },
  kpis: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  kpi: { flex: 1, gap: 2 },
  kpiValue: { fontSize: 26, lineHeight: 32 },
  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: Radius.md },
  buyers: { paddingHorizontal: 16, paddingVertical: 4 },
  buyer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Palette.orange300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
});
