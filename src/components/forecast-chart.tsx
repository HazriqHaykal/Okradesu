import { StyleSheet, View } from 'react-native';

import { Txt } from '@/components/ui/text';
import { Colors, Palette } from '@/constants/theme';
import { FORECAST, type ForecastDay } from '@/data/farms';

/** Top of the scale when every day is small. */
const MIN_MAX_KG = 70;

export type ChartDay = ForecastDay & {
  /** Paints the open part red (e.g. surplus over 25% of the day). */
  hot?: boolean;
};

const fmtKg = (kg: number) => (Number.isInteger(kg) ? `${kg}` : kg.toFixed(1));

/**
 * Stacked daily bars: sold ahead (green) under not-yet-matched (orange 300).
 * @category Harvest
 */
export function ForecastChart({
  height = 140,
  barWidth = 28,
  showUnit = false,
  data = FORECAST,
  soldLabel = 'Sold ahead',
  openLabel = 'Not yet matched',
  hotLabel,
  maxKg,
}: {
  height?: number;
  barWidth?: number;
  showUnit?: boolean;
  data?: ChartDay[];
  soldLabel?: string;
  openLabel?: string;
  /** Legend entry for red bars; shown only when set. */
  hotLabel?: string;
  maxKg?: number;
}) {
  const max = maxKg ?? Math.max(MIN_MAX_KG, ...data.map((d) => d.sold + d.open));
  const unmatched = data
    .filter((d) => d.open > 0)
    .map((d) => `${d.day} ${fmtKg(d.open)} kg`)
    .join(', ');
  return (
    <View style={{ gap: 14 }}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Daily harvest forecast. ${openLabel}: ${unmatched || 'none'}.`}
        style={styles.bars}>
        {data.map((d, i) => (
          <View key={d.day} style={styles.col}>
            <Txt variant="caption" weight={700} color={Colors.textSecondary} tabular>
              {fmtKg(d.sold + d.open)}
              {showUnit ? ' kg' : ''}
            </Txt>
            <View style={[styles.stack, { height, width: '100%', maxWidth: barWidth }]}>
              {d.open > 0 ? (
                <View
                  style={[
                    styles.open,
                    { height: Math.max(3, Math.round((d.open / max) * height)) },
                    d.hot && styles.hot,
                  ]}
                />
              ) : null}
              <View
                style={[
                  styles.sold,
                  { height: Math.round((d.sold / max) * height) },
                  d.open > 0 ? styles.soldUnder : null,
                ]}
              />
            </View>
            <Txt
              variant="caption"
              weight={i === 0 ? 800 : 600}
              color={i === 0 ? Colors.textPrimary : Colors.textSecondary}>
              {d.day}
            </Txt>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <LegendSwatch color={Colors.success} label={soldLabel} />
        <LegendSwatch color={Palette.orange300} label={openLabel} />
        {hotLabel ? <LegendSwatch color={Colors.danger} label={hotLabel} /> : null}
      </View>
    </View>
  );
}

/**
 * Small coloured square plus a label, for chart and map legends.
 * @category Harvest
 */
export function LegendSwatch({
  color,
  label,
  outlined,
}: {
  color: string;
  label: string;
  outlined?: boolean;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }, outlined && styles.swatchOutline]} />
      <Txt variant="caption" weight={600} color={Colors.textBody}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  col: { flex: 1, alignItems: 'center', gap: 6 },
  stack: { justifyContent: 'flex-end', gap: 2 },
  open: {
    backgroundColor: Palette.orange300,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderRadius: 2,
  },
  hot: { backgroundColor: Colors.danger },
  sold: { backgroundColor: Colors.success, borderRadius: 6 },
  soldUnder: { borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  swatchOutline: { borderWidth: 1, borderColor: Colors.borderSubtle },
});
