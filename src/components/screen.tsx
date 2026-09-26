import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing, TabBarSpace } from '@/constants/theme';

/** Every screen sits on the hero gradient: peach at the top, cream by 38%. */
export function HeroBackground() {
  return (
    <LinearGradient
      colors={[Colors.heroTop, Colors.bgApp]}
      locations={[0, 0.38]}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}

export function Screen({
  children,
  withTabBar = true,
  contentStyle,
}: {
  children: ReactNode;
  withTabBar?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <HeroBackground />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + (withTabBar ? TabBarSpace : Spacing.eight),
          },
          contentStyle,
        ]}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgApp },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.gutter,
    gap: Spacing.four,
  },
});
