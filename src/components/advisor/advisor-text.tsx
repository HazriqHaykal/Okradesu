import {
  ChevronDown,
  ChevronUp,
  CloudRain,
  Fan,
  ListChecks,
  RadioTower,
  Sprout,
  Store,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Divider, IconWell } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors } from '@/constants/theme';

type Item = { topic: string; icon: LucideIcon; text: string; sources: string[] };
type Parsed = { headline: string; items: Item[]; notes: string[] };

const TOPICS: { topic: string; icon: LucideIcon; words: RegExp }[] = [
  { topic: 'Weather', icon: CloudRain, words: /rain|weather|flood|landslide|storm|irrigat|water/i },
  { topic: 'Harvest', icon: Sprout, words: /harvest|pick|pods?\b|rows?\b|overdue/i },
  { topic: 'Crop health', icon: Fan, words: /mildew|disease|fungal|fan|ventilat|humid|pest|leaf|leaves/i },
  {
    topic: 'Equipment',
    icon: RadioTower,
    words: /equipment|lora|node|offline|gateway|sensor|battery|pump|led/i,
  },
  { topic: 'Market', icon: Store, words: /market|sell|buyer|surplus|listing|processor|¥|reserv/i },
];

const REF = /\[([^\]]+)\]/g;

/** "Weather (Open-Meteo · 3-day forecast · 17:29)" → "Weather". */
const shortSource = (ref: string) => ref.split(' (')[0].split(' · ')[0].trim();

function tidy(s: string) {
  const t = s
    .replace(REF, '')
    .replace(/[\s,;]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!t) return t;
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/**
 * Splits the advisor's plain-text answer ("headline, then • bullets ending in
 * [references]") into a headline and one row per task.
 */
function parse(text: string): Parsed {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const headLines: string[] = [];
  const notes: string[] = [];
  const items: Item[] = [];

  for (const line of lines) {
    const bullet = /^[•\-*]\s+/.test(line);
    if (!bullet) {
      (items.length ? notes : headLines).push(tidy(line));
      continue;
    }
    const raw = line.replace(/^[•\-*]\s+/, '');
    const sources = [...new Set([...raw.matchAll(REF)].map((m) => shortSource(m[1])))];
    let body = tidy(raw);
    let label = '';
    const m = body.match(/^([^:.]{2,40}):\s+/);
    if (m) {
      label = m[1].trim();
      body = body.slice(m[0].length);
      body = body.charAt(0).toUpperCase() + body.slice(1);
    }
    const match = TOPICS.find((t) => t.words.test(label)) ?? TOPICS.find((t) => t.words.test(body));
    items.push({
      topic: match?.topic ?? (label || 'To do'),
      icon: match?.icon ?? ListChecks,
      text: body,
      sources,
    });
  }

  // Drop a leading "Morning action plan for 26 September 2026:" — the card already says what and when.
  let headline = headLines.join(' ');
  headline = headline.replace(/^[^:]{0,60}\b(plan|briefing|summary|update)\b[^:]*:\s*/i, '');
  headline = headline.charAt(0).toUpperCase() + headline.slice(1);
  return { headline, items, notes };
}

/** The advisor's answer, laid out for reading on a phone: headline, then one row per task. */
export function AdvisorText({ text }: { text: string }) {
  const { headline, items, notes } = parse(text);

  // Nothing bullet-shaped (a short chat reply): show it as plain text.
  if (!items.length) {
    return (
      <Txt variant="bodyLg" color={Colors.textBody}>
        {tidy(text) || 'Done.'}
      </Txt>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {headline ? (
        <Txt variant="heading" style={styles.headline}>
          {headline}
        </Txt>
      ) : null}
      <View>
        {items.map((item, i) => (
          <View key={i}>
            {i > 0 ? <Divider /> : null}
            <TaskRow item={item} />
          </View>
        ))}
      </View>
      {notes.map((n, i) => (
        <Txt key={i} variant="body" color={Colors.textSecondary}>
          {n}
        </Txt>
      ))}
    </View>
  );
}

/** First sentence only, so each task is one short line until the farmer taps it. */
function firstSentence(text: string) {
  const m = text.match(/^.+?[.!?](?=\s|$)/);
  return m ? m[0] : text;
}

function TaskRow({ item }: { item: Item }) {
  const short = firstSentence(item.text);
  const more = short.length < item.text.length || item.sources.length > 0;
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      aria-expanded={open}
      disabled={!more}
      onPress={() => setOpen((o) => !o)}
      style={styles.row}>
      <IconWell icon={item.icon} size={32} radius={10} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="micro" color={Colors.textAccent}>
          {item.topic}
        </Txt>
        <Txt variant="bodyLg" color={Colors.textPrimary} numberOfLines={open ? undefined : 2}>
          {open ? item.text : short}
        </Txt>
        {open && item.sources.length ? (
          <Txt variant="caption" color={Colors.textSecondary}>
            From {item.sources.join(' · ')}
          </Txt>
        ) : null}
      </View>
      {more ? (
        open ? (
          <ChevronUp size={16} color={Colors.textSecondary} strokeWidth={2.5} />
        ) : (
          <ChevronDown size={16} color={Colors.textSecondary} strokeWidth={2.5} />
        )
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headline: { lineHeight: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
});
