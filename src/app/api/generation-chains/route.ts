import { requireUserApiResponse } from "@/lib/auth/requestAuth";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import { generationChainService } from "@/lib/services/generationChainService";

function readSearchParam(request: Request, key: string) {
  const value = new URL(request.url).searchParams.get(key);

  return value?.trim() || undefined;
}

export async function GET(request: Request) {
  const authError = await requireUserApiResponse();

  if (authError) {
    return authError;
  }

  try {
    const data = await generationChainService.getAll({
      generationGroupId: readSearchParam(request, "generationGroupId"),
      projectId: readSearchParam(request, "projectId"),
      sku: readSearchParam(request, "sku"),
    });

    return apiSuccess(data);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch generation chains.",
    );
  }
}
