import { apiError, apiSuccess } from "@/lib/apiResponse";
import { platformService } from "@/lib/services/platformService";

export async function GET() {
  try {
    const data = await platformService.getAll();

    return apiSuccess(data);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch platforms.",
    );
  }
}
