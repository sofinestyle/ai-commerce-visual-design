import { apiError, apiSuccess } from "@/lib/apiResponse";
import { promptService } from "@/lib/services/promptService";

export async function GET() {
  try {
    const data = await promptService.getAll();

    return apiSuccess(data);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch prompts.",
    );
  }
}
