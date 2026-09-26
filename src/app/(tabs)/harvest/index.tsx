import { router } from 'expo-router';
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ListChecks,
  ScanLine,
  Store,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LegendSwatch } from '@/components/forecast-chart';
import { RowSnapshot } from '@/components/illustrations';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { Button, IconButton } from '@/components/ui/button';
import { ScreenTitle, SectionHeader } from '@/components/ui/section-header';
import { Card } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Palette, Radius, Shadow } from '@/constants/theme';
import { getFarm } from '@/data/farms';
import { ago, planTotals, rowsLabel, shortDay, type PlanRow } from '@/data/harvest';
import { useHarvest } from '@/hooks/use-harvest';
import { DELIVER_FIRST_HOURS, pickedToday, useHarvestStore } from '@/state/harvest-store';

/** How many rows "Pick in this order" shows. */
const TOP_ROWS = 3;
const CELL_GAP = 6;

const openRow = (r: PlanRow) =>
  router.push({ pathname: '/harvest/[farmId]/[row]', params: { farmId: r.farm.id, row: String(r.row) } });

type Cell = { bg: string; fg: string };
const CELL: Record<'picked' | 'must' | 'ready' | 'processor' | 'none', Cell> = {
  picked: { bg: Colors.successFg, fg: Colors.surfaceCard },
  must: { bg: Colors.danger, fg: Colors.surfaceCard },
  ready: { bg: Colors.accent, fg: Colors.textOnAccent },
  processor: { bg: Palette.orange800, fg: Colors.surfaceCard },
  none: { bg: Colors.surfaceSunken, fg: Colors.textSecondary },
};

function cellState(r: PlanRow, picked: boolean): keyof typeof CELL {
  if (picked) return 'picked';
  if (r.overdue > 0) return 'must';
  if (r.ready > 0) return 'ready';
  if (r.overgrown > 0) return 'processor';
  return 'none';
}

export default function HarvestMapScreen() {
  const { grid, plan, upcoming } = useHarvest();
  const batches = useHarvestStore((s) => s.batches);
  const picked = useMemo(() => pickedToday(batches), [batches]);
  const remaining = plan.filter((r) => !picked.has(r.key));
  const totals = planTotals(remaining);
  const next = remaining.slice(0, TOP_ROWS);
  // Size the squares so the farm with the most rows still fits on one line.
  const [cellsWidth, setCellsWidth] = useState(0);
  const maxRows = Math.max(...grid.map((g) => g.rows.length), 1);
  const cellSize = cellsWidth
    ? Math.min(36, Math.floor((cellsWidth - CELL_GAP * (maxRows - 1)) / maxRows))
    : 28;

  return (
    <Screen>
      <ScreenTitle
        kicker="Saturday 26 September"
        title="Harvest map"
        right={
          <IconButton
            icon={ScanLine}
            label="Check a pod with the camera"
            href="/pod-check"
            variant="accent"
            size={48}
          />
        }
      />

      <View style={styles.stats}>
        <Stat label="Must pick" value={totals.must} bg={Colors.danger} fg={Colors.surfaceCard} />
        <Stat label="Ready" value={totals.ready} bg={Colors.accent} />
        <Stat label="Rows left" value={remaining.length} bg={Colors.surfaceCard} />
      </View>

      {/* The map: one square per growing row */}
      <Card style={styles.map}>
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
      </Card>

      {/* What to do now */}
      <SectionHeader title="Pick in This Order" />
      {next.length === 0 ? (
        <View style={styles.done}>
          <Check size={18} color={Colors.successFg} strokeWidth={2.5} />
          <Txt variant="body" weight={700} color={Colors.successFg} style={{ flex: 1 }}>
            Everything on today&apos;s map is picked.
          </Txt>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {next.map((r, i) => (
            <NextRow key={r.key} rank={i + 1} row={r} />
          ))}
        </View>
      )}
      <Button
        label={remaining.length ? `Start picking · ${remaining.length} rows` : 'All picked'}
        icon={ListChecks}
        block
        disabled={!remaining.length}
        href="/picking"
      />

      {/* Flower countdown → forecast */}
      <SectionHeader title="Coming Up" />
      <UpcomingChart days={upcoming} />

      <PickedBatches />
    </Screen>
  );
}

function NextRow({ rank, row }: { rank: number; row: PlanRow }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${rank}. ${row.farm.name} row ${row.row}: ${row.overdue} must pick, ${row.ready} ready`}
      onPress={() => openRow(row)}
      style={({ pressed }) => [styles.nextRow, pressed && styles.nextPressed]}>
      <View style={styles.thumb}>
        <RowSnapshot det={row} kind={row.farm.kind} seed={rank} width={56} height={64} />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <Txt variant="bodyLg" weight={800} numberOfLines={1}>
          {rank}. {row.farm.name} · Row {row.row}
        </Txt>
        <View style={styles.badges}>
          {row.overdue > 0 ? <Badge label={`${row.overdue} must`} tone="danger" /> : null}
          <Badge label={`${row.ready} ready`} tone="solid" />
        </View>
      </View>
      <ChevronRight size={18} color={Colors.textSecondary} strokeWidth={2} />
    </Pressable>
  );
}

/** Bars from the flower countdown: flowers seen today become the coming days' pods. */
function UpcomingChart({ days }: { days: { date: Date; pods: number }[] }) {
  const max = Math.max(...days.map((d) => d.pods), 1);
  const H = 110;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Pods expected: ${days.map((d, i) => `${i === 0 ? 'today' : shortDay(d.date)} ${d.pods}`).join(', ')}. Open Market to sell ahead.`}
      onPress={() => router.navigate('/market')}
      style={({ pressed }) => [styles.upcoming, pressed && { opacity: 0.85 }]}>
      <View style={styles.bars}>
        {days.map((d, i) => (
          <View key={i} style={styles.barCol}>
            <Txt variant="small" weight={800} tabular>
              {d.pods}
            </Txt>
            <View
              style={[
                styles.bar,
                { height: Math.max(6, Math.round((d.pods / max) * H)) },
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

/** Freshness: picked batches, flagged when they wait more than a day. */
function PickedBatches() {
  const batches = useHarvestStore((s) => s.batches);
  const [open, setOpen] = useState(false);
  const [now] = useState(() => new Date());
  if (!batches.length) return null;
  const isLate = (at: Date) => (now.getTime() - at.getTime()) / 3600000 >= DELIVER_FIRST_HOURS;
  const late = batches.filter((b) => isLate(b.pickedAt)).length;
  const pods = batches.reduce((n, b) => n + b.podCount, 0);

  return (
    <Card style={styles.batches}>
      <Pressable
        accessibilityRole="button"
        aria-expanded={open}
        onPress={() => setOpen((o) => !o)}
        style={styles.batchHead}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="body" weight={800}>
            {batches.length} {batches.length === 1 ? 'batch' : 'batches'} waiting for delivery
          </Txt>
          <Txt variant="small" color={late ? Colors.dangerFg : Colors.textSecondary}>
            {pods} pods{late ? ` · ${late} over ${DELIVER_FIRST_HOURS} h, deliver first` : ''}
          </Txt>
        </View>
        {open ? (
          <ChevronUp size={20} color={Colors.textSecondary} strokeWidth={2} />
        ) : (
          <ChevronDown size={20} color={Colors.textSecondary} strokeWidth={2} />
        )}
      </Pressable>
      {open
        ? batches.map((b) => (
            <View key={b.id} style={styles.batchRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="small" weight={800}>
                  {getFarm(b.farmId).name} · {rowsLabel(b.rows)}
                </Txt>
                <Txt variant="caption" color={Colors.textSecondary}>
                  {b.podCount} pods · picked {ago(b.pickedAt, now)}
                </Txt>
              </View>
              {isLate(b.pickedAt) ? (
                <Badge label="Deliver first" tone="danger" />
              ) : (
                <Badge label="Fresh" tone="success" />
              )}
            </View>
          ))
        : null}
    </Card>
  );
}

function Stat({
  label,
  value,
  bg,
  fg = Colors.textPrimary,
}: {
  label: string;
  value: number;
  bg: string;
  fg?: string;
}) {
  return (
    <View style={[styles.stat, { backgroundColor: bg }]}>
      <Txt variant="micro" color={fg}>
        {label}
      </Txt>
      <Txt variant="title" color={fg} tabular style={{ fontSize: 28, lineHeight: 34 }}>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, padding: 12, borderRadius: Radius.md, gap: 2, boxShadow: Shadow.tile },
  map: { padding: 14, gap: 10 },
  mapRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mapName: { width: 84 },
  cells: { flex: 1, flexDirection: 'row', gap: CELL_GAP },
  cell: { borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cellPressed: { transform: [{ scale: 0.92 }] },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 4 },
  done: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.successBg,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    paddingRight: 12,
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    boxShadow: Shadow.card,
  },
  nextPressed: { boxShadow: Shadow.float, transform: [{ translateY: -2 }] },
  thumb: { width: 56, height: 64, borderRadius: Radius.sm, overflow: 'hidden' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  upcoming: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    boxShadow: Shadow.card,
    padding: 16,
    gap: 14,
  },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  bar: { width: '100%', maxWidth: 48, borderRadius: 8, backgroundColor: Colors.accent },
  barFuture: { backgroundColor: Palette.orange300 },
  upcomingFoot: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  marketLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  batches: { paddingHorizontal: 16 },
  batchHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  batchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
});
