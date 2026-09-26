/** Presentation-only data: accelerated, illustrative, never connected to hardware. */
export const DURATION = 10;
export const CHAPTERS = [
  { name: 'The field', category: 'THE BIG PICTURE', title: 'A small field.<br>A connected future.', description: 'Every reading becomes a decision. Explore how an okra field looks after itself, from soil to harvest.', note: 'OUTDOOR FARM · BASIC TIER', position: [20, 18, 23], target: [0, 0, 0] },
  { name: 'Sense', category: '01 — FARM MONITOR', title: 'Listen to<br>the soil.', description: 'Solar-powered ESP32 nodes measure moisture, pH and nutrients. A climate station watches temperature, humidity and light.', note: 'MOISTURE BELOW 30% → DRY-SOIL ALERT', position: [8, 12, 19], target: [-1.5, .6, .3] },
  { name: 'Connect', category: '02 — THE LORA NETWORK', title: 'Small signals.<br>A shared network.', description: 'Readings travel from the field to a shared LoRa gateway. The gateway sends them to the farm dashboard when internet is available.', note: 'SENSOR → LORA → GATEWAY → DASHBOARD', position: [13, 14, 23], target: [-2, 1, 1] },
  { name: 'Water', category: '03 — SMART CONTROL', title: 'Water where<br>it matters.', description: 'Dry soil triggers the local irrigation rule. The pump feeds drip lines at the roots, then stops as moisture recovers.', note: '20-SECOND PUMP CYCLE · SHOWN AT 2× SPEED', position: [15, 19, 17], target: [-1.2, 0, .5] },
  { name: 'See', category: '04 — EDGE AI', title: 'See the crop.<br>Pick at its best.', description: 'A fixed camera and an edge computer count flowers and ready pods. Compact results travel over LoRa; images use Wi-Fi when available.', note: 'ILLUSTRATIVE SCAN · 12 READY PODS · 8 FLOWERS', position: [18, 13, 17], target: [1, 1, -1] },
  { name: 'Keep going', category: '05 — BUILT FOR RURAL LIFE', title: 'Internet down.<br>Farm still running.', description: 'The gateway buffers readings during an internet outage. Local irrigation continues independently, then saved readings upload after reconnection.', note: 'LOCAL CONTROL · STORE AND FORWARD', position: [19, 16, 23], target: [-.7, .5, 0] },
  { name: 'Harvest', category: '06 — MARKET INTELLIGENCE', title: 'Every okra connected.<br>Every harvest sold.', description: 'Crop counts inform the harvest plan and yield forecast. Growers can offer the coming harvest and surplus to nearby buyers.', note: 'MONITOR → CONTROL → HARVEST → SELL', position: [22, 19, 23], target: [0, .2, 0] },
];

export function sampleState(chapter, elapsed) {
  const p = Math.min(1, Math.max(0, elapsed / DURATION));
  let moisture = 42, pump = false, scan = false, internet = true, buffered = 0;
  if (chapter === 1) moisture = 42 - 18 * Math.min(1, p * 1.5);
  if (chapter === 2) moisture = 24;
  if (chapter === 3) { moisture = 24 + 17 * p; pump = p < .94; }
  if (chapter === 4) scan = true;
  if (chapter === 5) { internet = p >= .72; buffered = internet ? Math.max(0, Math.round(36 * (1 - (p - .72) / .25))) : Math.floor(p * 50); pump = p < .6; moisture = 29 + 12 * p; }
  return { moisture, pump, scan, internet, buffered, dry: moisture < 30, progress: p };
}
