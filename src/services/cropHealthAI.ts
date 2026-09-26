import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

const API_PORT = 8000;
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Where the FastAPI server lives. In order:
 * 1. EXPO_PUBLIC_CROP_HEALTH_API_URL, if set (e.g. in .env.local).
 * 2. Android emulator: always 10.0.2.2 (the emulator's alias for the PC).
 * 3. Physical phone: the PC's LAN address that Metro is served from, since
 *    10.0.2.2 doesn't exist outside the emulator.
 * 4. 10.0.2.2 on Android, localhost elsewhere.
 */
function resolveApiUrl(): string {
  const override = process.env.EXPO_PUBLIC_CROP_HEALTH_API_URL?.trim();
  if (override) return override.replace(/\/+$/, "");

  if (Platform.OS === "android" && !Device.isDevice) {
    return `http://10.0.2.2:${API_PORT}`;
  }

  const devHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (Device.isDevice && devHost && devHost !== "localhost" && devHost !== "127.0.0.1") {
    return `http://${devHost}:${API_PORT}`;
  }

  return Platform.OS === "android"
    ? `http://10.0.2.2:${API_PORT}`
    : `http://localhost:${API_PORT}`;
}

const API_URL = resolveApiUrl();

export type CropHealthResult = {
  success: boolean;
  visual_status: "healthy" | "disease_detected" | "uncertain";
  visual_result: string;
  confidence: number;
  confidence_threshold: number;
  detections: Array<{
    class_id: number;
    class_name: string;
    confidence: number;
    bbox: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };
  }>;
  detection_count: number;
};

export type CropHealthErrorKind =
  | "no_image"
  | "network"
  | "timeout"
  | "http"
  | "invalid_response";

export class CropHealthError extends Error {
  constructor(
    readonly kind: CropHealthErrorKind,
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "CropHealthError";
  }
}

function mimeTypeFor(uri: string): { name: string; type: string } {
  const ext = uri.split("?")[0].split(".").pop()?.toLowerCase();
  if (ext === "png") return { name: "leaf.png", type: "image/png" };
  if (ext === "webp") return { name: "leaf.webp", type: "image/webp" };
  if (ext === "heic" || ext === "heif") return { name: `leaf.${ext}`, type: `image/${ext}` };
  return { name: "leaf.jpg", type: "image/jpeg" };
}

function isCropHealthResult(body: unknown): body is CropHealthResult {
  const r = body as Partial<CropHealthResult> | null;
  return (
    !!r &&
    typeof r === "object" &&
    typeof r.visual_status === "string" &&
    typeof r.confidence === "number" &&
    Array.isArray(r.detections)
  );
}

/**
 * Uses XMLHttpRequest, not fetch: since SDK 57 the global fetch is expo/fetch,
 * which rejects React Native's { uri, name, type } file parts with
 * "Unsupported FormDataPart implementation". XHR goes through React Native's
 * networking module, which streams the file from its URI.
 */
function postFormData(
  url: string,
  body: FormData
): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.timeout = REQUEST_TIMEOUT_MS;
    xhr.onload = () => resolve({ status: xhr.status, text: xhr.responseText ?? "" });
    xhr.onerror = () => {
      console.warn(`[cropHealthAI] POST ${url} failed: network error`);
      reject(new CropHealthError("network", `Network request to ${url} failed`));
    };
    xhr.ontimeout = () => {
      console.warn(`[cropHealthAI] POST ${url} failed: timed out after ${REQUEST_TIMEOUT_MS}ms`);
      reject(new CropHealthError("timeout", `Request timed out after ${REQUEST_TIMEOUT_MS}ms`));
    };
    xhr.send(body);
  });
}

export async function analyzeCropHealth(
  imageUri: string
): Promise<CropHealthResult> {
  if (!imageUri || !/^(file|content|ph|assets-library|https?):/i.test(imageUri)) {
    throw new CropHealthError("no_image", `Invalid image URI: ${imageUri}`);
  }

  const formData = new FormData();

  formData.append("file", {
    uri: imageUri,
    ...mimeTypeFor(imageUri),
  } as any);

  const url = `${API_URL}/predict`;
  const { status, text } = await postFormData(url, formData);

  if (status < 200 || status >= 300) {
    console.warn(`[cropHealthAI] POST ${url} → HTTP ${status}:`, text.slice(0, 500));
    throw new CropHealthError(
      "http",
      `Crop health API error: ${status}`,
      status
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = undefined;
  }
  if (!isCropHealthResult(body)) {
    console.warn(`[cropHealthAI] Unexpected response from ${url}:`, text.slice(0, 500));
    throw new CropHealthError("invalid_response", "Unexpected response from Crop Health API");
  }

  return body;
}
