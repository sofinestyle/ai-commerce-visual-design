import { apiError, apiSuccess } from "@/lib/apiResponse";
import { generationHistoryService } from "@/lib/services/generationHistoryService";

export async function GET() {
  try {
    const data = await generationHistoryService.getAll();

    return apiSuccess(data);
  } catch (error) {
    return apiError(
      error instanceof Error
        ? error.message
        : "Failed to fetch generation history.",
    );
  }
}
