import { MessageCircle, RotateCcw, Send } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AgentProgress } from '@/components/advisor/agent-progress';
import { ProposalCard } from '@/components/advisor/proposal-card';
import { Button, IconButton } from '@/components/ui/button';
import { Chip, ChipRow } from '@/components/ui/chip';
import { SearchField } from '@/components/ui/search-field';
import { Card } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Radius } from '@/constants/theme';
import { askAgent, newRunId, type AgentHistory, type Proposal } from '@/services/agent';

const SUGGESTIONS = [
  'What should I do today?',
  'Any okra to sell before it spoils?',
  'Is mildew risk rising anywhere?',
  'Should I water the outdoor fields?',
];

type Turn = { question: string; runId: string; reply?: string; proposals?: Proposal[]; error?: string };

/** Chat with the advisor team: the orchestrator asks the specialists and suggests actions to confirm. */
export function AgentChat() {
  const [history, setHistory] = useState<AgentHistory>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState('');
  const busy = turns.length > 0 && !turns[turns.length - 1].reply && !turns[turns.length - 1].error;

  async function ask(text = question) {
    const q = text.trim();
    if (!q || busy) return;
    setQuestion('');
    const runId = newRunId();
    setTurns((t) => [...t, { question: q, runId }]);
    const update = (patch: Partial<Turn>) =>
      setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { ...turn, ...patch } : turn)));
    try {
      const res = await askAgent(history, q, runId);
      setHistory(res.history);
      update({ reply: res.reply, proposals: res.proposals });
    } catch (e) {
      update({ error: e instanceof Error ? e.message : 'The advisor could not answer. Try again.' });
    }
  }

  return (
    <View style={{ gap: 12 }}>
      {turns.length === 0 ? (
        <ChipRow>
          {SUGGESTIONS.map((s) => (
            <Chip key={s} label={s} selected={false} onPress={() => ask(s)} size="sm" />
          ))}
        </ChipRow>
      ) : null}

      {turns.map((t, i) => (
        <View key={i} style={{ gap: 8 }}>
          <View style={styles.bubbleMe}>
            <Txt variant="body" weight={600}>
              {t.question}
            </Txt>
          </View>
          {t.reply !== undefined ? (
            <Card style={styles.bubbleAi}>
              <Txt variant="body" color={Colors.textBody}>
                {t.reply || 'Done.'}
              </Txt>
            </Card>
          ) : t.error ? (
            <Card style={styles.bubbleAi}>
              <Txt variant="body" weight={700} color={Colors.dangerFg}>
                {t.error}
              </Txt>
            </Card>
          ) : null}
          <AgentProgress key={t.runId} runId={t.runId} running={t.reply === undefined && !t.error} />
          {t.proposals?.map((p) => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
        </View>
      ))}

      <View style={styles.askRow}>
        <SearchField
          icon={MessageCircle}
          label="Ask the advisor"
          placeholder="Ask about your farms"
          value={question}
          onChangeText={setQuestion}
          onSubmitEditing={() => ask()}
          returnKeyType="send"
          editable={!busy}
        />
        <IconButton icon={Send} label="Send question" variant="accent" size={46} onPress={() => ask()} />
      </View>

      {turns.length > 0 && !busy ? (
        <Button
          label="New conversation"
          icon={RotateCcw}
          variant="ghost"
          size="sm"
          onPress={() => {
            setHistory([]);
            setTurns([]);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleMe: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    backgroundColor: Colors.surfaceTint,
    borderRadius: Radius.lg,
    borderBottomRightRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleAi: { maxWidth: '92%', padding: 14, borderBottomLeftRadius: 6 },
  askRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
