import {
  CloudRainWind,
  Droplet,
  Presentation,
  RotateCcw,
  ScanEye,
  Wind,
  WifiOff,
  type LucideIcon,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Divider, IconWell } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Toggle } from '@/components/ui/toggle';
import { Colors, MaxContentWidth, Radius, Shadow } from '@/constants/theme';
import { demoActive, resetDemo, setDemo, useDemo, type DemoState } from '@/data/demo';

type Flag = Exclude<keyof DemoState, 'newPods'>;

const SCENARIOS: { key: Flag; icon: LucideIcon; title: string; detail: string }[] = [
  {
    key: 'drySoil',
    icon: Droplet,
    title: 'Dry soil at Field A',
    detail: 'Moisture drops to 24%: critical alert and a task',
  },
  {
    key: 'humid',
    icon: Wind,
    title: 'Humid air at Field D',
    detail: 'Humidity 88%: fans switch on, fungal risk warning',
  },
  {
    key: 'heavyRain',
    icon: CloudRainWind,
    title: 'Heavy rain tomorrow',
    detail: '72 mm forecast: landslide and flood alerts',
  },
  {
    key: 'gatewayDown',
    icon: WifiOff,
    title: 'Gateway offline',
    detail: 'Farms run on their own and buffer readings',
  },
];

/**
 * Wraps a title: long-press it to open the presenter's demo switches.
 * Nothing on screen hints at it, so judges only see the effects.
 */
export function DemoTrigger({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable onLongPress={() => setOpen(true)} delayLongPress={700} accessible={false}>
        {children}
      </Pressable>
      <DemoPanel visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function DemoPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const demo = useDemo();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close demo panel" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.grab} />
        <View style={styles.head}>
          <IconWell icon={Presentation} size={40} />
          <View style={{ flex: 1 }}>
            <Txt variant="heading">Demo mode</Txt>
            <Txt variant="small" color={Colors.textSecondary}>
              {demoActive(demo) ? 'Scenarios are running' : 'Backup if a sensor misbehaves on stage'}
            </Txt>
          </View>
        </View>

        <View>
          {SCENARIOS.map((s, i) => (
            <View key={s.key}>
              {i > 0 ? <Divider /> : null}
              <View style={styles.row}>
                <IconWell icon={s.icon} size={36} radius={Radius.sm} />
                <View style={{ flex: 1, gap: 1 }}>
                  <Txt variant="body" weight={800}>
                    {s.title}
                  </Txt>
                  <Txt variant="caption" color={Colors.textSecondary}>
                    {s.detail}
                  </Txt>
                </View>
                <Toggle label={s.title} value={demo[s.key]} onValueChange={(v) => setDemo({ [s.key]: v })} />
              </View>
            </View>
          ))}
          <Divider />
          <View style={styles.row}>
            <IconWell icon={ScanEye} size={36} radius={Radius.sm} />
            <View style={{ flex: 1, gap: 1 }}>
              <Txt variant="body" weight={800}>
                Camera finds new pods
              </Txt>
              <Txt variant="caption" color={Colors.textSecondary} tabular>
                {demo.newPods ? `+${demo.newPods} ready at Field A` : 'Adds 12 ready pods at Field A'}
              </Txt>
            </View>
            <Button label="+12" size="sm" variant="secondary" onPress={() => setDemo({ newPods: demo.newPods + 12 })} />
          </View>
        </View>

        <View style={styles.actions}>
          <Button label="Reset all" icon={RotateCcw} variant="secondary" size="md" onPress={resetDemo} />
          <Button label="Done" size="md" onPress={onClose} style={{ flex: 1 }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(30, 26, 22, 0.35)' },
  sheet: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    backgroundColor: Colors.surfaceCard,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    paddingTop: 10,
    paddingHorizontal: 24,
    gap: 12,
    boxShadow: Shadow.float,
  },
  grab: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.borderSubtle,
    marginBottom: 4,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
