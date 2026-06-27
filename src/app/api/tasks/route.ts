import { apiError, apiSuccess } from "@/lib/apiResponse";
import { taskService } from "@/lib/services/taskService";

export async function GET() {
  try {
    const data = await taskService.getAll();

    return apiSuccess(data);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch tasks.",
    );
  }
}
