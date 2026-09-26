const API_URL = "http://10.0.2.2:8000";

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

export async function analyzeCropHealth(
  imageUri: string
): Promise<CropHealthResult> {
  const formData = new FormData();

  formData.append("file", {
    uri: imageUri,
    name: "leaf.jpg",
    type: "image/jpeg",
  } as any);

  const response = await fetch(`${API_URL}/predict`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      `Crop health API error: ${response.status}`
    );
  }

  return response.json();
}