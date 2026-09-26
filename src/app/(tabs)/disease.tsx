import { Bell, MessageCircle, Send } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CropScanner } from '@/components/crop-scanner';
import { Screen } from '@/components/screen';
import { IconButton } from '@/components/ui/button';
import { SearchField } from '@/components/ui/search-field';
import { ScreenTitle } from '@/components/ui/section-header';
import { Card } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Radius } from '@/constants/theme';

export default function DiseaseScreen() {
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState<string[]>([]);

  const ask = () => {
    const q = question.trim();
    if (!q) return;
    setAsked((list) => [...list, q]);
    setQuestion('');
  };

  return (
    <Screen>
      <ScreenTitle
        kicker="Leaf camera · disease risk"
        title="Disease"
        right={<IconButton icon={Bell} label="Alerts, 2 new" href="/alerts" dot />}
      />

      <CropScanner />

      {asked.map((q, i) => (
        <View key={i} style={{ gap: 8 }}>
          <View style={styles.bubbleMe}>
            <Txt variant="body" weight={600}>
              {q}
            </Txt>
          </View>
          <Card style={styles.bubbleAi}>
            <Txt variant="body" color={Colors.textBody}>
              Thanks — we&apos;re checking this against today&apos;s sensor readings and camera scans. The
              answer will appear here and in LINE.
            </Txt>
          </Card>
        </View>
      ))}

      <View style={styles.askRow}>
        <SearchField
          icon={MessageCircle}
          label="Ask the advisor"
          placeholder="Ask about your farm"
          value={question}
          onChangeText={setQuestion}
          onSubmitEditing={ask}
          returnKeyType="send"
        />
        <IconButton icon={Send} label="Send question" variant="accent" size={46} onPress={ask} />
      </View>
    </Screen>
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
  bubbleAi: { maxWidth: '90%', padding: 14, borderBottomLeftRadius: 6 },
  askRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
