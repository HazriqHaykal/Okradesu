import { router, useLocalSearchParams } from 'expo-router';
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Factory,
  ListChecks,
  ScanLine,
  Sun,
  Warehouse,
} from 'lucide-react-native';
import { Fragment, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { OkraPod, RowSnapshot } from '@/components/illustrations';
import { MaturityBadge } from '@/components/maturity-badge';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { Button, IconButton } from '@/components/ui/button';
import { ScreenTitle, SectionHeader } from '@/components/ui/section-header';
import { Segmented } from '@/components/ui/segmented';
import { Card, Divider, IconWell } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Palette, Radius, Shadow } from '@/constants/theme';
import { FARMS, getFarm, type Farm, type FarmKind } from '@/data/farms';
import {
  CAPTURE,
  ago,
  captureFor,
  harvestPlan,
  planTotals,
  rowsLabel,
  type PlanRow,
  type Urgency,
} from '@/data/harvest';
import { DELIVER_FIRST_HOURS, pickedToday, useHarvestStore } from '@/state/harvest-store';

type HarvestView = 'next' | 'farms' | 'batches';
type Params = { kind?: FarmKind; farm?: string; view?: HarvestView };

/** Rows shown in "Next up" before the list is expanded. */
const NEXT_UP_LIMIT = 5;

const URGENCY_HEADING: Record<Urgency, string> = {
  must: 'Must pick today',
  ready: 'Ready',
  processor: 'Overgrown only',
};

const openRow = (r: PlanRow) =>
  router.push({ pathname: '/harvest/[farmId]/[row]', params: { farmId: r.farm.id, row: String(r.row) } });

export default function HarvestMapScreen() {
  const params = useLocalSearchParams<Params>();
  const view: HarvestView = params.view ?? (params.farm ? 'farms' : 'next');
  const kind = params.kind;

  const plan = useMemo(() => harvestPlan({ kind }), [kind]);
  const totals = planTotals(plan);
  const batches = useHarvestStore((s) => s.batches);
  const picked = useMemo(() => pickedToday(batches), [batches]);
  const [now] = useState(() => new Date());

  // Unpicked rows keep their urgency order; picked ones sink to the end.
  const ordered = useMemo(
    () => [...plan.filter((r) => !picked.has(r.key)), ...plan.filter((r) => picked.has(r.key))],
    [plan, picked],
  );
  const remaining = ordered.filter((r) => !picked.has(r.key));
  const farms = FARMS.filter((f) => !kind || f.kind === kind);

  const setView = (v: HarvestView) => router.setParams({ view: v });
  const setKind = (k?: FarmKind) => router.setParams({ kind: k });

  return (
    <Screen>
      <ScreenTitle kicker={`Sat 26 Sep · ${farms.length} farms`} title="Harvest map" />

      <View style={styles.stats}>
        <Stat label="Must pick" value={totals.must} bg={Colors.danger} fg={Colors.surfaceCard} />
        <Stat label="Ready" value={totals.ready} bg={Colors.accent} />
        <Stat label="Flowers" value={totals.flowers} bg={Colors.surfaceCard} />
      </View>

      <View style={styles.actions}>
        <Button
          label={remaining.length ? `Start picking · ${remaining.length}` : 'All picked'}
          icon={ListChecks}
          disabled={!remaining.length}
          style={{ flex: 1, alignSelf: 'auto' }}
          href={{ pathname: '/picking', params: kind ? { kind } : {} }}
        />
        <IconButton icon={ScanLine} label="Check a pod with the camera" href="/pod-check" size={52} />
      </View>

      <Segmented
        label="Harvest views"
        value={view}
        onChange={setView}
        segments={[
          { value: 'next', label: 'Next up', count: remaining.length },
          { value: 'farms', label: 'By farm', count: farms.length },
          { value: 'batches', label: 'Batches', count: batches.length },
        ]}
      />

      {view !== 'batches' ? (
        <View style={styles.chips}>
          <Chip label="All" on={!kind} onPress={() => setKind(undefined)} />
          <Chip label="Outdoor" icon={Sun} on={kind === 'outdoor'} onPress={() => setKind('outdoor')} />
          <Chip label="Indoor" icon={Warehouse} on={kind === 'indoor'} onPress={() => setKind('indoor')} />
        </View>
      ) : null}

      {view === 'next' ? (
        <NextUp rows={ordered} picked={picked} overgrown={totals.overgrown} kind={kind} />
      ) : null}
      {view === 'farms' ? <ByFarm farms={farms} plan={plan} picked={picked} focusFarm={params.farm} /> : null}
      {view === 'batches' ? <Batches now={now} /> : null}
    </Screen>
  );
}

// ── Next up ────────────────────────────────────────────────────────
function NextUp({
  rows,
  picked,
  overgrown,
  kind,
}: {
  rows: PlanRow[];
  picked: Map<string, Date>;
  overgrown: number;
  kind?: FarmKind;
}) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? rows : rows.slice(0, NEXT_UP_LIMIT);
  const allPicked = rows.length > 0 && rows.every((r) => picked.has(r.key));

  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 4 }}>
        {kind !== 'indoor' ? (
          <InfoLine
            icon={Sun}
            text={`Outdoor · ${CAPTURE.outdoor.label.toLowerCase()}, ${CAPTURE.outdoor.detail}`}
          />
        ) : null}
        {kind !== 'outdoor' ? (
          <InfoLine icon={Warehouse} text={`Indoor · ${CAPTURE.indoor.label.toLowerCase()}, LEDs at full`} />
        ) : null}
      </View>

      {allPicked ? (
        <View style={styles.done}>
          <Check size={18} color={Colors.successFg} strokeWidth={2.5} />
          <Txt variant="body" weight={700} color={Colors.successFg} style={{ flex: 1 }}>
            Everything on today&apos;s map is picked. See the Batches tab for delivery.
          </Txt>
        </View>
      ) : null}

      {shown.map((r, i) => {
        const pickedAt = picked.get(r.key);
        const prev = shown[i - 1];
        const groupKey = pickedAt ? 'picked' : r.urgency;
        const prevKey = prev ? (picked.has(prev.key) ? 'picked' : prev.urgency) : null;
        const count = rows.filter((x) => (picked.has(x.key) ? 'picked' : x.urgency) === groupKey).length;
        return (
          <Fragment key={r.key}>
            {groupKey !== prevKey ? (
              <View style={styles.groupHead}>
                <Txt variant="micro" color={groupKey === 'must' ? Colors.dangerFg : Colors.textSecondary}>
                  {groupKey === 'picked' ? 'Picked today' : URGENCY_HEADING[r.urgency]}
                </Txt>
                <Txt variant="micro" color={Colors.textSecondary} tabular>
                  {count} {count === 1 ? 'row' : 'rows'}
                </Txt>
              </View>
            ) : null}
            <PlanRowCard rank={i + 1} row={r} pickedAt={pickedAt} />
          </Fragment>
        );
      })}

      {rows.length > NEXT_UP_LIMIT ? (
        <Button
          label={showAll ? 'Show fewer' : `Show all ${rows.length} rows`}
          variant="ghost"
          size="md"
          icon={showAll ? ChevronUp : ChevronDown}
          block
          onPress={() => setShowAll((s) => !s)}
        />
      ) : null}

      {overgrown > 0 ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.navigate('/market')}
          style={({ pressed }) => [styles.processor, pressed && { opacity: 0.85 }]}>
          <OkraPod width={56} tone="overgrown" />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="body" weight={800} color={Palette.orange800}>
              {overgrown} overgrown pods → processor
            </Txt>
            <Txt variant="small" color={Palette.orange800}>
              Too tough to sell fresh. Kawabe Pickles takes them.
            </Txt>
          </View>
          <Factory size={20} color={Palette.orange800} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}

function PlanRowCard({ rank, row, pickedAt }: { rank: number; row: PlanRow; pickedAt?: Date }) {
  const done = !!pickedAt;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${row.farm.name} row ${row.row}: ${row.overdue} must pick, ${row.ready} ready, ${row.overgrown} overgrown`}
      onPress={() => openRow(row)}
      style={({ pressed }) => [styles.rowCard, done && styles.rowDone, pressed && styles.rowPressed]}>
      <View style={styles.thumb}>
        <RowSnapshot det={row} kind={row.farm.kind} seed={rank} width={76} height={92} />
        {!done ? (
          <View style={styles.rank}>
            <Txt variant="caption" weight={800} color={Colors.surfaceCard} tabular>
              {rank}
            </Txt>
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.rowTitle}>
          <Txt variant="bodyLg" weight={800} style={{ flexShrink: 1 }} numberOfLines={1}>
            {row.farm.name} · Row {row.row}
          </Txt>
          {row.farm.kind === 'outdoor' ? (
            <Sun size={14} color={Colors.textAccent} strokeWidth={2} />
          ) : (
            <Warehouse size={14} color={Colors.textAccent} strokeWidth={2} />
          )}
        </View>
        <RowBadges row={row} pickedAt={pickedAt} />
        <Txt variant="caption" color={Colors.textSecondary}>
          ~{row.minutes} min · ≈{row.grams} g · {captureFor(row.farm).label}
        </Txt>
      </View>
      <ChevronRight size={18} color={Colors.textSecondary} strokeWidth={2} style={{ alignSelf: 'center' }} />
    </Pressable>
  );
}

function RowBadges({ row, pickedAt }: { row: PlanRow; pickedAt?: Date }) {
  if (pickedAt) {
    return (
      <View style={styles.badges}>
        <Badge
          label={`Picked ${pickedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          tone="success"
          icon={Check}
        />
      </View>
    );
  }
  return (
    <View style={styles.badges}>
      {row.overdue > 0 ? <Badge label={`${row.overdue} must`} tone="danger" /> : null}
      {row.ready > 0 ? <Badge label={`${row.ready} ready`} tone="solid" /> : null}
      {row.overgrown > 0 ? <Badge label={`${row.overgrown} overgrown`} tone="accent" /> : null}
    </View>
  );
}

// ── By farm ────────────────────────────────────────────────────────
function ByFarm({
  farms,
  plan,
  picked,
  focusFarm,
}: {
  farms: Farm[];
  plan: PlanRow[];
  picked: Map<string, Date>;
  focusFarm?: string;
}) {
  // Farms sorted by how much must be picked, so the busiest one is on top.
  const groups = useMemo(
    () =>
      farms
        .map((farm) => {
          const rows = plan.filter((r) => r.farm.id === farm.id);
          return { farm, rows, totals: planTotals(rows.filter((r) => !picked.has(r.key))) };
        })
        .sort((a, b) => b.totals.must - a.totals.must || b.totals.ready - a.totals.ready),
    [farms, plan, picked],
  );
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const defaultOpen = focusFarm ?? groups[0]?.farm.id;
  const isOpen = (id: string) => toggled[id] ?? id === defaultOpen;

  return (
    <View style={{ gap: 10 }}>
      {groups.map(({ farm, rows, totals }) => {
        const open = isOpen(farm.id);
        const pickedCount = rows.filter((r) => picked.has(r.key)).length;
        return (
          <Card key={farm.id} style={styles.farmCard}>
            <Pressable
              accessibilityRole="button"
              aria-expanded={open}
              accessibilityLabel={`${farm.name}: ${totals.must} must pick, ${totals.ready} ready`}
              onPress={() => setToggled((t) => ({ ...t, [farm.id]: !open }))}
              style={({ pressed }) => [styles.farmHead, pressed && { opacity: 0.8 }]}>
              <IconWell icon={farm.icon} size={44} />
              <View style={{ flex: 1, gap: 4 }}>
                <View style={styles.rowTitle}>
                  <Txt variant="bodyLg" weight={800}>
                    {farm.name}
                  </Txt>
                  <Badge label={farm.kind === 'outdoor' ? 'Outdoor' : 'Indoor'} tone="neutral" />
                </View>
                <Txt variant="small" color={Colors.textSecondary} tabular>
                  {totals.must > 0 ? `${totals.must} must · ` : ''}
                  {totals.ready} ready
                  {totals.overgrown > 0 ? ` · ${totals.overgrown} overgrown` : ''}
                  {pickedCount > 0 ? ` · ${pickedCount}/${rows.length} rows picked` : ''}
                </Txt>
              </View>
              {open ? (
                <ChevronUp size={20} color={Colors.textSecondary} strokeWidth={2} />
              ) : (
                <ChevronDown size={20} color={Colors.textSecondary} strokeWidth={2} />
              )}
            </Pressable>

            {open ? (
              <View>
                {rows.length === 0 ? (
                  <Txt variant="small" color={Colors.textSecondary} style={{ paddingVertical: 12 }}>
                    Nothing to pick here today.
                  </Txt>
                ) : (
                  rows.map((r) => {
                    const pickedAt = picked.get(r.key);
                    return (
                      <Fragment key={r.key}>
                        <Divider />
                        <Pressable
                          accessibilityRole="link"
                          accessibilityLabel={`Row ${r.row}: ${r.overdue} must pick, ${r.ready} ready`}
                          onPress={() => openRow(r)}
                          style={({ pressed }) => [
                            styles.compactRow,
                            pickedAt && styles.rowDone,
                            pressed && { opacity: 0.7 },
                          ]}>
                          <Txt variant="body" weight={800} style={styles.rowNo} tabular>
                            Row {r.row}
                          </Txt>
                          <View style={{ flex: 1 }}>
                            <RowBadges row={r} pickedAt={pickedAt} />
                          </View>
                          <ChevronRight size={18} color={Colors.textSecondary} strokeWidth={2} />
                        </Pressable>
                      </Fragment>
                    );
                  })
                )}
                {totals.ready > 0 ? (
                  <Button
                    label={`Pick ${farm.name}`}
                    size="sm"
                    icon={ListChecks}
                    href={{ pathname: '/picking', params: { farm: farm.id } }}
                    style={{ marginTop: 10, marginBottom: 14 }}
                  />
                ) : null}
              </View>
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}

// ── Batches ────────────────────────────────────────────────────────
function Batches({ now }: { now: Date }) {
  const batches = useHarvestStore((s) => s.batches);
  const checks = useHarvestStore((s) => s.checks);
  return (
    <View style={{ gap: 16 }}>
      <SectionHeader title="Picked Batches" />
      <Card style={styles.list}>
        {batches.map((b, i) => {
          const old = (now.getTime() - b.pickedAt.getTime()) / 3600000 >= DELIVER_FIRST_HOURS;
          return (
            <View key={b.id} style={[styles.listRow, i > 0 && styles.listDivider]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="body" weight={800}>
                  {getFarm(b.farmId).name} · {rowsLabel(b.rows)}
                </Txt>
                <Txt variant="small" color={Colors.textSecondary}>
                  {b.podCount} pods{b.overgrownCount ? ` + ${b.overgrownCount} overgrown` : ''} · picked{' '}
                  {ago(b.pickedAt, now)}
                </Txt>
              </View>
              {old ? <Badge label="Deliver first" tone="danger" /> : <Badge label="Fresh" tone="success" />}
            </View>
          );
        })}
      </Card>

      <SectionHeader title="Phone Checks" />
      {checks.length === 0 ? (
        <View style={styles.empty}>
          <OkraPod width={72} />
          <Txt variant="small" color={Colors.textSecondary} style={{ flex: 1 }}>
            No pods checked yet. Tap the camera button to measure one against a ¥100 coin.
          </Txt>
        </View>
      ) : (
        <Card style={styles.list}>
          {checks.map((c, i) => (
            <View key={c.id} style={[styles.listRow, i > 0 && styles.listDivider]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="body" weight={800} tabular>
                  {c.lengthCm.toFixed(1)} cm · grade {c.grade}
                </Txt>
                <Txt variant="small" color={Colors.textSecondary}>
                  {c.farmId ? `${getFarm(c.farmId).name}${c.row ? ` · Row ${c.row}` : ''} · ` : ''}
                  {ago(c.at, now)}
                  {c.simulated ? ' · demo result' : ''}
                </Txt>
              </View>
              <MaturityBadge maturity={c.maturity} />
            </View>
          ))}
        </Card>
      )}
    </View>
  );
}

// ── Small pieces ───────────────────────────────────────────────────
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
      <Txt variant="title" color={fg} tabular style={{ fontSize: 26, lineHeight: 32 }}>
        {value}
      </Txt>
    </View>
  );
}

function Chip({
  label,
  on,
  onPress,
  icon: Icon,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  icon?: typeof Sun;
}) {
  const color = on ? Colors.textOnAccent : Colors.textPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.chip, on && styles.chipOn]}>
      {Icon ? <Icon size={14} color={color} strokeWidth={2} /> : null}
      <Txt variant="small" weight={700} color={color}>
        {label}
      </Txt>
    </Pressable>
  );
}

function InfoLine({ icon: Icon, text }: { icon: typeof Clock; text: string }) {
  return (
    <View style={styles.infoLine}>
      <Icon size={13} color={Colors.textSecondary} strokeWidth={2} />
      <Txt variant="caption" weight={600} color={Colors.textSecondary} style={{ flex: 1 }}>
        {text}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, padding: 12, borderRadius: Radius.md, gap: 4, boxShadow: Shadow.tile },
  actions: { flexDirection: 'row', gap: 10 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceCard,
    boxShadow: Shadow.tile,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipOn: { backgroundColor: Colors.accent, boxShadow: Shadow.glow },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  rowCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 8,
    paddingRight: 12,
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    boxShadow: Shadow.card,
  },
  rowDone: { opacity: 0.55 },
  rowPressed: { boxShadow: Shadow.float, transform: [{ translateY: -2 }] },
  thumb: { width: 76, height: 92, borderRadius: Radius.md, overflow: 'hidden' },
  rank: {
    position: 'absolute',
    top: 6,
    left: 6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: Colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  processor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: Palette.orange200,
  },
  done: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.successBg,
  },
  farmCard: { paddingHorizontal: 14 },
  farmHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, alignSelf: 'stretch' },
  rowNo: { width: 56 },
  list: { paddingHorizontal: 16, paddingVertical: 4 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  listDivider: { borderTopWidth: 1, borderTopColor: Colors.borderSubtle },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceCard,
  },
});
