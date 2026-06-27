import { apiError, apiSuccess } from "@/lib/apiResponse";
import { aiGenerationService } from "@/lib/services/aiGenerationService";

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readCount(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = readString(body.projectId);
    const productId = readString(body.productId);
    const prompt = readString(body.prompt);

    if (!projectId) {
      return apiError("projectId is required.", 400);
    }

    if (!productId) {
      return apiError("productId is required.", 400);
    }

    if (!prompt) {
      return apiError("prompt is required.", 400);
    }

    const result = await aiGenerationService.generate({
      projectId,
      productId,
      mediaId: readString(body.mediaId) || undefined,
      prompt,
      model: readString(body.model) || undefined,
      platform: readString(body.platform) || undefined,
      size: readString(body.size) || undefined,
      quality: readString(body.quality) || undefined,
      count: readCount(body.count),
    });

    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
