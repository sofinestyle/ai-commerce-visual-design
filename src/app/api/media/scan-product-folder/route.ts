import { apiError, apiSuccess } from "@/lib/apiResponse";
import { requireUserApiResponse } from "@/lib/auth/requestAuth";
import { prisma } from "@/lib/prisma";
import { scanPublicMediaProductCandidates } from "@/lib/services/publicMediaImportScanner";

export async function GET() {
  const authError = await requireUserApiResponse();

  if (authError) {
    return authError;
  }

  try {
    const products = await prisma.product.findMany({
      select: {
        category: true,
        sku: true,
      },
      where: {
        deletedAt: null,
      },
    });
    const candidates = await scanPublicMediaProductCandidates({ products });

    return apiSuccess({
      candidates,
      root: "public/media",
    });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "public/media 扫描失败。", 400);
  }
}
