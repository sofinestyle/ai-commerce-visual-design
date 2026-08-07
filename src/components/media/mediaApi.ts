import {
  type ApiMediaAsset,
  type ImportedMediaUsageType,
} from "./mediaAssetUtils";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type ProductSummary = {
  category: string;
  id: string;
  name: string;
  sku: string;
};

export type BrandSummary = {
  code: string;
  id: string;
  name: string;
};

export type CustomModelType = "image" | "prompt" | "vision";

export type CustomModelSummary = {
  createdAt: string;
  enabled: boolean;
  id: string;
  label: string;
  provider: string;
};

export type ImportDuplicateCheckItem = {
  category: string;
  contentHash: string;
  fileSize: number;
  id: string;
  relativePath: string;
  sku: string;
};

export type ClassificationRequestItem = {
  category: string;
  contentHash: string;
  filename: string;
  id: string;
  imageDataUrl: string;
  relativePath: string;
  sku: string;
};

export type ImportFolderItem = {
  category: string;
  classificationReason: string;
  classificationSource: string;
  confidence: number;
  contentHash: string;
  fileDataUrl: string | null;
  temporaryFileId?: string;
  fileSize: number;
  filename: string;
  mimeType: string;
  qualityDimensions: {
    aiReferenceValue: number;
    backgroundCleanliness: number;
    lightingColor: number;
    sharpness: number;
    subjectCompleteness: number;
  } | null;
  qualityFlags: string[];
  qualityScore: number | null;
  qualityScoreReason: string;
  relativePath: string;
  reviewStatus: string;
  sku: string;
  sourceInStandardSkuFolder: boolean;
  storageFolder: string;
  suggestedUsageType: ImportedMediaUsageType | null;
  usageType: ImportedMediaUsageType;
};

export type ScannedProductMediaCandidate = {
  category: string;
  classificationReason: string;
  classificationSource: "manual" | "unknown" | "vision";
  classificationStatus: "classified" | "unclassified";
  confidence: number;
  contentHash: string;
  error?: string;
  fileSize: number;
  filename: string;
  id: string;
  mimeType: string;
  previewUrl: string;
  qualityDimensions: null;
  qualityFlags: string[];
  qualityScore: null;
  qualityScoreReason: string;
  relativePath: string;
  reviewStatus: "pending";
  sku: string;
  sourceInStandardSkuFolder: boolean;
  status: "error" | "pending" | "ready";
  storageFolder: string;
  suggestedUsageType: ImportedMediaUsageType;
  usageType: ImportedMediaUsageType;
};

async function readJsonResponse<T>(response: Response, fallbackError: string) {
  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !result.success) {
    throw new Error(result.error ?? fallbackError);
  }

  return result.data;
}

async function jsonRequest<T>(url: string, init: RequestInit, fallbackError: string) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init.headers,
    },
  });

  return readJsonResponse<T>(response, fallbackError);
}

export async function fetchMediaAssets({ deletedOnly = false } = {}) {
  const response = await fetch(deletedOnly ? "/api/media?deleted=only" : "/api/media");
  return (await readJsonResponse<ApiMediaAsset[]>(response, "媒体加载失败。")) ?? [];
}

export async function fetchProducts() {
  const response = await fetch("/api/products");
  return (await readJsonResponse<ProductSummary[]>(response, "产品加载失败。")) ?? [];
}

export async function fetchBrands() {
  const response = await fetch("/api/brands");
  return (await readJsonResponse<BrandSummary[]>(response, "品牌加载失败。")) ?? [];
}

export async function createBrand(name: string) {
  return jsonRequest<BrandSummary>(
    "/api/brands",
    {
      method: "POST",
      body: JSON.stringify({ name }),
    },
    "品牌创建失败。",
  );
}

export async function createCustomModel({
  id,
  label,
  type,
}: {
  id: string;
  label?: string;
  type: CustomModelType;
}) {
  return jsonRequest<{
    model: CustomModelSummary;
  }>(
    "/api/settings/model-management/custom-models",
    {
      method: "POST",
      body: JSON.stringify({ id, label, type }),
    },
    "模型新增失败。",
  );
}

export async function deleteCustomModel({
  id,
  type,
}: {
  id: string;
  type: CustomModelType;
}) {
  return jsonRequest<{
    model: CustomModelSummary;
  }>(
    "/api/settings/model-management/custom-models",
    {
      method: "DELETE",
      body: JSON.stringify({ id, type }),
    },
    "模型删除失败。",
  );
}

export async function patchMediaAssets({
  action,
  extra,
  mediaIds,
}: {
  action: string;
  extra?: Record<string, unknown>;
  mediaIds: string[];
}) {
  return jsonRequest<ApiMediaAsset[]>(
    "/api/media",
    {
      method: "PATCH",
      body: JSON.stringify({
        action,
        mediaIds,
        ...extra,
      }),
    },
    "媒体操作失败。",
  );
}

export async function deleteMediaAssets(mediaIds: string[]) {
  return jsonRequest<ApiMediaAsset[]>(
    "/api/media",
    {
      method: "DELETE",
      body: JSON.stringify({ mediaIds }),
    },
    "媒体删除失败。",
  );
}

export async function checkLocalMediaFiles(items: Array<{ id: string; path: string }>) {
  return (
    (await jsonRequest<{
      results: Array<{
        available: boolean;
        id: string;
        path: string;
      }>;
    }>(
      "/api/media/check-files",
      {
        method: "POST",
        body: JSON.stringify({ items }),
      },
      "本地文件检查失败。",
    )) ?? { results: [] }
  );
}

export async function checkImportDuplicates(items: ImportDuplicateCheckItem[]) {
  return (
    (await jsonRequest<{
      results: Array<{
        duplicate: boolean;
        hash: string;
        id: string;
      }>;
    }>(
      "/api/media/check-import-duplicates",
      {
        method: "POST",
        body: JSON.stringify({ items }),
      },
      "重复检查失败。",
    )) ?? { results: [] }
  );
}

export async function classifyImportImages({
  items,
  model,
}: {
  items: ClassificationRequestItem[];
  model: string;
}) {
  return (
    (await jsonRequest<{
      results: Array<{
        id: string;
        suggestedUsageType: Exclude<ImportedMediaUsageType, "">;
        confidence: number;
        qualityDimensions: {
          aiReferenceValue: number;
          backgroundCleanliness: number;
          lightingColor: number;
          sharpness: number;
          subjectCompleteness: number;
        };
        qualityFlags: string[];
        qualityScore: number;
        qualityScoreReason: string;
        reason: string;
      }>;
    }>(
      "/api/media/classify-images",
      {
        method: "POST",
        body: JSON.stringify({
          items,
          model,
        }),
      },
      "AI 分类失败，可手动分类。",
    )) ?? { results: [] }
  );
}

export async function importMediaFolder(items: ImportFolderItem[]) {
  return jsonRequest<ApiMediaAsset[]>(
    "/api/media/import-folder",
    {
      method: "POST",
      body: JSON.stringify({ items }),
    },
    "导入失败。",
  );
}

export async function scanPublicMediaProductFolder() {
  const response = await fetch("/api/media/scan-product-folder");

  return (
    (await readJsonResponse<{
      candidates: ScannedProductMediaCandidate[];
      root: string;
    }>(response, "public/media 扫描失败。")) ?? { candidates: [], root: "public/media" }
  );
}

export async function uploadBrandImportFile(file: File) {
  const response = await fetch("/api/media/import-upload", {
    body: file,
    headers: {
      "content-type": file.type || "application/octet-stream",
      "x-import-file-name": encodeURIComponent(file.name),
    },
    method: "POST",
  });

  return readJsonResponse<{ temporaryFileId: string }>(response, "品牌资产上传失败。");
}
