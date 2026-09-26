import { RefreshCw, Sunrise } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AgentFindings, TeamIntro } from '@/components/advisor/agent-findings';
import { AgentProgress } from '@/components/advisor/agent-progress';
import { ProposalCard } from '@/components/advisor/proposal-card';
import { Button } from '@/components/ui/button';
import { Card, IconWell } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Palette } from '@/constants/theme';
import { latestBriefing, newRunId, runBriefing, type Briefing } from '@/services/agent';

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' });

/** Today's plan, written by the advisor at 05:45 (or on demand). */
export function BriefingCard() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The run started from this card, to show the agents working. */
  const [runId, setRunId] = useState<string | null>(null);

  useEffect(() => {
    latestBriefing()
      .then(setBriefing)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load the briefing.'))
      .finally(() => setLoading(false));
  }, []);

  async function refresh() {
    const id = newRunId();
    setRunId(id);
    setRunning(true);
    setError(null);
    try {
      setBriefing((await runBriefing(id)).briefing);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The briefing failed. Try again.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <IconWell icon={Sunrise} size={40} bg={Palette.orange200} fg={Palette.orange800} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="heading">Morning briefing</Txt>
          <Txt variant="small" color={Colors.textSecondary}>
            {running
              ? 'The agent team is checking every farm… about a minute'
              : briefing
                ? `Checked all farms · ${when(briefing.created_at)}`
                : 'Every day at 05:45'}
          </Txt>
        </View>
      </View>

      {runId ? <AgentProgress key={runId} runId={runId} running={running} /> : null}

      {loading ? (
        <View style={styles.busy}>
          <ActivityIndicator color={Colors.accent} />
          <Txt variant="small" color={Colors.textSecondary} style={{ flex: 1 }}>
            Loading…
          </Txt>
        </View>
      ) : running ? null : briefing ? (
        <>
          <Txt variant="body" color={Colors.textBody}>
            {briefing.summary}
          </Txt>
          {briefing.proposals.map((p) => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
          <AgentFindings trace={briefing.trace ?? []} />
        </>
      ) : (
        <>
          <Txt variant="body" color={Colors.textSecondary}>
            No briefing yet. Every morning at 05:45 the orchestrator asks this team to check all farms and writes your
            plan. Run it now to see it.
          </Txt>
          <TeamIntro />
        </>
      )}

      {error ? (
        <Txt variant="small" weight={700} color={Colors.dangerFg}>
          {error}
        </Txt>
      ) : null}

      <Button
        label={briefing ? 'Check again now' : 'Run briefing now'}
        icon={RefreshCw}
        size="sm"
        variant="secondary"
        disabled={running}
        onPress={refresh}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  busy: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
});
