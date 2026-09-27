import { Image } from 'expo-image';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Activity, ChevronLeft, RadioTower, SlidersHorizontal, Sun, Warehouse } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DemoTrigger } from '@/components/monitor/demo-panel';
import { FarmMonitor } from '@/components/monitor/farm-monitor';
import { SmartControl, type Effective } from '@/components/monitor/smart-control';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { IconButton } from '@/components/ui/button';
import { Segmented } from '@/components/ui/chip';
import { InfoStat } from '@/components/ui/section-header';
import { Txt } from '@/components/ui/text';
import { Colors, Palette, Radius, Shadow, TabBarSpace } from '@/constants/theme';
import { useFarm } from '@/hooks/use-farms';
import { lightsScheduledOn, useDeviceControl, useLiveFarm } from '@/hooks/use-live-farm';
import { useWeather } from '@/hooks/use-weather';

type View_ = 'monitor' | 'control';

/** 3D overview of how a field is wired up: sensors, gateway, climate station and camera. */
const SCENES = {
  indoor: { source: require('@/assets/images/farm-indoor.webp'), ratio: 1100 / 793 },
  outdoor: { source: require('@/assets/images/farm-outdoor.webp'), ratio: 1182 / 847 },
};

export default function FarmDetailScreen() {
  const { id, view } = useLocalSearchParams<{ id: string; view?: View_ }>();
  const farm = useFarm(id);
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<View_>(view === 'control' ? 'control' : 'monitor');
  const control = useDeviceControl(farm);
  const { weather } = useWeather();
  const outdoor = farm.type === 'outdoor';

  const hourNow = new Date().getHours();
  const { led, fan, pump } = control.devices;
  const effective: Effective = {
    ledOn: led.auto ? lightsScheduledOn(hourNow) : led.on,
    brightness: led.auto ? 100 : led.level,
    fanOn: fan.auto ? farm.base.humidity > 75 : fan.on,
    pumpOn: pump.on,
  };
  const live = useLiveFarm(farm, {
    ledOn: effective.ledOn,
    brightness: effective.brightness,
    fanOn: !outdoor && effective.fanOn,
    wateredAt: control.wateredAt,
  });

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.topRow}>
        <IconButton icon={ChevronLeft} label="Back" onPress={goBack} />
      </View>
      <View style={styles.renderWrap}>
        <View style={styles.scene}>
          <Image
            source={SCENES[outdoor ? 'outdoor' : 'indoor'].source}
            style={{ width: '100%', aspectRatio: SCENES[outdoor ? 'outdoor' : 'indoor'].ratio }}
            contentFit="contain"
            accessibilityLabel={`${farm.name} setup: LoRa gateway, soil sensor, climate station and camera with edge AI${outdoor ? '' : ' under a greenhouse roof'}.`}
          />
        </View>
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + TabBarSpace }]}>
        <View style={styles.titleRow}>
          <View style={{ flexShrink: 1, gap: 6 }}>
            <DemoTrigger>
              <Txt variant="title" accessibilityRole="header">
                {farm.name}
              </Txt>
            </DemoTrigger>
            <Badge
              label={outdoor ? 'Outdoor · basic' : 'Indoor · premium'}
              tone="neutral"
              icon={outdoor ? Sun : Warehouse}
            />
          </View>
          {farm.status === 'online' ? (
            <Badge label="Online" tone="success" icon={RadioTower} />
          ) : (
            <Badge label="Local mode" tone="accent" icon={RadioTower} />
          )}
        </View>

        <View style={styles.facts}>
          <InfoStat label={outdoor ? 'Plot' : 'Building'} value={farm.building} />
          <InfoStat label="Plants" value={`${farm.plants} · day ${farm.day}`} />
          <InfoStat label="Last sync" value={farm.lastSync} />
        </View>

        <View style={styles.harvestRow}>
          <Txt variant="body" weight={700}>
            {farm.podsReady} pods ready · {farm.newFlowers} new flowers
          </Txt>
          {farm.inHarvest ? (
            <Link href={{ pathname: '/harvest', params: { farm: farm.id } }} style={styles.link}>
              <Txt variant="small" weight={600} color={Colors.textAccent}>
                See Map
              </Txt>
            </Link>
          ) : null}
        </View>

        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'monitor', label: 'Farm Monitor', icon: Activity },
            { value: 'control', label: 'Smart Control', icon: SlidersHorizontal },
          ]}
        />

        {tab === 'monitor' ? (
          <FarmMonitor farm={farm} live={live} lightsOn={outdoor || effective.ledOn} weather={weather} />
        ) : (
          <SmartControl
            farm={farm}
            control={control}
            effective={effective}
            reading={live.reading}
            hour={live.hour}
            weather={weather}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0, paddingBottom: 0, gap: 0, flexGrow: 1 },
  topRow: { paddingHorizontal: 24, flexDirection: 'row' },
  renderWrap: { paddingHorizontal: 24, paddingTop: 12 },
  // Same cream as the render's own background, so its edges disappear.
  scene: { backgroundColor: '#F5F2E9', borderRadius: Radius.xl, overflow: 'hidden', boxShadow: Shadow.card },
  sheet: {
    flexGrow: 1,
    marginTop: 20,
    backgroundColor: Colors.surfaceCard,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    paddingTop: 24,
    paddingHorizontal: 24,
    gap: 16,
    boxShadow: Shadow.float,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  facts: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  harvestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingLeft: 14,
    paddingRight: 8,
    minHeight: 46,
    borderRadius: Radius.md,
    backgroundColor: Palette.leaf100,
  },
  link: { paddingVertical: 14, paddingHorizontal: 6 },
});
