import { router, useLocalSearchParams } from 'expo-router';
import { Check, Minus, Plus, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeroBackground } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { Button, IconButton } from '@/components/ui/button';
import { Meter } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, MaxContentWidth, Palette, Radius, Shadow } from '@/constants/theme';
import { useDemo } from '@/data/demo';
import { getFarm, type FarmKind } from '@/data/farms';
import { harvestPlan, rowsLabel, type PlanRow } from '@/data/harvest';
import { harvestActions, pickedToday, useHarvestStore, type HarvestBatch } from '@/state/harvest-store';

type Entry = { done: boolean; count: number };

/** Guided picking: rows in urgency order, big targets for one-handed use. */
export default function PickingScreen() {
  const params = useLocalSearchParams<{ kind?: string; farm?: string }>();
  const insets = useSafeAreaInsets();
  const batches = useHarvestStore((s) => s.batches);
  const { newPods } = useDemo();
  const rows = useMemo(() => {
    const picked = pickedToday(batches);
    return harvestPlan(
      {
        kind: (params.kind || undefined) as FarmKind | undefined,
        farmId: params.farm || undefined,
      },
      newPods,
    ).filter((r) => !picked.has(r.key));
    // The route is fixed once picking starts; later batches shouldn't reshuffle it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.kind, params.farm]);

  const [entries, setEntries] = useState<Record<string, Entry>>(() =>
    Object.fromEntries(rows.map((r) => [r.key, { done: false, count: r.ready }])),
  );
  const [saved, setSaved] = useState<HarvestBatch[] | null>(null);

  const doneRows = rows.filter((r) => entries[r.key]?.done);
  const pods = doneRows.reduce((n, r) => n + (entries[r.key]?.count ?? 0), 0);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/harvest'));

  const update = (key: string, patch: Partial<Entry>) =>
    setEntries((e) => ({ ...e, [key]: { ...e[key], ...patch } }));

  const save = () => {
    const byFarm = new Map<string, PlanRow[]>();
    for (const r of doneRows) byFarm.set(r.farm.id, [...(byFarm.get(r.farm.id) ?? []), r]);
    const created = [...byFarm.entries()].map(([farmId, list]) =>
      harvestActions.addBatch({
        farmId,
        rows: list.map((r) => r.row).sort((a, b) => a - b),
        podCount: list.reduce((n, r) => n + entries[r.key].count, 0),
        overgrownCount: list.reduce((n, r) => n + r.overgrown, 0),
      }),
    );
    setSaved(created);
  };

  return (
    <View style={styles.root}>
      <HeroBackground />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <IconButton icon={X} label="Close picking" onPress={close} />
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="micro" color={Colors.textSecondary}>
            {saved ? 'Batch saved' : `${doneRows.length} of ${rows.length} rows · ${pods} pods`}
          </Txt>
          <Txt variant="displaySm" accessibilityRole="header">
            Picking
          </Txt>
        </View>
      </View>
      {!saved ? (
        <View style={styles.progress}>
          <Meter value={rows.length ? (doneRows.length / rows.length) * 100 : 0} color={Colors.accent} />
        </View>
      ) : null}

      {saved ? (
        <View style={[styles.body, styles.savedBody]}>
          <View style={styles.savedIcon}>
            <Check size={36} color={Colors.successFg} strokeWidth={2.5} />
          </View>
          <Txt variant="display" align="center">
            {saved.reduce((n, b) => n + b.podCount, 0)} pods picked
          </Txt>
          <Txt variant="body" color={Colors.textSecondary} align="center">
            {saved.length} {saved.length === 1 ? 'batch' : 'batches'} saved at{' '}
            {saved[0]?.pickedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. We&apos;ll
            flag them if they aren&apos;t delivered within 24 hours.
          </Txt>
          {saved.map((b) => (
            <Badge key={b.id} label={`${getFarm(b.farmId).name} · ${rowsLabel(b.rows)}`} tone="success" />
          ))}
          <Button label="Back to harvest map" block onPress={close} style={{ marginTop: 12 }} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={[styles.body, { paddingBottom: 140 + insets.bottom }]}>
            {rows.length === 0 ? (
              <Txt variant="body" color={Colors.textSecondary}>
                Every row on today&apos;s map is already picked.
              </Txt>
            ) : null}
            {rows.map((r, i) => {
              const e = entries[r.key];
              return (
                <View key={r.key} style={[styles.card, e.done && styles.cardDone]}>
                  <View style={styles.cardHead}>
                    <Txt variant="caption" weight={800} color={Colors.textSecondary} tabular>
                      {i + 1}
                    </Txt>
                    <Txt variant="heading" style={{ flex: 1 }}>
                      {r.farm.name} · Row {r.row}
                    </Txt>
                    {r.overdue > 0 ? <Badge label={`${r.overdue} must`} tone="danger" /> : null}
                  </View>
                  {r.overgrown > 0 ? (
                    <Txt variant="small" color={Palette.orange800}>
                      Also take {r.overgrown} overgrown {r.overgrown === 1 ? 'pod' : 'pods'} for the processor
                      bin.
                    </Txt>
                  ) : null}
                  <View style={styles.controls}>
                    <View style={styles.stepper}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Fewer pods for ${r.farm.name} row ${r.row}`}
                        onPress={() => update(r.key, { count: Math.max(0, e.count - 1) })}
                        style={styles.stepBtn}>
                        <Minus size={20} color={Colors.textPrimary} strokeWidth={2.5} />
                      </Pressable>
                      <View style={styles.stepValue}>
                        <Txt variant="title" tabular>
                          {e.count}
                        </Txt>
                        <Txt variant="micro" color={Colors.textSecondary}>
                          pods
                        </Txt>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`More pods for ${r.farm.name} row ${r.row}`}
                        onPress={() => update(r.key, { count: e.count + 1 })}
                        style={styles.stepBtn}>
                        <Plus size={20} color={Colors.textPrimary} strokeWidth={2.5} />
                      </Pressable>
                    </View>
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: e.done }}
                      accessibilityLabel={`${r.farm.name} row ${r.row} picked`}
                      onPress={() => update(r.key, { done: !e.done })}
                      style={({ pressed }) => [
                        styles.pickBtn,
                        e.done ? styles.pickBtnDone : styles.pickBtnTodo,
                        pressed && { transform: [{ scale: 0.97 }] },
                      ]}>
                      <Check
                        size={20}
                        color={e.done ? Colors.surfaceCard : Colors.textPrimary}
                        strokeWidth={2.5}
                      />
                      <Txt
                        variant="body"
                        weight={800}
                        color={e.done ? Colors.surfaceCard : Colors.textPrimary}>
                        {e.done ? 'Picked' : 'Mark picked'}
                      </Txt>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.footerInner}>
              <Button
                label={doneRows.length ? `Save batch · ${pods} pods` : 'Mark rows as you pick'}
                icon={Check}
                block
                disabled={!doneRows.length}
                onPress={save}
              />
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgApp },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  progress: {
    paddingHorizontal: 24,
    paddingTop: 14,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  body: { padding: 24, gap: 12, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  savedBody: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  savedIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 10,
    boxShadow: Shadow.card,
  },
  cardDone: { opacity: 0.65 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceSunken,
    padding: 4,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { minWidth: 52, alignItems: 'center' },
  pickBtn: {
    flex: 1,
    height: 56,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pickBtnTodo: { backgroundColor: Colors.accent, boxShadow: Shadow.glow },
  pickBtnDone: { backgroundColor: Colors.successFg },
  footerInner: { width: '100%', maxWidth: MaxContentWidth - 48 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: Colors.bgApp,
    boxShadow: Shadow.float,
    alignItems: 'center',
  },
});
