/**
 * ESP32-CAM connection settings for the Disease tab's live camera.
 *
 * Not connected yet. To turn the live view on, set ESP32_CAMERA_URL to the
 * board's base address as printed in its serial monitor, e.g. 'http://<board-ip>'.
 * While it is null the app shows an "ESP32-CAM not connected" state.
 */
export const ESP32_CAMERA_URL = null as string | null;

/** Single-frame JPEG endpoint on the board (`/capture` in the stock CameraWebServer sketch). */
export const ESP32_CAPTURE_PATH = '/capture';

/** How often the live view pulls a new frame from the board. */
export const ESP32_FRAME_INTERVAL_MS = 1000;

export const isEsp32Configured = () => ESP32_CAMERA_URL !== null && ESP32_CAMERA_URL.trim() !== '';

/** URL for a fresh frame; the timestamp keeps caches from returning an old one. */
export function esp32FrameUrl(): string | null {
  if (!isEsp32Configured()) return null;
  return `${ESP32_CAMERA_URL!.trim().replace(/\/+$/, '')}${ESP32_CAPTURE_PATH}?t=${Date.now()}`;
}
