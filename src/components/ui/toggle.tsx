import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Radius, Shadow } from '@/constants/theme';

/** Orange-filled switch; the platform Switch ignores thumb colors on web. */
export function Toggle({
  value,
  onValueChange,
  label,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <Pressable
      role="switch"
      aria-label={label}
      aria-checked={value}
      hitSlop={8}
      onPress={() => onValueChange(!value)}
      style={styles.hit}>
      <View style={[styles.track, { backgroundColor: value ? Colors.accent : Colors.borderSubtle }]}>
        <View style={[styles.knob, { left: value ? 23 : 3 }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { height: 44, justifyContent: 'center' },
  track: { width: 50, height: 30, borderRadius: Radius.pill },
  knob: {
    position: 'absolute',
    top: 3,
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceCard,
    boxShadow: Shadow.tile,
  },
});
