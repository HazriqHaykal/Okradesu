import type { TabListProps, TabTriggerSlotProps } from 'expo-router/ui';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '@/components/ui/text';
import { Colors, MaxContentWidth, Shadow } from '@/constants/theme';

/** Height of the bar itself, above the phone's home-indicator inset. */
const BAR_HEIGHT = 64;
/** The centre action is a circle that rises above the bar. */
const CENTER_SIZE = 58;

/** Bottom navigation docked to the screen edge: icon over label for every tab. */
export function FloatingTabBar({ children }: TabListProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View accessibilityRole="tablist" style={styles.row}>
        {children}
      </View>
    </View>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  icon: LucideIcon;
  label: string;
  /** The raised round button in the middle (Okradesu AI). */
  highlight?: boolean;
};

/** A tab: icon over a short label; the selected one is ink and bold, the rest grey. */
export function TabButton({ icon: Icon, label, highlight, isFocused, ...props }: TabButtonProps) {
  if (highlight) {
    return (
      <Pressable
        {...props}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: isFocused }}
        style={styles.tab}>
        {({ pressed }) => (
          <>
            <View
              style={[
                styles.center,
                { backgroundColor: pressed ? Colors.accentPressed : Colors.accent },
                pressed && styles.centerPressed,
              ]}>
              <Icon size={26} color={Colors.textOnAccent} strokeWidth={2.25} />
            </View>
            <Txt
              variant="caption"
              weight={isFocused ? 800 : 600}
              color={isFocused ? Colors.textPrimary : Colors.textSecondary}
              numberOfLines={1}>
              {label}
            </Txt>
          </>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}>
      <Icon
        size={22}
        color={isFocused ? Colors.textPrimary : Colors.textSecondary}
        strokeWidth={isFocused ? 2.5 : 2}
      />
      <Txt
        variant="caption"
        weight={isFocused ? 800 : 600}
        color={isFocused ? Colors.textPrimary : Colors.textSecondary}
        numberOfLines={1}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    boxShadow: '0px -4px 16px rgba(30, 26, 22, 0.06)',
  },
  row: {
    height: BAR_HEIGHT,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingBottom: 8,
  },
  tabPressed: { opacity: 0.6 },
  center: {
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: CENTER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    // Rises above the bar's top edge, like a floating action button.
    marginTop: -(CENTER_SIZE / 2),
    marginBottom: 2,
    borderWidth: 4,
    borderColor: Colors.surfaceCard,
    boxShadow: Shadow.glow,
  },
  centerPressed: { transform: [{ scale: 0.95 }] },
});
