import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AGENT_ICON } from '@/components/advisor/agent-progress';
import { SourceChips } from '@/components/advisor/source-chips';
import { Txt } from '@/components/ui/text';
import { Colors, Palette, Radius, Shadow } from '@/constants/theme';
import { AGENT_ABOUT, AGENT_LABEL, type AgentId, type Trace } from '@/services/agent';

const TEAM: AgentId[] = ['orchestrator', 'monitor', 'health', 'harvest', 'market'];

/** What each specialist was asked, what it found and which data it read. */
export function AgentFindings({ trace }: { trace: Trace }) {
  if (!trace.length) return null;
  return (
    <View style={{ gap: 8 }}>
      <Txt variant="micro" color={Colors.textSecondary}>
        What each agent found
      </Txt>
      {trace.map((t, i) => (
        <Finding key={`${t.agent}-${i}`} item={t} />
      ))}
    </View>
  );
}

function Finding({ item }: { item: Trace[number] }) {
  const [open, setOpen] = useState(false);
  const Icon = AGENT_ICON[item.agent];
  return (
    <Pressable
      accessibilityRole="button"
      aria-expanded={open}
      onPress={() => setOpen((o) => !o)}
      style={styles.finding}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <Icon size={14} color={Palette.orange800} strokeWidth={2} />
        </View>
        <Txt variant="small" weight={800} style={{ flex: 1 }}>
          {AGENT_LABEL[item.agent]} agent
        </Txt>
        {open ? (
          <ChevronUp size={16} color={Colors.textSecondary} strokeWidth={2} />
        ) : (
          <ChevronDown size={16} color={Colors.textSecondary} strokeWidth={2} />
        )}
      </View>
      <Txt variant="small" color={Colors.textBody} numberOfLines={open ? undefined : 3}>
        {item.report}
      </Txt>
      {open ? (
        <>
          <Txt variant="caption" color={Colors.textSecondary}>
            Asked: {item.task}
          </Txt>
          <SourceChips sources={item.sources ?? []} title="Data it read" />
        </>
      ) : null}
    </Pressable>
  );
}

/** The team and what each agent watches, shown before the first run. */
export function TeamIntro() {
  return (
    <View style={{ gap: 8 }}>
      {TEAM.map((a) => {
        const Icon = AGENT_ICON[a];
        return (
          <View key={a} style={styles.intro}>
            <View style={styles.icon}>
              <Icon size={14} color={Palette.orange800} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="small" weight={800}>
                {AGENT_LABEL[a]}
                {a === 'orchestrator' ? '' : ' agent'}
              </Txt>
              <Txt variant="caption" color={Colors.textSecondary}>
                {AGENT_ABOUT[a]}
              </Txt>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  finding: {
    gap: 6,
    padding: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceCard,
    boxShadow: Shadow.tile,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.orange200,
  },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
