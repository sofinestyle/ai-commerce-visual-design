import { apiError, apiSuccess } from "@/lib/apiResponse";
import { imageAnalysisService } from "@/lib/services/imageAnalysisService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mediaId = typeof body.mediaId === "string" ? body.mediaId.trim() : "";

    if (!mediaId) {
      return apiError("mediaId is required.", 400);
    }

    const result = await imageAnalysisService.analyze(mediaId);

    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
