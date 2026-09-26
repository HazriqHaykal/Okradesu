import {
  Activity,
  Check,
  ChevronDown,
  ChevronUp,
  Leaf,
  Network,
  Sprout,
  Store,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Txt } from '@/components/ui/text';
import { Colors, Palette, Radius } from '@/constants/theme';
import { useAgentSteps } from '@/hooks/use-agent-steps';
import { AGENT_LABEL, type AgentId, type AgentStep } from '@/services/agent';

const ORDER: AgentId[] = ['orchestrator', 'monitor', 'health', 'harvest', 'market'];

const ICON: Record<AgentId, LucideIcon> = {
  orchestrator: Network,
  monitor: Activity,
  health: Leaf,
  harvest: Sprout,
  market: Store,
};

type Status = 'idle' | 'working' | 'done';

function statusOf(agent: AgentId, steps: AgentStep[], running: boolean): Status {
  const mine = steps.filter((s) => s.agent === agent);
  if (!mine.length) return 'idle';
  if (!running) return 'done';
  if (agent === 'orchestrator') return 'working';
  return mine[mine.length - 1].message === 'reported back' ? 'done' : 'working';
}

/** Latest thing an agent did, without the long "started: <task>" text. */
const latest = (agent: AgentId, steps: AgentStep[]) => {
  const m = steps.filter((s) => s.agent === agent).pop()?.message ?? '';
  return m.startsWith('started:') ? 'starting' : m;
};

/**
 * The agent team at work: live while a run is going, then a collapsible log
 * of every step so the farmer (or a judge) can see how the answer was built.
 */
export function AgentProgress({ runId, running }: { runId: string; running: boolean }) {
  const steps = useAgentSteps(runId);
  const [open, setOpen] = useState(false);
  const agents = ORDER.filter((a) => a === 'orchestrator' || steps.some((s) => s.agent === a));

  if (running) {
    return (
      <View style={styles.box}>
        {(steps.length ? agents : ['orchestrator' as AgentId]).map((a) => {
          const st = statusOf(a, steps, true);
          const Icon = ICON[a];
          return (
            <View key={a} style={styles.row}>
              <View style={[styles.icon, st === 'done' && styles.iconDone]}>
                <Icon size={14} color={st === 'done' ? Colors.successFg : Palette.orange800} strokeWidth={2} />
              </View>
              <Txt variant="small" weight={800} style={styles.name} numberOfLines={1}>
                {AGENT_LABEL[a]}
              </Txt>
              <Txt variant="caption" color={Colors.textSecondary} style={{ flex: 1 }} numberOfLines={1}>
                {st === 'idle' ? 'getting ready…' : latest(a, steps)}
              </Txt>
              {st === 'working' || st === 'idle' ? (
                <ActivityIndicator size="small" color={Colors.accent} />
              ) : (
                <Check size={14} color={Colors.successFg} strokeWidth={2.5} />
              )}
            </View>
          );
        })}
      </View>
    );
  }

  if (!steps.length) return null;
  const specialists = agents.filter((a) => a !== 'orchestrator');
  return (
    <View style={styles.box}>
      <Pressable
        accessibilityRole="button"
        aria-expanded={open}
        onPress={() => setOpen((o) => !o)}
        style={styles.row}>
        <View style={styles.icon}>
          <Network size={14} color={Palette.orange800} strokeWidth={2} />
        </View>
        <Txt variant="small" weight={700} color={Colors.textBody} style={{ flex: 1 }}>
          How the team worked it out · {specialists.length} {specialists.length === 1 ? 'agent' : 'agents'},{' '}
          {steps.length} steps
        </Txt>
        {open ? (
          <ChevronUp size={16} color={Colors.textSecondary} strokeWidth={2} />
        ) : (
          <ChevronDown size={16} color={Colors.textSecondary} strokeWidth={2} />
        )}
      </Pressable>
      {open
        ? steps.map((s) => (
            <View key={s.id} style={styles.logRow}>
              <Txt variant="caption" color={Colors.textSecondary} tabular style={styles.time}>
                {new Date(s.created_at).toTimeString().slice(0, 8)}
              </Txt>
              <Txt variant="caption" style={{ flex: 1 }}>
                <Txt variant="caption" weight={800}>
                  {AGENT_LABEL[s.agent]}
                </Txt>{' '}
                {s.message}
              </Txt>
            </View>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: 8,
    padding: 12,
    borderRadius: Radius.md,
    backgroundColor: Palette.orange100,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 24 },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.orange200,
  },
  iconDone: { backgroundColor: Colors.successBg },
  name: { width: 124 },
  logRow: { flexDirection: 'row', gap: 8, paddingLeft: 32 },
  time: { width: 58 },
});
