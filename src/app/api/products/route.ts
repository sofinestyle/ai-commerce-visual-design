import { apiError, apiSuccess } from "@/lib/apiResponse";
import { productService } from "@/lib/services/productService";

type CreateProductRequest = {
  projectId?: unknown;
  brandId?: unknown;
  platformId?: unknown;
  name?: unknown;
  sku?: unknown;
  category?: unknown;
  language?: unknown;
  description?: unknown;
  status?: unknown;
  tags?: unknown;
};

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(value: unknown) {
  const text = readString(value);

  return text.length > 0 ? text : null;
}

function readTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export async function GET() {
  try {
    const data = await productService.getAll();

    return apiSuccess(data);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch products.",
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateProductRequest;
    const projectId = readString(body.projectId);
    const brandId = readString(body.brandId);
    const platformId = readString(body.platformId);
    const name = readString(body.name);
    const sku = readString(body.sku);

    if (!projectId) {
      return apiError("projectId is required.", 400);
    }

    if (!brandId) {
      return apiError("brandId is required.", 400);
    }

    if (!platformId) {
      return apiError("platformId is required.", 400);
    }

    if (!name) {
      return apiError("name is required.", 400);
    }

    if (!sku) {
      return apiError("sku is required.", 400);
    }

    const data = await productService.create({
      projectId,
      brandId,
      platformId,
      name,
      sku,
      category: readString(body.category),
      language: readString(body.language) || "en",
      description: readOptionalString(body.description),
      status: readString(body.status) || "Draft",
      tags: readTags(body.tags),
    });

    return apiSuccess(data);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to create product.",
    );
  }
}
