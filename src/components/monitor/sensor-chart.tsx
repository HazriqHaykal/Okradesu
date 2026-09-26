import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { Chip, ChipRow } from '@/components/ui/chip';
import { Txt } from '@/components/ui/text';
import { Colors, Palette } from '@/constants/theme';
import { METRICS, fmt, type FarmType, type MetricKey } from '@/data/monitor';
import type { HistoryPoint } from '@/hooks/use-live-farm';

const HEIGHT = 150;
const LEFT = 36;
const PAD_Y = 10;

/** Last 24 hours of one metric, with its target band shaded behind the line. */
export function SensorChart({ history, type }: { history: HistoryPoint[]; type: FarmType }) {
  const [key, setKey] = useState<MetricKey>('moisture');
  const [width, setWidth] = useState(0);
  const spec = METRICS.find((m) => m.key === key)!;
  const values = history.map((p) => p.reading[key]);
  const [tLo, tHi] = spec.target[type];
  const showBand = !(key === 'light' && type === 'outdoor');

  let lo = Math.min(...values, ...(showBand ? [tLo] : []));
  let hi = Math.max(...values, ...(showBand ? [tHi] : []));
  const pad = (hi - lo || 1) * 0.12;
  lo = Math.max(spec.scale[0], lo - pad);
  hi = Math.min(spec.scale[1], hi + pad);

  const plotW = Math.max(0, width - LEFT);
  const x = (i: number) => LEFT + (i / (values.length - 1)) * plotW;
  const y = (v: number) => PAD_Y + (1 - (v - lo) / (hi - lo || 1)) * (HEIGHT - PAD_Y * 2);
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(values.length - 1)},${HEIGHT} L${LEFT},${HEIGHT} Z`;
  const last = values[values.length - 1];
  const peak = values.indexOf(Math.max(...values));
  const hourLabel = (i: number) => {
    if (i === history.length - 1) return 'Now';
    return `${String(new Date(history[i].at).getHours()).padStart(2, '0')}:00`;
  };

  return (
    <View style={{ gap: 12 }}>
      <ChipRow>
        {METRICS.map((m) => (
          <Chip key={m.key} size="sm" label={m.short} selected={m.key === key} onPress={() => setKey(m.key)} />
        ))}
      </ChipRow>

      <View style={styles.head}>
        <Txt variant="title" tabular>
          {fmt(spec, last)}
          <Txt variant="small" weight={600} color={Colors.textSecondary}>
            {' '}
            {spec.unit}
          </Txt>
        </Txt>
        <Txt variant="caption" weight={600} color={Colors.textSecondary}>
          Peak {fmt(spec, values[peak])} at {hourLabel(peak)}
        </Txt>
      </View>

      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${spec.label} over the last 24 hours, now ${fmt(spec, last)} ${spec.unit}, peak ${fmt(spec, values[peak])} at ${hourLabel(peak)}.`}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ height: HEIGHT }}>
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            <Defs>
              <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={Palette.orange400} stopOpacity={0.28} />
                <Stop offset="1" stopColor={Palette.orange400} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {showBand ? (
              <Rect
                x={LEFT}
                width={plotW}
                y={y(Math.min(hi, tHi))}
                height={Math.max(0, y(Math.max(lo, tLo)) - y(Math.min(hi, tHi)))}
                fill={Colors.successBg}
                rx={4}
              />
            ) : null}
            <Path d={area} fill="url(#fill)" />
            <Path d={line} stroke={Colors.accent} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
            <Circle
              cx={x(values.length - 1)}
              cy={y(last)}
              r={5}
              fill={Colors.accent}
              stroke={Colors.surfaceCard}
              strokeWidth={2}
            />
          </Svg>
        ) : null}
        <Txt variant="caption" color={Colors.textSecondary} tabular style={[styles.yLabel, { top: 0 }]}>
          {fmt(spec, hi)}
        </Txt>
        <Txt variant="caption" color={Colors.textSecondary} tabular style={[styles.yLabel, { bottom: 0 }]}>
          {fmt(spec, lo)}
        </Txt>
      </View>

      <View style={[styles.xAxis, { paddingLeft: LEFT }]}>
        {[0, 6, 12, 18, history.length - 1].map((i) => (
          <Txt
            key={i}
            variant="caption"
            weight={i === history.length - 1 ? 800 : 600}
            color={i === history.length - 1 ? Colors.textPrimary : Colors.textSecondary}
            tabular>
            {hourLabel(i)}
          </Txt>
        ))}
      </View>
      {showBand ? (
        <View style={styles.legend}>
          <View style={styles.swatch} />
          <Txt variant="caption" weight={600} color={Colors.textBody}>
            Target {fmt(spec, tLo)}–{fmt(spec, tHi)} {spec.unit}
          </Txt>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  yLabel: { position: 'absolute', left: 0 },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 3, backgroundColor: Colors.successBg },
});
