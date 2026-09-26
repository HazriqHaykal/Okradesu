import {
  ChevronDown,
  ChevronUp,
  ListChecks,
  MessageCircle,
  RotateCcw,
  Send,
  Sunrise,
} from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdvisorText } from '@/components/advisor/advisor-text';
import { AgentFindings } from '@/components/advisor/agent-findings';
import { AgentProgress } from '@/components/advisor/agent-progress';
import { ProposalCard } from '@/components/advisor/proposal-card';
import { SourceChips } from '@/components/advisor/source-chips';
import { Button, IconButton } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { SearchField } from '@/components/ui/search-field';
import { Card } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, MaxContentWidth, Palette, Radius } from '@/constants/theme';
import {
  askAgent,
  latestBriefing,
  newRunId,
  type AgentHistory,
  type Briefing,
  type Proposal,
  type Trace,
} from '@/services/agent';

const SUGGESTIONS = [
  'What should I do today?',
  'Any okra to sell before it spoils?',
  'Is mildew risk rising anywhere?',
  'Should I water the outdoor fields?',
];

/** The docked tab bar (64) plus its raised centre button (~30), so the input clears both. */
const TAB_BAR_CLEARANCE = 96;

type Turn = {
  question: string;
  runId: string;
  reply?: string;
  proposals?: Proposal[];
  trace?: Trace;
  error?: string;
};

/** "Today's plan · 5:45 AM", or "Plan from Sep 25" when it's older. */
function planLabel(iso: string) {
  const d = new Date(iso);
  if (d.toDateString() === new Date().toDateString()) {
    return `Today's plan · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  return `Plan from ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

/**
 * Full-screen chat with the advisor team. Opens with this morning's saved
 * plan as the first message, so there's something useful before any question.
 */
export function AgentChat({ header }: { header: ReactNode }) {
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  // Jump to the bottom only for new messages, not when the reader opens "Show more".
  const followNext = useRef(false);
  const [history, setHistory] = useState<AgentHistory>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState('');
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [briefingLoaded, setBriefingLoaded] = useState(false);
  const busy = turns.length > 0 && !turns[turns.length - 1].reply && !turns[turns.length - 1].error;

  useEffect(() => {
    latestBriefing()
      .then(setBriefing)
      .catch(() => setBriefing(null))
      .finally(() => setBriefingLoaded(true));
  }, []);

  async function ask(text = question) {
    const q = text.trim();
    if (!q || busy) return;
    setQuestion('');
    const runId = newRunId();
    followNext.current = true;
    setTurns((t) => [...t, { question: q, runId }]);
    const update = (patch: Partial<Turn>) => {
      followNext.current = true;
      setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { ...turn, ...patch } : turn)));
    };
    try {
      const res = await askAgent(history, q, runId);
      setHistory(res.history);
      update({ reply: res.reply, proposals: res.proposals, trace: res.trace });
    } catch (e) {
      update({ error: e instanceof Error ? e.message : 'The advisor could not answer. Try again.' });
    }
  }

  const reset = () => {
    setHistory([]);
    setTurns([]);
  };

  const bottom = Math.max(insets.bottom, 8) + TAB_BAR_CLEARANCE;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (busy || followNext.current) scroll.current?.scrollToEnd({ animated: true });
          followNext.current = false;
        }}
        contentContainerStyle={[styles.messages, { paddingTop: insets.top + 12 }]}>
        {header}

        {/* First message: this morning's plan, or a hello. */}
        {!briefingLoaded ? null : briefing ? (
          <AdvisorBubble
            label={planLabel(briefing.created_at)}
            text={briefing.summary}
            trace={briefing.trace ?? []}
            proposals={briefing.proposals}
            foldProposals
          />
        ) : (
          <Card style={styles.bubbleAi}>
            <Txt variant="bodyLg" color={Colors.textBody}>
              Hi! Ask me anything about your farms, or tap a question below.
            </Txt>
          </Card>
        )}

        {turns.map((t) => (
          <View key={t.runId} style={{ gap: 8 }}>
            <View style={styles.bubbleMe}>
              <Txt variant="bodyLg" weight={600}>
                {t.question}
              </Txt>
            </View>
            {t.reply !== undefined ? (
              <AdvisorBubble text={t.reply || 'Done.'} trace={t.trace ?? []} proposals={t.proposals ?? []} />
            ) : t.error ? (
              <Card style={styles.bubbleAi}>
                <Txt variant="body" weight={700} color={Colors.dangerFg}>
                  {t.error}
                </Txt>
              </Card>
            ) : null}
            <AgentProgress runId={t.runId} running={t.reply === undefined && !t.error} />
          </View>
        ))}

        {turns.length > 0 && !busy ? (
          <Button label="New conversation" icon={RotateCcw} variant="ghost" size="sm" onPress={reset} />
        ) : null}
      </ScrollView>

      <View style={[styles.composer, { marginBottom: bottom }]}>
        {turns.length === 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {SUGGESTIONS.map((s) => (
              <Chip key={s} label={s} selected={false} onPress={() => ask(s)} size="sm" />
            ))}
          </ScrollView>
        ) : null}
        <View style={styles.askRow}>
          <SearchField
            icon={MessageCircle}
            label="Ask Okradesu AI"
            placeholder={busy ? 'The agents are checking your farms…' : 'Ask about your farms'}
            value={question}
            onChangeText={setQuestion}
            onSubmitEditing={() => ask()}
            returnKeyType="send"
            editable={!busy}
          />
          <IconButton icon={Send} label="Send question" variant="accent" size={46} onPress={() => ask()} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/**
 * One advisor answer: the readable plan, its action cards, and "How I checked"
 * folded away. With `foldProposals`, the cards hide behind one button so the
 * morning plan stays short.
 */
function AdvisorBubble({
  label,
  text,
  trace,
  proposals,
  foldProposals,
}: {
  label?: string;
  text: string;
  trace: Trace;
  proposals: Proposal[];
  foldProposals?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [showActions, setShowActions] = useState(!foldProposals);
  const sources = trace.flatMap((x) => x.sources ?? []);
  return (
    <View style={{ gap: 8 }}>
      <Card style={styles.bubbleAi}>
        {label ? (
          <View style={styles.label}>
            <Sunrise size={14} color={Palette.leaf800} strokeWidth={2} />
            <Txt variant="micro" color={Palette.leaf800}>
              {label}
            </Txt>
          </View>
        ) : null}
        <AdvisorText text={text} />
        {trace.length ? (
          <Pressable
            accessibilityRole="button"
            aria-expanded={open}
            onPress={() => setOpen((o) => !o)}
            hitSlop={8}
            style={styles.howToggle}>
            <Txt variant="small" weight={700} color={Colors.textAccent}>
              How I checked
            </Txt>
            {open ? (
              <ChevronUp size={14} color={Colors.textAccent} strokeWidth={2.5} />
            ) : (
              <ChevronDown size={14} color={Colors.textAccent} strokeWidth={2.5} />
            )}
          </Pressable>
        ) : null}
        {open ? (
          <View style={{ gap: 12 }}>
            <SourceChips sources={sources} />
            <AgentFindings trace={trace} />
          </View>
        ) : null}
      </Card>
      {foldProposals && proposals.length ? (
        <Button
          label={
            showActions
              ? 'Hide actions'
              : `${proposals.length} ${proposals.length === 1 ? 'action' : 'actions'} to confirm`
          }
          icon={showActions ? ChevronUp : ListChecks}
          variant="secondary"
          size="sm"
          onPress={() => setShowActions((s) => !s)}
          style={{ alignSelf: 'flex-start' }}
        />
      ) : null}
      {showActions ? proposals.map((p) => <ProposalCard key={p.id} proposal={p} />) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  messages: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 14,
  },
  composer: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },
  chips: { gap: 8 },
  askRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bubbleMe: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    backgroundColor: Colors.surfaceTint,
    borderRadius: Radius.lg,
    borderBottomRightRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleAi: { padding: 16, gap: 10, borderBottomLeftRadius: 6 },
  label: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  howToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingTop: 2 },
});
