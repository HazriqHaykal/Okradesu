import {
  Camera,
  Check,
  Cpu,
  Droplets,
  Fan,
  Lightbulb,
  LoaderCircle,
  Moon,
  Timer,
  WifiOff,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { SectionHeader } from '@/components/ui/section-header';
import { Divider, IconWell } from '@/components/ui/surface';
import { Txt } from '@/components/ui/text';
import { Toggle } from '@/components/ui/toggle';
import { Colors, Palette, Radius } from '@/constants/theme';
import {
  DEVICE_RULES,
  LIGHT_SCHEDULE,
  devicesFor,
  type DeviceKey,
  type MonitorFarm,
  type Reading,
} from '@/data/monitor';
import type { CommandState, useDeviceControl } from '@/hooks/use-live-farm';
import type { Weather } from '@/services/weather';

type Control = ReturnType<typeof useDeviceControl>;

export type Effective = { ledOn: boolean; brightness: number; fanOn: boolean; pumpOn: boolean };

const DEVICE_META: Record<DeviceKey, { name: string; icon: LucideIcon }> = {
  pump: { name: 'Irrigation pump', icon: Droplets },
  led: { name: 'LED grow lights', icon: Lightbulb },
  fan: { name: 'Air fans', icon: Fan },
};

const pad = (h: number) => `${String(h).padStart(2, '0')}:00`;

export function SmartControl({
  farm,
  control,
  effective,
  reading,
  hour,
  weather,
}: {
  farm: MonitorFarm;
  control: Control;
  effective: Effective;
  reading: Reading;
  hour: number;
  weather: Weather;
}) {
  const indoor = farm.type === 'indoor';
  return (
    <View style={styles.wrap}>
      {!control.online ? (
        <View style={[styles.note, { backgroundColor: Palette.orange100 }]}>
          <WifiOff size={16} color={Colors.textAccent} strokeWidth={2} />
          <Txt variant="small" color={Colors.textBody} style={{ flex: 1 }}>
            <Txt variant="small" weight={800}>
              Link down.
            </Txt>{' '}
            The controller on site keeps running the auto rules. Commands you send now are queued and
            delivered when the link is back.
          </Txt>
        </View>
      ) : null}

      <SectionHeader title={indoor ? 'Equipment' : 'Irrigation'} />
      <View>
        {devicesFor(farm.type).map((key, i) => (
          <View key={key}>
            {i > 0 ? <Divider /> : null}
            <DeviceRow
              farm={farm}
              device={key}
              control={control}
              effective={effective}
              reading={reading}
              weather={weather}
            />
          </View>
        ))}
      </View>

      {indoor ? (
        <>
          <SectionHeader title="Light schedule" />
          <LightSchedule hour={hour} on={effective.ledOn} />
          <SectionHeader title="Light check" />
          <LightCheck farm={farm} />
          <SectionHeader title="Energy" />
          <EnergyCard farm={farm} />
        </>
      ) : null}

      <View style={[styles.note, { backgroundColor: Colors.surfaceSunken }]}>
        <Cpu size={16} color={Colors.textBody} strokeWidth={2} />
        <Txt variant="small" color={Colors.textBody} style={{ flex: 1 }}>
          <Txt variant="small" weight={800}>
            Runs on the farm.
          </Txt>{' '}
          {indoor ? 'Watering, light and fan rules run' : 'Watering rules run'} on the ESP32 controller, so the
          farm keeps working when the network is down. Your commands travel down through LoRa gateway{' '}
          {farm.gateway}.
        </Txt>
      </View>
    </View>
  );
}

function DeviceRow({
  farm,
  device,
  control,
  effective,
  reading,
  weather,
}: {
  farm: MonitorFarm;
  device: DeviceKey;
  control: Control;
  effective: Effective;
  reading: Reading;
  weather: Weather;
}) {
  const meta = DEVICE_META[device];
  const state = control.devices[device];
  const cmd = control.command[device];
  const on = device === 'pump' ? effective.pumpOn : device === 'led' ? effective.ledOn : effective.fanOn;
  const busy = cmd === 'sending';

  let status: string;
  if (state.auto) {
    status = `Auto · ${DEVICE_RULES[device][farm.type]}`;
  } else if (device === 'led') {
    status = `Manual · ${on ? `on at ${state.level}%` : 'off'}`;
  } else {
    status = `Manual · ${on ? 'on' : 'off'}`;
  }

  return (
    <View style={styles.device}>
      <View style={styles.deviceHead}>
        <IconWell
          icon={meta.icon}
          size={40}
          bg={on ? Colors.accent : Colors.surfaceTint}
          fg={on ? Colors.textOnAccent : Colors.textAccent}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <View style={styles.nameRow}>
            <Txt variant="bodyLg" weight={800}>
              {meta.name}
            </Txt>
            <Txt variant="micro" color={on ? Colors.successFg : Colors.textSecondary}>
              {on ? (device === 'pump' ? 'Watering' : 'On') : 'Off'}
            </Txt>
          </View>
          <Txt variant="small" color={Colors.textSecondary}>
            {status}
          </Txt>
        </View>
        <Toggle
          label={`Automatic control for ${meta.name}`}
          value={state.auto}
          onValueChange={(v) => control.setAuto(device, v)}
        />
      </View>

      {device === 'pump' ? (
        <PumpBody farm={farm} control={control} on={on} reading={reading} weather={weather} />
      ) : (
        <View style={styles.manual}>
          <View style={styles.chips}>
            <Chip
              size="sm"
              label="On"
              selected={on}
              disabled={state.auto || busy}
              onPress={() => control.send(device, { on: true })}
            />
            <Chip
              size="sm"
              label="Off"
              selected={!on}
              disabled={state.auto || busy}
              onPress={() => control.send(device, { on: false })}
            />
            {device === 'led'
              ? [25, 50, 75, 100].map((lvl) => (
                  <Chip
                    key={lvl}
                    size="sm"
                    label={`${lvl}%`}
                    selected={on && effective.brightness === lvl}
                    disabled={state.auto || busy}
                    onPress={() => control.send('led', { on: true, level: lvl })}
                  />
                ))
              : null}
          </View>
          {state.auto ? (
            <Txt variant="caption" color={Colors.textSecondary}>
              Turn off Auto to switch it by hand.
            </Txt>
          ) : null}
        </View>
      )}
      <CommandLine state={cmd} />
    </View>
  );
}

function PumpBody({
  farm,
  control,
  on,
  reading,
  weather,
}: {
  farm: MonitorFarm;
  control: Control;
  on: boolean;
  reading: Reading;
  weather: Weather;
}) {
  const rainSoon = farm.type === 'outdoor' && weather.skipWatering;
  const dry = reading.moisture < 35;
  const last = control.wateredAt
    ? `Last watered at ${new Date(control.wateredAt).toTimeString().slice(0, 5)}`
    : null;
  let hint: string;
  if (on) hint = 'Pump running for 20 s.';
  else if (rainSoon) hint = `Soil is ${Math.round(reading.moisture)}%. ${weather.advice}`;
  else if (dry) hint = `Soil is ${Math.round(reading.moisture)}%, getting dry.`;
  else hint = `Soil is ${Math.round(reading.moisture)}%, no water needed.`;

  return (
    <View style={styles.manual}>
      <Txt variant="small" color={Colors.textBody}>
        {hint}
        {last ? ` ${last}.` : ''}
      </Txt>
      <Button
        label={on ? 'Watering…' : 'Water now · 20 s'}
        icon={on ? Timer : Droplets}
        size="sm"
        variant={on ? 'secondary' : 'primary'}
        disabled={on || control.command.pump === 'sending'}
        onPress={control.waterNow}
      />
    </View>
  );
}

function CommandLine({ state }: { state: CommandState }) {
  if (!state) return null;
  const map: Record<Exclude<CommandState, null>, { icon: LucideIcon; text: string; fg: string }> = {
    sending: { icon: LoaderCircle, text: 'Sending over LoRa…', fg: Colors.textAccent },
    queued: { icon: WifiOff, text: 'Queued · delivered when the link is back', fg: Colors.textAccent },
    done: { icon: Check, text: 'Done · device confirmed', fg: Colors.successFg },
  };
  const m = map[state];
  const Icon = m.icon;
  return (
    <View accessibilityLiveRegion="polite" style={styles.cmd}>
      <Icon size={13} color={m.fg} strokeWidth={2.5} />
      <Txt variant="caption" weight={700} color={m.fg}>
        {m.text}
      </Txt>
    </View>
  );
}

function LightSchedule({ hour, on }: { hour: number; on: boolean }) {
  const { onFrom, onTo, cameraAt } = LIGHT_SCHEDULE;
  const scheduled = (h: number) => h >= onFrom || h < onTo;
  return (
    <Panel>
      <View style={styles.schedHead}>
        <Moon size={14} color={Colors.textAccent} strokeWidth={2} />
        <Txt variant="small" weight={800} style={{ flex: 1 }}>
          14 h on · 10 h off
        </Txt>
        <Txt variant="caption" weight={700} color={on ? Colors.successFg : Colors.textSecondary}>
          {on ? 'Lights on now' : `Next on at ${pad(onFrom)}`}
        </Txt>
      </View>
      <View
        accessible
        accessibilityLabel={`Lights on from ${pad(onFrom)} to ${pad(onTo)}, during cheaper night-time electricity. Current hour ${pad(hour)}.`}
        style={styles.timeline}>
        {Array.from({ length: 24 }, (_, h) => (
          <View
            key={h}
            style={[
              styles.hourCell,
              { backgroundColor: scheduled(h) ? Colors.accent : Colors.surfaceSunken },
              h === hour && styles.hourNow,
            ]}
          />
        ))}
      </View>
      <View style={styles.axis}>
        {['00', '06', '12', '18', '24'].map((l) => (
          <Txt key={l} variant="caption" color={Colors.textSecondary} tabular>
            {l}
          </Txt>
        ))}
      </View>
      <View style={styles.schedHead}>
        <Camera size={14} color={Colors.textSecondary} strokeWidth={2} />
        <Txt variant="caption" color={Colors.textBody} style={{ flex: 1 }}>
          Camera sync · lights go to 100% for the {pad(cameraAt)} snapshot so the AI sees even light.
        </Txt>
      </View>
    </Panel>
  );
}

function LightCheck({ farm }: { farm: MonitorFarm }) {
  const rows = farm.rowLight ?? [];
  const avg = rows.reduce((a, b) => a + b, 0) / (rows.length || 1);
  return (
    <Panel>
      {rows.map((v, i) => {
        const low = v < avg * 0.8;
        const drop = Math.round((1 - v / avg) * 100);
        return (
          <View key={i} style={styles.rowLight}>
            <Txt variant="small" weight={700} style={{ width: 48 }}>
              Row {i + 1}
            </Txt>
            <View style={styles.rowTrack}>
              <View
                style={[
                  styles.rowFill,
                  { width: `${(v / 600) * 100}%`, backgroundColor: low ? Colors.danger : Palette.orange400 },
                ]}
              />
            </View>
            <Txt
              variant="caption"
              weight={low ? 800 : 600}
              color={low ? Colors.dangerFg : Colors.textSecondary}
              tabular
              style={{ width: 72, textAlign: 'right' }}>
              {low ? `${drop}% low` : `${v} µmol`}
            </Txt>
          </View>
        );
      })}
    </Panel>
  );
}

function EnergyCard({ farm }: { farm: MonitorFarm }) {
  const e = farm.energy;
  if (!e) return null;
  return (
    <View style={styles.energy}>
      <Stat icon={Zap} label="Today" value={`${e.kwhToday} kWh`} />
      <Stat icon={Moon} label="Night rate" value={`${e.nightShare}%`} />
      <Stat icon={Check} label="Saved · month" value={`¥${e.savedYen.toLocaleString('en-US')}`} accent />
    </View>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: string; accent?: boolean }) {
  return (
    <View style={[styles.stat, accent && { backgroundColor: Colors.successBg }]}>
      <Icon size={14} color={accent ? Colors.successFg : Colors.textSecondary} strokeWidth={2} />
      <Txt variant="micro" color={accent ? Colors.successFg : Colors.textSecondary}>
        {label}
      </Txt>
      <Txt variant="bodyLg" weight={800} tabular color={accent ? Colors.successFg : Colors.textPrimary}>
        {value}
      </Txt>
    </View>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <View style={styles.panel}>{children}</View>;
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: Radius.md,
  },
  device: { paddingVertical: 12, gap: 10 },
  deviceHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  manual: { gap: 8, paddingLeft: 52 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cmd: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 52 },
  panel: { backgroundColor: Colors.bgApp, borderRadius: Radius.lg, padding: 14, gap: 10 },
  schedHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeline: { flexDirection: 'row', gap: 2, height: 22 },
  hourCell: { flex: 1, borderRadius: 3 },
  hourNow: { borderWidth: 2, borderColor: Colors.textPrimary },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowTrack: {
    flex: 1,
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceSunken,
    overflow: 'hidden',
  },
  rowFill: { height: 8, borderRadius: Radius.pill },
  energy: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    gap: 4,
    padding: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgApp,
  },
});
