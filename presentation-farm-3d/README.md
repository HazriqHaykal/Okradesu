# Okradesu — The connected field

A standalone, interactive 3D okra farm for a presentation or screen recording. It is independent of the Expo mobile app. All graphics, fonts and runtime code are included locally.

## Open the demo

Double-click **OPEN-DEMO.cmd**, or open **index.html** in Chrome or Edge. No installation, server, account or internet connection is required. The browser needs WebGL 2 / hardware acceleration.

Alternatively, run `node serve.mjs` from this folder and open http://127.0.0.1:4175.

## Record for your slides

1. Open the demo in a desktop browser, preferably at 1920 × 1080.
2. Press **F** for full screen, then **Restart** to return to the beginning.
3. Choose **Recording view** (or press **H**). This hides the controls and readings panel while retaining the chapter captions and equipment labels.
4. Start your screen recorder, then press **Space** to play the guided tour.
5. Record the 70-second tour and a few seconds of the final harvest view. There is no audio; add your own narration in the presentation.

Move the pointer away from the bottom-right corner to keep the controls hidden. Press **H** to restore them. You can also hide labels before recording or record individual chapters.

## The guided story

| Time | Scene | What it explains |
| --- | --- | --- |
| 00:00–00:10 | The field | An overview of the connected okra farm |
| 00:10–00:20 | Sense | Solar-powered soil and climate monitoring |
| 00:20–00:30 | Connect | Sensor readings moving through the LoRa gateway |
| 00:30–00:40 | Water | A local irrigation rule and animated drip lines |
| 00:40–00:50 | See | A camera and edge computer estimating flowers and pods |
| 00:50–01:00 | Keep going | Internet outage, local control, buffering and reconnection |
| 01:00–01:10 | Harvest | Crop counts informing harvest planning and sales |

This is a **concept simulation**, using illustrative readings and accelerated time. The hardware layout, thresholds, counts and automation are presentation examples, not a physical installation specification or a claim that every illustrated capability is implemented in the mobile app. No Supabase, AI service or real sensors are contacted.

## Explore

- Drag to rotate; scroll to zoom.
- Click equipment or a label to read its role.
- **Space** plays/pauses the tour; **← / →** change chapters; **F** toggles full screen; **H** toggles recording view.
- **Orbit** starts a slow rotating view. Manual camera interaction pauses the guided tour.
- **Labels** toggles equipment labels. Labels automatically hide when they collide with captions or one another.
- **Export 3D** downloads the static farm model as GLB. Browser captions, lighting environment, water/data effects and tour animation are not included. Use the browser recording for the full animated experience.

## Ready-made assets

- `exports/presentation-view.png` — a 1920 × 1080 overview for a slide.
- `exports/irrigation-presentation.png` — a 1920 × 1080 irrigation scene.
- `exports/okradesu-connected-field.glb` — the exported 3D farm, suitable for Blender or a glTF-compatible viewer. Plant geometry uses glTF instancing; compatibility with presentation software varies.
- `exports/verification.json` — browser verification results.

## Editing and verification

`farm.mjs` builds the geometry, equipment, animation and interactions. `simulation.mjs` holds chapter text, camera positions and illustrative readings. `styles.css` controls the presentation layout.

The checked-in `farm.bundle.js` runs immediately. After editing source, rebuild it:

```powershell
cd presentation-farm-3d
npm install
npm run build
npm start
```

In another terminal in this folder, run `npm run check`. It uses an installed Chrome browser to verify chapters, scenario rules, controls, labels, model export, responsive layout and direct offline launch, and refreshes the exported images/model. Existing workspace development tools can also be used without a separate install.

The model uses locally vendored [Three.js r180](https://github.com/mrdoob/three.js/tree/r180) under its MIT license (`vendor/THREE-LICENSE.txt`). The local Manrope fonts include their license in `fonts/LICENSE.txt`.
