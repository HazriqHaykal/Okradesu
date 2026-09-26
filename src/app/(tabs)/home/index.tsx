import { router } from 'expo-router';
import {
  ArrowRight,
  Bell,
  Clock,
  LayoutDashboard,
  MapPin,
  RadioTower,
  Search,
  SlidersHorizontal,
  Sprout,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { Button, IconButton } from '@/components/ui/button';
import { SearchField } from '@/components/ui/search-field';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, IconWell } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Colors, Radius, Shadow } from '@/constants/theme';
import { FARMS, FARMS_ONLINE, LAST_SCAN, TOTAL_PODS_TODAY, type Farm } from '@/data/farms';

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const farms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FARMS;
    return FARMS.filter((f) => `${f.name} ${f.place} ${f.building}`.toLowerCase().includes(q));
  }, [query]);
  const offline = FARMS.filter((f) => f.status === 'local');

  return (
    <Screen contentStyle={{ gap: 0 }}>
      <View style={styles.topRow}>
        <View style={styles.location}>
          <MapPin size={14} color={Colors.accent} strokeWidth={2} />
          <Txt variant="small" weight={600}>
            Hinode · {FARMS.length} farms
          </Txt>
        </View>
        <View style={styles.topActions}>
          <IconButton icon={LayoutDashboard} label="Open web dashboard" href="/dashboard" />
          <IconButton icon={Bell} label="Alerts, 2 new" href="/alerts" dot />
        </View>
      </View>

      <View style={styles.brand}>
        <Txt variant="display" align="center">
          Connected Okra
        </Txt>
        <Txt variant="micro" color={Colors.textSecondary}>
          Last camera scan
        </Txt>
        <View style={styles.time}>
          <Clock size={13} color={Colors.textPrimary} strokeWidth={2} />
          <Txt variant="small" weight={800} tabular>
            {LAST_SCAN}
          </Txt>
        </View>
      </View>

      <View style={styles.search}>
        <SearchField
          icon={Search}
          trailingIcon={SlidersHorizontal}
          label="Search farms"
          placeholder="Search farms or buildings"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
      </View>

      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={{ gap: 6 }}>
            <Txt variant="micro">Ready to pick today</Txt>
            <Txt variant="displayXl">{TOTAL_PODS_TODAY} pods</Txt>
          </View>
          <Badge label={`${FARMS.length} farms`} tone="neutral" />
        </View>
        <Txt variant="body" weight={500}>
          Best picked before 11:00, while pods are under 10 cm. 12 more turn ready tomorrow.
        </Txt>
        <Button
          label="Open harvest map"
          variant="surface"
          size="md"
          icon={ArrowRight}
          block
          href="/harvest"
        />
      </View>

      <Card style={styles.network}>
        <IconWell icon={RadioTower} size={36} radius={Radius.sm} />
        <Txt variant="small" color={Colors.textBody} style={{ flex: 1 }}>
          <Txt variant="small" weight={800}>
            LoRa network
          </Txt>{' '}
          · {FARMS_ONLINE} of {FARMS.length} farms online.
          {offline.length > 0
            ? ` ${offline.map((f) => f.name).join(', ')} is running on its own controller.`
            : ''}
        </Txt>
      </Card>

      <View style={styles.section}>
        <SectionHeader title="Browse by Farm" />
        <View style={styles.tiles}>
          {FARMS.map((f) => (
            <FarmTile key={f.id} farm={f} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Your Farms" />
        {farms.length === 0 ? (
          <Txt variant="body" color={Colors.textSecondary}>
            No farms match “{query}”.
          </Txt>
        ) : (
          <View style={styles.grid}>
            {farms.map((f) => (
              <FarmCard key={f.id} farm={f} />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const openFarm = (farm: Farm) => router.push({ pathname: '/home/farm/[id]', params: { id: farm.id } });

function FarmTile({ farm }: { farm: Farm }) {
  const Icon = farm.icon;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Open ${farm.name}`}
      onPress={() => openFarm(farm)}
      style={styles.tile}>
      {({ pressed }) => (
        <>
          <View
            style={[
              styles.tileBox,
              pressed && { boxShadow: `0px 0px 0px 2px ${Colors.accent}, ${Shadow.glow}` },
            ]}>
            <View style={styles.tileWell}>
              <Icon size={20} color={Colors.textAccent} strokeWidth={2} />
            </View>
          </View>
          <Txt variant="caption" weight={600} numberOfLines={1}>
            {farm.name}
          </Txt>
        </>
      )}
    </Pressable>
  );
}

function FarmCard({ farm }: { farm: Farm }) {
  const Icon = farm.icon;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${farm.name}, ${farm.place}, ${farm.podsReady} pods ready`}
      onPress={() => openFarm(farm)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.cardWell}>
        <Icon size={40} color={Colors.textAccent} strokeWidth={1.75} />
        <View style={styles.cardBadge}>
          {farm.risk ? (
            <Badge label={farm.risk} tone="danger" />
          ) : farm.status === 'online' ? (
            <Badge label="Online" tone="success" />
          ) : (
            <Badge label="Local mode" tone="accent" />
          )}
        </View>
      </View>
      <View style={styles.cardRow}>
        <Txt variant="bodyLg" weight={800} numberOfLines={1} style={{ flexShrink: 1 }}>
          {farm.name}
        </Txt>
        <View style={styles.pods}>
          <Sprout size={12} color={Colors.accent} strokeWidth={2} />
          <Txt variant="caption" weight={700} tabular>
            {farm.podsReady}
          </Txt>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <MapPin size={12} color={Colors.textSecondary} strokeWidth={2} />
        <Txt variant="caption" color={Colors.textSecondary} numberOfLines={1} style={{ flexShrink: 1 }}>
          {farm.place}
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topActions: { flexDirection: 'row', gap: 8 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  brand: { alignItems: 'center', gap: 6, marginTop: 4 },
  time: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  search: { marginTop: 20, flexDirection: 'row' },
  hero: {
    marginTop: 24,
    backgroundColor: Colors.accent,
    borderRadius: Radius.xl,
    padding: 20,
    gap: 12,
    boxShadow: Shadow.glow,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  network: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    boxShadow: Shadow.tile,
  },
  section: { marginTop: 24, gap: 12 },
  tiles: { flexDirection: 'row', justifyContent: 'space-between' },
  tile: { alignItems: 'center', gap: 6, width: 72 },
  tileBox: {
    width: 54,
    height: 54,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceCard,
    boxShadow: Shadow.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileWell: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    padding: 8,
    gap: 6,
    boxShadow: Shadow.card,
  },
  cardPressed: { boxShadow: Shadow.float, transform: [{ translateY: -2 }] },
  cardWell: {
    height: 104,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadge: { position: 'absolute', top: 6, left: 6 },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  pods: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 2, paddingBottom: 2 },
});
