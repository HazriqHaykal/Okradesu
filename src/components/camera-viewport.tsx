import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, type BadgeTone } from '@/components/ui/badge';
import { IconWell } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Radius } from '@/constants/theme';

export type ViewportBadge = { label: string; tone: BadgeTone } | null;

/**
 * Rounded, clipped box for a camera preview or photo. Width always comes from
 * the parent; height follows via aspectRatio (no fixed/min height, which would
 * let aspectRatio push the width past the parent on narrow screens).
 */
export function CameraViewport({
  children,
  badge,
  aspectRatio = 1,
}: {
  children: ReactNode;
  badge?: ViewportBadge;
  aspectRatio?: number;
}) {
  return (
    <View style={[styles.viewport, { aspectRatio }]}>
      {children}
      {badge ? (
        <View style={styles.badge} pointerEvents="none">
          <Badge label={badge.label} tone={badge.tone} />
        </View>
      ) : null}
    </View>
  );
}

/** Fills the viewport, covering whatever is under it (e.g. a failed live frame). */
export function ViewportCover({ children }: { children: ReactNode }) {
  return <View style={[StyleSheet.absoluteFill, styles.cover]}>{children}</View>;
}

/** Centered empty/connection state inside a viewport. Pass actions with `style={{ alignSelf: 'center' }}`. */
export function ViewportMessage({
  icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.message}>
      <IconWell icon={icon} size={44} bg={Colors.surfaceCard} />
      <Txt variant="bodyLg" weight={800} align="center">
        {title}
      </Txt>
      <Txt variant="small" color={Colors.textSecondary} align="center" style={styles.body}>
        {body}
      </Txt>
      {action}
    </View>
  );
}

export const viewportStyles = StyleSheet.create({
  centered: { alignSelf: 'center' },
});

const styles = StyleSheet.create({
  viewport: {
    alignSelf: 'stretch',
    width: '100%',
    maxWidth: '100%',
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: { position: 'absolute', top: 10, left: 10 },
  cover: { backgroundColor: Colors.surfaceTint, alignItems: 'center', justifyContent: 'center' },
  message: { width: '100%', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  body: { maxWidth: 260 },
});
