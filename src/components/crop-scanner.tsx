import { Cctv, ScanSearch, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FarmMonitor } from '@/components/farm-monitor';
import { LeafScan } from '@/components/leaf-scan';
import { Txt } from '@/components/ui/text';
import { Colors, Radius, Shadow } from '@/constants/theme';

type Mode = 'monitor' | 'leaf';

const MODES: { id: Mode; label: string; icon: LucideIcon }[] = [
  { id: 'monitor', label: 'Farm Monitor', icon: Cctv },
  { id: 'leaf', label: 'Leaf Scan', icon: ScanSearch },
];

/**
 * Crop Health on the Disease tab, in two modes with different jobs:
 * Farm Monitor (ESP32-CAM + sensors → disease risk) and
 * Leaf Scan (phone photo → Crop Health AI visual screening).
 */
export function CropScanner() {
  const [mode, setMode] = useState<Mode>('monitor');
  const [busy, setBusy] = useState(false);

  const header = (
    <>
      <Txt variant="heading" align="center">
        Crop Health
      </Txt>
      <View accessibilityRole="tablist" style={styles.selector}>
        {MODES.map((m) => {
          const on = m.id === mode;
          const Icon = m.icon;
          return (
            <Pressable
              key={m.id}
              accessibilityRole="tab"
              accessibilityLabel={m.label}
              accessibilityState={{ selected: on, disabled: busy }}
              disabled={busy}
              onPress={() => setMode(m.id)}
              style={({ pressed }) => [styles.option, on && styles.optionOn, pressed && !on && styles.optionPressed]}>
              <Icon size={15} color={on ? Colors.textOnAccent : Colors.textSecondary} strokeWidth={2} />
              <Txt
                variant="small"
                weight={700}
                color={on ? Colors.textOnAccent : Colors.textSecondary}
                numberOfLines={1}
                style={{ flexShrink: 1 }}>
                {m.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </>
  );

  return mode === 'monitor' ? (
    <FarmMonitor header={header} onUsePhone={() => setMode('leaf')} />
  ) : (
    <LeafScan header={header} onBusyChange={setBusy} />
  );
}

const styles = StyleSheet.create({
  // Same pill language as the floating tab bar: a sunken track with the active option filled orange.
  selector: {
    flexDirection: 'row',
    alignSelf: 'center',
    maxWidth: '100%',
    gap: 4,
    padding: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceSunken,
  },
  option: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
  },
  optionOn: { backgroundColor: Colors.accent, boxShadow: Shadow.glow },
  optionPressed: { backgroundColor: Colors.surfaceCard },
});
