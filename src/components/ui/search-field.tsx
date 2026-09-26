import type { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Colors, Fonts, Radius, Shadow, TextSize } from '@/constants/theme';

type Props = Omit<TextInputProps, 'style'> & {
  icon: LucideIcon;
  trailingIcon?: LucideIcon;
  label: string;
};

/** White field with the orange glow; ring turns solid on focus. */
export function SearchField({ icon: Icon, trailingIcon: Trailing, label, onFocus, onBlur, ...input }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.field,
        { boxShadow: focused ? `0px 0px 0px 2px ${Colors.accent}, ${Shadow.glow}` : Shadow.glow },
      ]}>
      <Icon size={18} color={Colors.textSecondary} strokeWidth={2} />
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={Colors.textSecondary}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={styles.input}
        {...input}
      />
      {Trailing ? <Trailing size={18} color={Colors.accent} strokeWidth={2} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.md,
    flex: 1,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontFamily: Fonts.regular,
    fontSize: TextSize.body,
    color: Colors.textPrimary,
    outlineWidth: 0,
  },
});
