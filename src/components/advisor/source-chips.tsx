import { Database } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Txt } from '@/components/ui/text';
import { Colors, Radius } from '@/constants/theme';
import type { Source } from '@/services/agent';

/** The data an answer is based on, e.g. "Live sensors · 5/6 farms reporting · 08:09". */
export function SourceChips({ sources, title = 'Sources' }: { sources: Source[]; title?: string }) {
  const unique = sources.filter(
    (s, i) => sources.findIndex((x) => x.label === s.label && x.detail === s.detail) === i,
  );
  if (!unique.length) return null;
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="micro" color={Colors.textSecondary}>
        {title}
      </Txt>
      <View style={styles.wrap}>
        {unique.map((s) => (
          <View key={`${s.label}|${s.detail}`} style={styles.chip}>
            <Database size={11} color={Colors.textSecondary} strokeWidth={2} />
            <Txt variant="caption" color={Colors.textBody} style={{ flexShrink: 1 }}>
              <Txt variant="caption" weight={800}>
                {s.label}
              </Txt>{' '}
              · {s.detail}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '100%',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceSunken,
  },
});
