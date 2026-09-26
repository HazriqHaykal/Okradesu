import {
  Check,
  CloudRain,
  Leaf,
  Lightbulb,
  Mountain,
  RadioTower,
  Sprout,
  Waves,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Meter } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Palette, Radius } from '@/constants/theme';
import type { FarmAlert, MonitorFarm } from '@/data/monitor';
import type { Weather } from '@/services/weather';

export type Task = {
  id: string;
  icon: LucideIcon;
  title: string;
  detail: string;
  farmId?: string;
  urgent?: boolean;
};

/** Today's to-do list, built from the harvest, the alerts and the forecast. */
export function buildPlan(farms: MonitorFarm[], alerts: FarmAlert[], weather: Weather): Task[] {
  const farmName = (id: string) => farms.find((f) => f.id === id)?.name ?? id;
  const tasks: Task[] = [];

  for (const a of alerts.filter((x) => x.kind === 'disaster')) {
    const flood = a.id.endsWith('flood');
    tasks.push({
      id: a.id,
      icon: flood ? Waves : Mountain,
      title: `${flood ? 'Secure' : 'Keep off'} ${farmName(a.farmId)}`,
      detail: a.title,
      farmId: a.farmId,
      urgent: a.severity === 'critical',
    });
  }

  const byPods = [...farms].sort((a, b) => b.podsReady - a.podsReady).slice(0, 2);
  for (const f of byPods) {
    tasks.push({
      id: `pick-${f.id}`,
      icon: Sprout,
      title: `Pick ${f.podsReady} pods at ${f.name}`,
      detail: f.type === 'outdoor' && weather.skipWatering ? 'Before 11:00, ahead of the rain' : 'Before 11:00, under 10 cm',
      farmId: f.id,
    });
  }

  for (const a of alerts) {
    if (a.kind === 'sensor' && a.severity === 'critical' && a.id.endsWith('-moisture') && a.title.includes('dry')) {
      tasks.unshift({
        id: a.id,
        icon: CloudRain,
        title: `Water ${farmName(a.farmId)} now`,
        detail: a.detail,
        farmId: a.farmId,
        urgent: true,
      });
    } else if (a.kind === 'facility') {
      tasks.push({ id: a.id, icon: Lightbulb, title: `Fix: ${a.title}`, detail: farmName(a.farmId), farmId: a.farmId });
    } else if (a.kind === 'network') {
      tasks.push({
        id: a.id,
        icon: RadioTower,
        title: a.id.startsWith('gateway-') ? `Check ${a.title.replace(' unreachable', '')}` : `Check the LoRa node at ${farmName(a.farmId)}`,
        detail: 'Farms are running on their own controllers for now',
        farmId: a.farmId,
        urgent: a.severity === 'critical',
      });
    } else if (a.id.endsWith('-ec')) {
      tasks.push({ id: a.id, icon: Leaf, title: `Add fertiliser at ${farmName(a.farmId)}`, detail: a.detail, farmId: a.farmId });
    } else if (a.id.endsWith('-moisture') && a.title.includes('dry')) {
      tasks.push(
        weather.skipWatering
          ? {
              id: a.id,
              icon: CloudRain,
              title: `No need to water ${farmName(a.farmId)}`,
              detail: 'Rain will do it, the pump skips today',
              farmId: a.farmId,
            }
          : { id: a.id, icon: CloudRain, title: `Water ${farmName(a.farmId)}`, detail: a.detail, farmId: a.farmId },
      );
    }
  }
  return tasks;
}

export function TodayPlan({
  tasks,
  onOpen,
  limit,
}: {
  tasks: Task[];
  onOpen: (farmId: string) => void;
  /** Show only the first N tasks; progress still counts them all. */
  limit?: number;
}) {
  const [done, setDone] = useState<string[]>([]);
  const count = tasks.filter((t) => done.includes(t.id)).length;
  const toggle = (id: string) => setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Txt variant="small" weight={800}>
          {count === tasks.length ? 'All done for today' : `${count} of ${tasks.length} done`}
        </Txt>
        <Txt variant="caption" color={Colors.textSecondary}>
          Tap a task to open the farm
        </Txt>
      </View>
      <Meter value={tasks.length ? (count / tasks.length) * 100 : 100} color={Colors.success} />
      <View>
        {(limit ? tasks.slice(0, limit) : tasks).map((t, i) => {
          const isDone = done.includes(t.id);
          const Icon = t.icon;
          return (
            <View key={t.id} style={[styles.row, i > 0 && styles.divider]}>
              <Pressable
                role="checkbox"
                aria-checked={isDone}
                aria-label={t.title}
                hitSlop={8}
                onPress={() => toggle(t.id)}
                style={[styles.box, isDone && styles.boxOn]}>
                {isDone ? <Check size={14} color={Colors.textOnAccent} strokeWidth={3} /> : null}
              </Pressable>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`${t.title}. ${t.detail}`}
                disabled={!t.farmId}
                onPress={() => t.farmId && onOpen(t.farmId)}
                style={({ pressed }) => [styles.body, pressed && { opacity: 0.7 }]}>
                <View style={{ flex: 1, gap: 1 }}>
                  <Txt
                    variant="body"
                    weight={800}
                    color={isDone ? Colors.textSecondary : t.urgent ? Colors.dangerFg : Colors.textPrimary}
                    style={isDone && styles.struck}>
                    {t.title}
                  </Txt>
                  <Txt variant="caption" color={Colors.textSecondary} numberOfLines={1}>
                    {t.detail}
                  </Txt>
                </View>
                <View style={[styles.icon, t.urgent && !isDone && { backgroundColor: Colors.dangerBg }]}>
                  <Icon size={16} color={t.urgent && !isDone ? Colors.dangerFg : Colors.textAccent} strokeWidth={2} />
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, gap: 10 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  divider: { borderTopWidth: 1, borderTopColor: Colors.borderSubtle },
  box: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  struck: { textDecorationLine: 'line-through' },
  icon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Palette.orange100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
