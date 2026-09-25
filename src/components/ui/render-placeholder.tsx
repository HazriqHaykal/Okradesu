import { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { Txt } from '@/components/ui/text';
import { Colors, Palette } from '@/constants/theme';

/**
 * Striped stand-in for a photo or 3D render (the system's image placeholder).
 * Swap for an `expo-image` <Image> once real okra and farm imagery exists.
 */
export function RenderPlaceholder({
  label,
  height,
  radius = 18,
  style,
}: {
  label: string;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const id = `stripes-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View accessible accessibilityLabel={label} style={[styles.box, { height, borderRadius: radius }, style]}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id={id} width={11} height={11} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <Rect x={0} y={0} width={1} height={11} fill={Palette.orange200} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      <Txt variant="micro" weight={700} color={Colors.textAccent}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: Colors.surfaceTint,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
