import { apiError, apiSuccess } from "@/lib/apiResponse";
import { projectService } from "@/lib/services/projectService";

type CreateProjectRequest = {
  name?: unknown;
  description?: unknown;
  platformId?: unknown;
  language?: unknown;
  status?: unknown;
  coverMediaId?: unknown;
};

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(value: unknown) {
  const text = readString(value);

  return text.length > 0 ? text : null;
}

export async function GET() {
  try {
    const data = await projectService.getAll();

    return apiSuccess(data);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch projects.",
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateProjectRequest;
    const name = readString(body.name);
    const platformId = readString(body.platformId);

    if (!name) {
      return apiError("name is required.", 400);
    }

    if (!platformId) {
      return apiError("platformId is required.", 400);
    }

    const data = await projectService.create({
      name,
      description: readOptionalString(body.description),
      platformId,
      language: readString(body.language) || "en",
      status: readString(body.status) || "Draft",
      coverMediaId: readOptionalString(body.coverMediaId),
    });

    return apiSuccess(data);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to create project.",
    );
  }
}
