import { apiError, apiSuccess } from "@/lib/apiResponse";
import { brandService } from "@/lib/services/brandService";

export async function GET() {
  try {
    const data = await brandService.getAll();

    return apiSuccess(data);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch brands.",
    );
  }
}
