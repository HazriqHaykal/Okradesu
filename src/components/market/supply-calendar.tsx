import { Sun, Warehouse } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { SUPPLY_MONTHS } from '@/constants/market';
import { Colors, Radius } from '@/constants/theme';
import { FARMS } from '@/data/farms';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Year-round supply: outdoor fields in summer, indoor rooms in the off-season. */
export function SupplyCalendar({ month }: { month: number }) {
  const outdoor = FARMS.filter((f) => f.kind === 'outdoor').length;
  const indoor = FARMS.length - outdoor;
  return (
    <Card style={styles.card}>
      <Txt variant="small" color={Colors.textSecondary}>
        {outdoor} outdoor fields supply the summer, {indoor} indoor rooms keep okra coming in the off-season, when
        prices are higher.
      </Txt>
      <View style={styles.grid}>
        {MONTHS.map((name, i) => {
          const m = i + 1;
          const now = m === month;
          const out = (SUPPLY_MONTHS.outdoor as readonly number[]).includes(m);
          const inn = (SUPPLY_MONTHS.indoor as readonly number[]).includes(m);
          return (
            <View
              key={name}
              accessible
              accessibilityLabel={`${name}: ${[out && 'outdoor', inn && 'indoor'].filter(Boolean).join(' and ')}${now ? ', this month' : ''}`}
              style={[styles.cell, now && styles.now]}>
              <Txt variant="small" weight={800}>
                {name}
                {now ? <Txt variant="caption" color={Colors.textAccent}> · now</Txt> : null}
              </Txt>
              {out ? <Badge label="Outdoor" tone="accent" icon={Sun} /> : null}
              {inn ? <Badge label="Indoor" tone="neutral" icon={Warehouse} /> : null}
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    flexBasis: '30%',
    flexGrow: 1,
    minHeight: 84,
    padding: 10,
    gap: 6,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgApp,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  now: { borderColor: Colors.accent, backgroundColor: Colors.surfaceTint },
});
