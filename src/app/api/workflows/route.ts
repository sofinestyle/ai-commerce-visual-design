import { apiError, apiSuccess } from "@/lib/apiResponse";
import { workflowService } from "@/lib/services/workflowService";

export async function GET() {
  try {
    const data = await workflowService.getAll();

    return apiSuccess(data);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch workflows.",
    );
  }
}
