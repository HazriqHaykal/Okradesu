import type { TabListProps, TabTriggerSlotProps } from 'expo-router/ui';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '@/components/ui/text';
import { Colors, Palette, Radius, Shadow } from '@/constants/theme';

/** The system's BottomNav: a white pill that floats over content. */
export function FloatingTabBar({ children }: TabListProps) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) + 10 }]}>
      <View accessibilityRole="tablist" style={styles.bar}>
        {children}
      </View>
    </View>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  icon: LucideIcon;
  label: string;
  /** Tinted even when not selected (the AI Advisor in the middle). */
  highlight?: boolean;
};

/** Active tab fills orange and shows its label; the rest are icon-only. */
export function TabButton({ icon: Icon, label, highlight, isFocused, ...props }: TabButtonProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [
        styles.tab,
        highlight && !isFocused && styles.tabHighlight,
        isFocused && styles.tabActive,
        pressed && !isFocused && styles.tabPressed,
      ]}>
      <Icon
        size={18}
        color={isFocused ? Colors.textOnAccent : highlight ? Colors.textAccent : Colors.textSecondary}
        strokeWidth={2}
      />
      {isFocused ? (
        <Txt variant="small" weight={700} color={Colors.textOnAccent}>
          {label}
        </Txt>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  bar: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 7,
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.xl,
    boxShadow: Shadow.float,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: Radius.lg,
  },
  tabActive: { backgroundColor: Colors.accent, paddingHorizontal: 16 },
  tabHighlight: { backgroundColor: Palette.orange200 },
  tabPressed: { backgroundColor: Colors.surfaceSunken },
});
