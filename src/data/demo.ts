/**
 * Demo mode: presenter-only switches that push the simulated farms into the
 * tabletop scenarios, in case a real sensor misbehaves on stage. Open the
 * panel by long-pressing the title on Home or on a farm page.
 */
import { useSyncExternalStore } from 'react';

export type DemoState = {
  /** Field A soil drops to 24%. */
  drySoil: boolean;
  /** Gymnasium humidity jumps to 88%, so its fans switch on. */
  humid: boolean;
  /** 72 mm of rain tomorrow: landslide and flood alerts. */
  heavyRain: boolean;
  /** Every farm loses the LoRa gateway and buffers readings. */
  gatewayDown: boolean;
  /** Extra ready pods the camera found at Field A. */
  newPods: number;
};

export const DEMO_OFF: DemoState = {
  drySoil: false,
  humid: false,
  heavyRain: false,
  gatewayDown: false,
  newPods: 0,
};

let state: DemoState = DEMO_OFF;
const listeners = new Set<() => void>();

export function setDemo(patch: Partial<DemoState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const resetDemo = () => setDemo(DEMO_OFF);

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useDemo() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

export const demoActive = (d: DemoState) =>
  d.drySoil || d.humid || d.heavyRain || d.gatewayDown || d.newPods > 0;
