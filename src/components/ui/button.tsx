import { router, type Href } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Txt } from '@/components/ui/text';
import { Colors, Palette, Radius, Shadow } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'surface';
type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, { height: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { height: 36, paddingHorizontal: 18, fontSize: 11 },
  md: { height: 44, paddingHorizontal: 24, fontSize: 12 },
  lg: { height: 52, paddingHorizontal: 30, fontSize: 13 },
};

function variantStyle(variant: Variant, pressed: boolean): ViewStyle {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: pressed ? Colors.accentPressed : Colors.accent,
        borderColor: 'transparent',
        boxShadow: Shadow.glow,
      };
    case 'secondary':
      return {
        backgroundColor: pressed ? Palette.leaf200 : 'transparent',
        borderColor: Colors.borderStrong,
      };
    case 'ghost':
      return { backgroundColor: pressed ? Palette.leaf200 : 'transparent', borderColor: 'transparent' };
    case 'surface':
      return {
        backgroundColor: pressed ? Palette.leaf100 : Colors.surfaceCard,
        borderColor: 'transparent',
        boxShadow: Shadow.tile,
      };
  }
}

/**
 * Pressables navigate through the router rather than `<Link asChild>`, which
 * drops function styles (pressed states) on web.
 */
function pressHandler(href?: Href, onPress?: () => void) {
  if (!href) return onPress;
  return () => {
    onPress?.();
    router.navigate(href);
  };
}

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  href?: Href;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  block?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Pill button with an uppercase label. Labels on orange stay ink. */
export function Button({
  label,
  onPress,
  href,
  variant = 'primary',
  size = 'lg',
  icon: Icon,
  block,
  disabled,
  style,
}: ButtonProps) {
  const s = SIZES[size];
  const color = variant === 'ghost' ? Colors.textAccent : Colors.textPrimary;
  return (
    <Pressable
      accessibilityRole={href ? 'link' : 'button'}
      disabled={disabled}
      onPress={pressHandler(href, onPress)}
      style={({ pressed }) => [
        styles.button,
        { height: s.height, paddingHorizontal: s.paddingHorizontal },
        block && styles.block,
        variantStyle(variant, pressed),
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      {Icon ? <Icon size={16} color={color} strokeWidth={2} /> : null}
      <Txt
        weight={800}
        color={color}
        style={{ fontSize: s.fontSize, letterSpacing: s.fontSize * 0.08, textTransform: 'uppercase' }}>
        {label}
      </Txt>
    </Pressable>
  );
}

export type IconButtonProps = {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  href?: Href;
  variant?: 'surface' | 'accent';
  size?: number;
  dot?: boolean;
};

/** Round icon-only button (44 px by default). `surface` is white; `accent` is orange for the one primary action. Always pass `label` for screen readers. */
export function IconButton({
  icon: Icon,
  label,
  onPress,
  href,
  variant = 'surface',
  size = 44,
  dot,
}: IconButtonProps) {
  const accent = variant === 'accent';
  return (
    <Pressable
      accessibilityRole={href ? 'link' : 'button'}
      accessibilityLabel={label}
      onPress={pressHandler(href, onPress)}
      style={({ pressed }) => [
        styles.iconButton,
        {
          width: size,
          height: size,
          backgroundColor: accent
            ? pressed
              ? Colors.accentPressed
              : Colors.accent
            : pressed
              ? Palette.leaf100
              : Colors.surfaceCard,
          boxShadow: accent ? Shadow.glow : Shadow.tile,
        },
        pressed && styles.iconPressed,
      ]}>
      <Icon size={Math.round(size * 0.46)} color={Colors.textPrimary} strokeWidth={2} />
      {dot ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  block: { alignSelf: 'stretch' },
  pressed: { transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.45 },
  iconButton: {
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPressed: { transform: [{ scale: 0.94 }] },
  dot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: Colors.surfaceCard,
  },
});
