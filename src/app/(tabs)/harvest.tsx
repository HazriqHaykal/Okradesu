import { router, useLocalSearchParams } from 'expo-router';
import { Camera, Check, Clock } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { LegendSwatch } from '@/components/forecast-chart';
import { Screen } from '@/components/screen';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button, IconButton } from '@/components/ui/button';
import { ScreenTitle } from '@/components/ui/section-header';
import { Card } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Palette, Radius, Shadow } from '@/constants/theme';
import {
  BED_COLUMNS,
  FARMS,
  LAST_SCAN,
  getFarm,
  harvestMap,
  type Plant,
  type PlantStage,
} from '@/data/farms';

const STAGE: Record<PlantStage, { label: string; bg: string; fg: string; tone: BadgeTone }> = {
  ready: { label: 'Pick today', bg: Colors.accent, fg: Colors.textOnAccent, tone: 'solid' },
  tomorrow: { label: 'Tomorrow', bg: Palette.orange300, fg: Colors.textPrimary, tone: 'accent' },
  flowering: { label: 'Flowering', bg: Colors.success, fg: Colors.surfaceCard, tone: 'success' },
  growing: { label: 'Growing', bg: Colors.surfaceSunken, fg: Colors.textSecondary, tone: 'neutral' },
};

function plantNote(p: Plant) {
  switch (p.stage) {
    case 'ready':
      return `${p.pods} ${p.pods > 1 ? 'pods are' : 'pod is'} 8–10 cm and ready now. Pick before 14:00, or they turn tough by tomorrow.`;
    case 'tomorrow':
      return `${p.pods} ${p.pods > 1 ? 'pods reach' : 'pod reaches'} picking size tomorrow morning.`;
    case 'flowering':
      return 'A flower opened this morning. We expect the pod to be ready in about 4 days.';
    case 'growing':
      return 'No flowers yet. The camera checks this plant again tomorrow at 05:40.';
  }
}

export default function HarvestScreen() {
  const { farm: farmParam } = useLocalSearchParams<{ farm?: string }>();
  const farm = getFarm(farmParam);
  const plants = useMemo(() => harvestMap(farm), [farm]);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [done, setDone] = useState<Record<string, boolean>>({});

  const selIndex = selected[farm.id] ?? plants.find((p) => p.stage === 'ready')?.index ?? 0;
  const sel = plants[selIndex];
  const ready = plants.filter((p) => p.stage === 'ready').reduce((n, p) => n + p.pods, 0);
  const tomorrow = plants.filter((p) => p.stage === 'tomorrow').reduce((n, p) => n + p.pods, 0);
  const flowers = plants.filter((p) => p.stage === 'flowering').length;
  const rows = Array.from({ length: plants.length / BED_COLUMNS }, (_, r) =>
    plants.slice(r * BED_COLUMNS, (r + 1) * BED_COLUMNS),
  );
  const isDone = done[farm.id];

  return (
    <Screen>
      <ScreenTitle
        kicker={`${farm.name} · Sat 26 Sep`}
        title="Harvest map"
        right={
          <IconButton
            icon={Camera}
            label={`Open ${farm.name}`}
            href={{ pathname: '/home/farm/[id]', params: { id: farm.id } }}
          />
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipScroll}>
        {FARMS.map((f) => {
          const on = f.id === farm.id;
          return (
            <Pressable
              key={f.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => router.setParams({ farm: f.id })}
              style={[styles.chip, on && styles.chipOn]}>
              <Txt variant="small" weight={700} color={on ? Colors.textOnAccent : Colors.textPrimary}>
                {f.name}
              </Txt>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.stats}>
        <Stat label="Pick today" value={ready} bg={Colors.accent} />
        <Stat label="Tomorrow" value={tomorrow} bg={Palette.orange300} />
        <Stat label="Flowers" value={flowers} bg={Colors.surfaceCard} />
      </View>

      <View style={styles.scan}>
        <Clock size={13} color={Colors.textSecondary} strokeWidth={2} />
        <Txt variant="small" weight={600} color={Colors.textSecondary}>
          Scanned at {LAST_SCAN} · tap a plant for details
        </Txt>
      </View>

      <Card style={styles.bed}>
        <Txt variant="micro" color={Colors.textSecondary} align="center">
          Window side
        </Txt>
        <View style={{ gap: 8 }}>
          {rows.map((row, r) => (
            <View key={r} style={styles.bedRow}>
              {row.map((p) => {
                const st = STAGE[p.stage];
                const active = p.index === selIndex;
                return (
                  <Pressable
                    key={p.index}
                    accessibilityRole="button"
                    accessibilityLabel={`Row ${p.row}, plant ${p.col}: ${st.label}${p.pods ? `, ${p.pods} pods` : ''}`}
                    accessibilityState={{ selected: active }}
                    onPress={() => setSelected((s) => ({ ...s, [farm.id]: p.index }))}
                    style={[
                      styles.cell,
                      { backgroundColor: st.bg },
                      p.stage === 'growing' && styles.cellOutline,
                      active && styles.cellActive,
                    ]}>
                    {p.pods > 0 ? (
                      <Txt variant="body" weight={800} color={st.fg} tabular>
                        {p.pods}
                      </Txt>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
        <Txt variant="micro" color={Colors.textSecondary} align="center">
          Door
        </Txt>
      </Card>

      <View style={styles.legend}>
        <LegendSwatch color={Colors.accent} label="Pick today" />
        <LegendSwatch color={Palette.orange300} label="Tomorrow" />
        <LegendSwatch color={Colors.success} label="Flowering" />
        <LegendSwatch color={Colors.surfaceSunken} label="Growing" outlined />
      </View>

      <Card style={styles.detail}>
        <View style={styles.detailHead}>
          <Txt variant="heading">
            Row {sel.row} · Plant {sel.col}
          </Txt>
          <Badge label={STAGE[sel.stage].label} tone={STAGE[sel.stage].tone} />
        </View>
        <Txt variant="body" color={Colors.textBody}>
          {plantNote(sel)}
        </Txt>
      </Card>

      {isDone ? (
        <View style={styles.doneBanner}>
          <Check size={18} color={Colors.successFg} strokeWidth={2.5} />
          <Txt variant="body" weight={700} color={Colors.successFg} style={{ flex: 1 }}>
            Picking logged for {farm.name}. We&apos;ll update the forecast.
          </Txt>
        </View>
      ) : (
        <Button
          label="Mark picking done"
          icon={Check}
          block
          onPress={() => setDone((d) => ({ ...d, [farm.id]: true }))}
        />
      )}
    </Screen>
  );
}

function Stat({ label, value, bg }: { label: string; value: number; bg: string }) {
  return (
    <View style={[styles.stat, { backgroundColor: bg }]}>
      <Txt variant="micro">{label}</Txt>
      <Txt variant="title" tabular style={{ fontSize: 26, lineHeight: 32 }}>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  chipScroll: { marginHorizontal: -24 },
  chips: { gap: 8, paddingHorizontal: 24 },
  chip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceCard,
    boxShadow: Shadow.tile,
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: Colors.accent, boxShadow: Shadow.glow },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, padding: 12, borderRadius: Radius.md, gap: 4, boxShadow: Shadow.tile },
  scan: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bed: { padding: 14, gap: 10 },
  bedRow: { flexDirection: 'row', gap: 8 },
  cell: { flex: 1, height: 42, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  cellOutline: { borderWidth: 1, borderColor: Colors.borderSubtle },
  cellActive: { boxShadow: `0px 0px 0px 2px ${Colors.surfaceCard}, 0px 0px 0px 4px ${Colors.textPrimary}` },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  detail: { padding: 16, gap: 8 },
  detailHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.successBg,
  },
});
