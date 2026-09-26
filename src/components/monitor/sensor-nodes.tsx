import {
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Camera,
  Cpu,
  Plug,
  Router,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Thermometer,
  Droplet,
  type LucideIcon,
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Divider } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Palette, Radius } from '@/constants/theme';
import { nodesFor, type MonitorFarm, type NodeKind, type SensorNode } from '@/data/monitor';
import type { useLiveFarm } from '@/hooks/use-live-farm';

type Live = ReturnType<typeof useLiveFarm>;

const KIND_ICON: Record<NodeKind, LucideIcon> = {
  sensor: Droplet,
  climate: Thermometer,
  relay: Cpu,
  camera: Camera,
};

function rand(seed: number) {
  const x = Math.sin(seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function ago(s: number) {
  if (s < 2) return 'just now';
  if (s < 60) return `${s} s ago`;
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  return `${Math.floor(s / 3600)} h ago`;
}

/** Each LoRa node's heartbeat: last uplink, signal, battery and packets received today. */
export function SensorNodes({ farm, live }: { farm: MonitorFarm; live: Live }) {
  const nodes = nodesFor(farm);
  const tick = Math.floor(live.updatedAt / 5000);
  const since = new Date(live.updatedAt);
  const secToday = since.getHours() * 3600 + since.getMinutes() * 60 + since.getSeconds();
  const offlineFor = live.offline ? live.secondsAgo : 0;

  const rows = nodes.map((n, i) => {
    const lastSeen = live.offline
      ? offlineFor
      : n.kind === 'camera'
        ? secToday % n.every
        : n.every > 5
          ? (secToday + i * 7) % n.every
          : live.secondsAgo + (i % 2);
    const rssi = n.rssi + Math.round((rand(tick + i) - 0.5) * 4);
    const packets = Math.floor(secToday / n.every);
    const late = lastSeen > n.every * 3;
    return { n, lastSeen, rssi, packets, late };
  });
  const up = rows.filter((r) => !r.late).length;

  return (
    <View style={styles.card}>
      <View style={styles.gateway}>
        <View style={[styles.gwIcon, { backgroundColor: live.offline ? Colors.dangerBg : Colors.successBg }]}>
          <Router size={18} color={live.offline ? Colors.dangerFg : Colors.successFg} strokeWidth={2} />
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <Txt variant="body" weight={800}>
            Gateway {farm.gateway} · 920 MHz LoRa
          </Txt>
          <Txt variant="caption" color={Colors.textSecondary} tabular>
            {live.offline
              ? `Unreachable · ${farm.buffered} readings buffered on site`
              : `${up} of ${rows.length} nodes online · 0 packets lost today`}
          </Txt>
        </View>
      </View>

      {rows.map(({ n, lastSeen, rssi, packets, late }) => (
        <View key={n.id}>
          <Divider />
          <NodeRow node={n} lastSeen={lastSeen} rssi={rssi} packets={packets} late={late} />
        </View>
      ))}
    </View>
  );
}

function NodeRow({
  node: n,
  lastSeen,
  rssi,
  packets,
  late,
}: {
  node: SensorNode;
  lastSeen: number;
  rssi: number;
  packets: number;
  late: boolean;
}) {
  const Icon = KIND_ICON[n.kind];
  const Signal = rssi > -90 ? SignalHigh : rssi > -105 ? SignalMedium : SignalLow;
  const weak = rssi <= -105;
  const Battery = n.battery == null ? Plug : n.battery > 60 ? BatteryFull : n.battery > 25 ? BatteryMedium : BatteryLow;
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Node ${n.id}, ${n.role}. ${late ? 'Not heard from' : 'Last seen'} ${ago(lastSeen)}. Signal ${rssi} dBm. ${n.battery == null ? 'Mains power' : `Battery ${n.battery}%`}.`}>
      <View>
        <View style={styles.nodeIcon}>
          <Icon size={16} color={Colors.textAccent} strokeWidth={2} />
        </View>
        <View style={[styles.dot, { backgroundColor: late ? Colors.danger : Colors.success }]} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <View style={styles.line}>
          <Txt variant="small" weight={800} tabular>
            {n.id}
          </Txt>
          <Txt
            variant="caption"
            weight={700}
            color={late ? Colors.dangerFg : Colors.successFg}
            tabular>
            {late ? `silent ${ago(lastSeen)}` : ago(lastSeen)}
          </Txt>
        </View>
        <View style={styles.line}>
          <Txt variant="caption" color={Colors.textSecondary} numberOfLines={1} style={{ flexShrink: 1 }}>
            {n.role}
          </Txt>
          <View style={styles.meta}>
            <Signal size={13} color={weak ? Colors.textAccent : Colors.textSecondary} strokeWidth={2.5} />
            <Txt variant="caption" color={weak ? Colors.textAccent : Colors.textSecondary} tabular>
              {rssi} dBm
            </Txt>
            <Battery size={13} color={Colors.textSecondary} strokeWidth={2} />
            <Txt variant="caption" color={Colors.textSecondary} tabular>
              {n.battery == null ? 'mains' : `${n.battery}%`}
            </Txt>
          </View>
        </View>
        <Txt variant="caption" color={Colors.textSecondary} tabular>
          {packets.toLocaleString('en-US')} packets today · every {n.every >= 60 ? `${n.every / 60} min` : `${n.every} s`}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.bgApp, borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 4 },
  gateway: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  gwIcon: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  nodeIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Palette.orange150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.bgApp,
  },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
