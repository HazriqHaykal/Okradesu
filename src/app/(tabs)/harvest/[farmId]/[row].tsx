import { router, useLocalSearchParams } from 'expo-router';
import { Check, ChevronLeft, ScanLine, Thermometer } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { DETECTION_STYLE, OkraFlower, RowSnapshot } from '@/components/illustrations';
import { LegendSwatch } from '@/components/forecast-chart';
import { MaturityBadge } from '@/components/maturity-badge';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { Button, IconButton } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, Divider } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, MaxContentWidth, Radius } from '@/constants/theme';
import { useDemo } from '@/data/demo';
import { getFarm } from '@/data/farms';
import {
  GDD_BASE_C,
  GDD_TO_PICK,
  ago,
  captureFor,
  flowerCountdown,
  getRow,
  rowKey,
  shortDay,
  type FlowerCohort,
} from '@/data/harvest';
import { harvestActions, pickedToday, useHarvestStore } from '@/state/harvest-store';

export default function RowDetailScreen() {
  const params = useLocalSearchParams<{ farmId: string; row: string }>();
  const farm = getFarm(params.farmId);
  const rowNo = Number(params.row) || 1;
  const { newPods } = useDemo();
  const det = getRow(farm.id, rowNo, newPods);
  const { width } = useWindowDimensions();
  const snapWidth = Math.min(width, MaxContentWidth) - 48;

  const batches = useHarvestStore((s) => s.batches);
  const allChecks = useHarvestStore((s) => s.checks);
  const pickedAt = useMemo(() => pickedToday(batches).get(rowKey(farm.id, rowNo)), [batches, farm.id, rowNo]);
  const checks = useMemo(
    () => allChecks.filter((c) => c.farmId === farm.id && c.row === rowNo),
    [allChecks, farm.id, rowNo],
  );
  const cohorts = useMemo(() => (det ? flowerCountdown(farm, det) : []), [farm, det]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/harvest'));

  if (!det) {
    return (
      <Screen>
        <IconButton icon={ChevronLeft} label="Back" onPress={goBack} />
        <Txt variant="body">This row has no camera results yet.</Txt>
      </Screen>
    );
  }

  const cap = captureFor(farm);
  const daysToPick = GDD_TO_PICK / Math.max(1, farm.meanTempC - GDD_BASE_C);

  return (
    <Screen>
      <View style={styles.head}>
        <IconButton icon={ChevronLeft} label="Back" onPress={goBack} />
        <View style={{ flex: 1, gap: 8 }}>
          <Txt variant="micro" color={Colors.textSecondary}>
            {farm.kind === 'outdoor' ? 'Outdoor' : 'Indoor'} · {farm.building}
          </Txt>
          <Txt variant="display" accessibilityRole="header">
            {farm.name} · Row {rowNo}
          </Txt>
        </View>
      </View>

      <Card style={styles.snapCard}>
        <View style={styles.snap}>
          <RowSnapshot det={det} kind={farm.kind} seed={rowNo} width={snapWidth} height={250} labels />
          <View style={styles.snapChip}>
            <Txt variant="caption" weight={700} color={Colors.surfaceCard}>
              {cap.label} · Edge AI
            </Txt>
          </View>
        </View>
        <View style={styles.legend}>
          {(Object.keys(DETECTION_STYLE) as (keyof typeof DETECTION_STYLE)[]).map((k) => (
            <LegendSwatch key={k} color={DETECTION_STYLE[k].color} label={DETECTION_STYLE[k].label} />
          ))}
        </View>
      </Card>

      <View style={styles.counts}>
        <Count label="Must pick" value={det.overdue} color={Colors.dangerFg} />
        <Count label="Ready" value={det.ready} color={Colors.textAccent} />
        <Count label="Too small" value={det.small} />
        <Count label="Overgrown" value={det.overgrown} color={Colors.warnFg} />
        <Count label="Flowers" value={det.flowers} color={Colors.successFg} />
      </View>

      {pickedAt ? (
        <View style={styles.done}>
          <Check size={18} color={Colors.successFg} strokeWidth={2.5} />
          <Txt variant="body" weight={700} color={Colors.successFg} style={{ flex: 1 }}>
            Picked {ago(pickedAt)}. The batch time is saved for freshness tracking.
          </Txt>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <Button
            label={`Mark row picked · ${det.ready} pods`}
            icon={Check}
            block
            onPress={() =>
              harvestActions.addBatch({
                farmId: farm.id,
                rows: [rowNo],
                podCount: det.ready,
                overgrownCount: det.overgrown,
              })
            }
          />
        </View>
      )}
      <Button
        label="Check a pod in this row"
        variant="secondary"
        icon={ScanLine}
        block
        href={{ pathname: '/pod-check', params: { farm: farm.id, row: String(rowNo) } }}
      />

      <SectionHeader title="Flower Countdown" />
      <View style={styles.model}>
        <Thermometer size={16} color={Colors.textAccent} strokeWidth={2} />
        <Txt variant="small" color={Colors.textBody} style={{ flex: 1 }}>
          {farm.meanTempC.toFixed(1)} °C average from the {farm.kind === 'outdoor' ? 'field' : 'room'} node,
          so pods reach picking size about {daysToPick.toFixed(1)} days after the flower opens.
        </Txt>
      </View>
      <Card style={styles.list}>
        {cohorts.map((c, i) => (
          <View key={c.openedOn.toISOString()}>
            {i > 0 ? <Divider /> : null}
            <CohortRow cohort={c} />
          </View>
        ))}
      </Card>

      {checks.length > 0 ? (
        <>
          <SectionHeader title="Phone Checks in This Row" />
          <Card style={styles.list}>
            {checks.map((c, i) => (
              <View key={c.id}>
                {i > 0 ? <Divider /> : null}
                <View style={styles.checkRow}>
                  <Txt variant="body" weight={800} tabular style={{ flex: 1 }}>
                    {c.lengthCm.toFixed(1)} cm · grade {c.grade}
                  </Txt>
                  <MaturityBadge maturity={c.maturity} />
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function CohortRow({ cohort: c }: { cohort: FlowerCohort }) {
  const total = Math.max(1, Math.round((c.readyFrom.getTime() - c.openedOn.getTime()) / 86400000));
  const elapsed = Math.min(total, total - Math.max(0, c.daysToReady));
  const badge =
    c.status === 'late' ? (
      <Badge label="Past window" tone="danger" />
    ) : c.status === 'ready' ? (
      <Badge label="Pick now" tone="solid" />
    ) : (
      <Badge label={c.daysToReady === 1 ? 'Tomorrow' : `In ${c.daysToReady} days`} tone="neutral" />
    );
  return (
    <View style={styles.cohort}>
      <OkraFlower size={28} />
      <View style={{ flex: 1, gap: 4 }}>
        <Txt variant="body" weight={800}>
          {shortDay(c.openedOn)} · {c.count} {c.count === 1 ? 'flower' : 'flowers'}
        </Txt>
        <Txt variant="small" color={Colors.textSecondary}>
          Ready {shortDay(c.readyFrom)}
          {c.readyTo.getTime() !== c.readyFrom.getTime() ? ` – ${shortDay(c.readyTo)}` : ''}
        </Txt>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: `${(elapsed / total) * 100}%`,
                backgroundColor:
                  c.status === 'late' ? Colors.danger : c.status === 'ready' ? Colors.accent : Colors.success,
              },
            ]}
          />
        </View>
      </View>
      {badge}
    </View>
  );
}

function Count({
  label,
  value,
  color = Colors.textPrimary,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <View style={styles.count}>
      <Txt variant="micro" color={Colors.textSecondary}>
        {label}
      </Txt>
      <Txt variant="title" color={color} tabular>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  snapCard: { overflow: 'hidden' },
  snap: { borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, overflow: 'hidden' },
  snapChip: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    paddingHorizontal: 10,
    height: 24,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(30, 26, 22, 0.72)',
    justifyContent: 'center',
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 14 },
  counts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  count: {
    flexGrow: 1,
    flexBasis: '30%',
    padding: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceCard,
    gap: 2,
  },
  done: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.successBg,
  },
  model: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  list: { paddingHorizontal: 16, paddingVertical: 4 },
  cohort: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  track: { height: 6, borderRadius: Radius.pill, backgroundColor: Colors.surfaceSunken, overflow: 'hidden' },
  fill: { height: 6, borderRadius: Radius.pill },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
});
