import { apiError, apiSuccess } from "@/lib/apiResponse";
import { mediaService } from "@/lib/services/mediaService";

export async function GET() {
  try {
    const data = await mediaService.getAll();

    return apiSuccess(data);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch media.",
    );
  }
}
