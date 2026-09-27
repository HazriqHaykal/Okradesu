import { router } from 'expo-router';
import { Check, Store } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LegendSwatch } from '@/components/forecast-chart';
import { Txt } from '@/components/ui/text';
import { Colors, Palette, Radius, Shadow } from '@/constants/theme';
import { shortDay, type PlanRow } from '@/data/harvest';
import type { Farm } from '@/data/farms';

const CELL_GAP = 6;

type Cell = { bg: string; fg: string };
const CELL: Record<'picked' | 'must' | 'ready' | 'processor' | 'none', Cell> = {
  picked: { bg: Colors.successFg, fg: Colors.surfaceCard },
  must: { bg: Colors.danger, fg: Colors.surfaceCard },
  ready: { bg: Colors.accent, fg: Colors.textOnAccent },
  processor: { bg: Colors.warnFg, fg: Colors.surfaceCard },
  none: { bg: Colors.surfaceSunken, fg: Colors.textSecondary },
};

function cellState(r: PlanRow, picked: boolean): keyof typeof CELL {
  if (picked) return 'picked';
  if (r.overdue > 0) return 'must';
  if (r.ready > 0) return 'ready';
  if (r.overgrown > 0) return 'processor';
  return 'none';
}

export const openRow = (r: PlanRow) =>
  router.navigate({ pathname: '/harvest/[farmId]/[row]', params: { farmId: r.farm.id, row: String(r.row) } });

/**
 * The daily harvest map: one line per farm, one square per growing row.
 * Red = must pick today, orange = ready, green = picked, grey = not yet.
 * @category Harvest
 */
export function HarvestGrid({
  grid,
  picked,
  maxCell = 36,
}: {
  grid: { farm: Farm; rows: PlanRow[] }[];
  picked: Map<string, Date>;
  maxCell?: number;
}) {
  // Size the squares so the farm with the most rows still fits on one line.
  const [cellsWidth, setCellsWidth] = useState(0);
  const maxRows = Math.max(...grid.map((g) => g.rows.length), 1);
  const cellSize = cellsWidth
    ? Math.min(maxCell, Math.floor((cellsWidth - CELL_GAP * (maxRows - 1)) / maxRows))
    : 28;

  return (
    <View style={styles.map}>
      {grid.map(({ farm, rows }) => (
        <View key={farm.id} style={styles.mapRow}>
          <View style={styles.mapName}>
            <Txt variant="small" weight={800} numberOfLines={1}>
              {farm.name}
            </Txt>
            <Txt variant="caption" color={Colors.textSecondary}>
              {farm.kind === 'outdoor' ? 'Outdoor' : 'Indoor'}
            </Txt>
          </View>
          <View style={styles.cells} onLayout={(e) => setCellsWidth(e.nativeEvent.layout.width)}>
            {rows.map((r) => {
              const isPicked = picked.has(r.key);
              const c = CELL[cellState(r, isPicked)];
              return (
                <Pressable
                  key={r.key}
                  accessibilityRole="button"
                  accessibilityLabel={`${farm.name} row ${r.row}: ${isPicked ? 'picked' : `${r.overdue} must pick, ${r.ready} ready`}`}
                  onPress={() => openRow(r)}
                  style={({ pressed }) => [
                    styles.cell,
                    { width: cellSize, height: cellSize, backgroundColor: c.bg },
                    pressed && styles.cellPressed,
                  ]}>
                  {isPicked ? (
                    <Check size={14} color={c.fg} strokeWidth={3} />
                  ) : (
                    <Txt variant="caption" weight={800} color={c.fg} tabular>
                      {r.ready || ''}
                    </Txt>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      <View style={styles.legend}>
        <LegendSwatch color={Colors.danger} label="Must pick" />
        <LegendSwatch color={Colors.accent} label="Ready" />
        <LegendSwatch color={Colors.successFg} label="Picked" />
        <LegendSwatch color={Colors.surfaceSunken} label="Not yet" outlined />
      </View>
      <Txt variant="caption" color={Colors.textSecondary}>
        Each square is one row; the number is pods ready. Tap a row to see what the camera found.
      </Txt>
    </View>
  );
}

/**
 * Bars from the flower countdown: flowers seen today become the coming days' pods.
 * @category Harvest
 */
export function UpcomingChart({
  days,
  height = 110,
  framed = true,
}: {
  days: { date: Date; pods: number }[];
  height?: number;
  /** Draw its own card; turn off when it already sits inside a panel. */
  framed?: boolean;
}) {
  const max = Math.max(...days.map((d) => d.pods), 1);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Pods expected: ${days.map((d, i) => `${i === 0 ? 'today' : shortDay(d.date)} ${d.pods}`).join(', ')}. Open Market to sell ahead.`}
      onPress={() => router.navigate('/market')}
      style={({ pressed }) => [framed ? styles.upcoming : styles.bare, pressed && { opacity: 0.85 }]}>
      <View style={styles.bars}>
        {days.map((d, i) => (
          <View key={i} style={styles.barCol}>
            <Txt variant="small" weight={800} tabular>
              {d.pods}
            </Txt>
            <View
              style={[
                styles.bar,
                { height: Math.max(6, Math.round((d.pods / max) * height)) },
                i > 0 && styles.barFuture,
              ]}
            />
            <Txt
              variant="caption"
              weight={i === 0 ? 800 : 600}
              color={i === 0 ? Colors.textPrimary : Colors.textSecondary}>
              {i === 0 ? 'Today' : shortDay(d.date)}
            </Txt>
          </View>
        ))}
      </View>
      <View style={styles.upcomingFoot}>
        <Txt variant="small" color={Colors.textBody} style={{ flex: 1 }}>
          Predicted from the flowers the camera saw open. Buyers can reserve these pods now.
        </Txt>
        <View style={styles.marketLink}>
          <Store size={14} color={Colors.textAccent} strokeWidth={2} />
          <Txt variant="small" weight={700} color={Colors.textAccent}>
            Market
          </Txt>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  map: { gap: 10 },
  mapRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mapName: { width: 84 },
  cells: { flex: 1, flexDirection: 'row', gap: CELL_GAP },
  cell: { borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cellPressed: { transform: [{ scale: 0.92 }] },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 4 },
  upcoming: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    boxShadow: Shadow.card,
    padding: 16,
    gap: 14,
  },
  bare: { gap: 14 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  bar: { width: '100%', maxWidth: 48, borderRadius: 8, backgroundColor: Colors.accent },
  barFuture: { backgroundColor: Palette.leaf300 },
  upcomingFoot: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  marketLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
