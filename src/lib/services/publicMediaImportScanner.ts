import { createHash } from "crypto";
import { readdir, readFile, stat } from "fs/promises";
import * as path from "path";

import { parseImportPath } from "@/components/media/mediaImportWorkflowUtils";

const supportedProductImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const maxScanItems = 500;

export type ProductMediaScanProduct = {
  category: string;
  sku: string;
};

export type ProductMediaScanCandidate = {
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
  suggestedUsageType: string;
  usageType: string;
};

function getMimeType(filename: string) {
  const extension = path.extname(filename).toLowerCase();

  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  return "image/png";
}

function toPublicMediaUrl(relativePath: string) {
  return `/${relativePath
    .split(path.sep)
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

async function collectProductImageFiles(directory: string, rootDirectory: string) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const nextPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      const relativeDirectory = path.relative(rootDirectory, nextPath).split(path.sep);
      const topLevelMediaFolder = relativeDirectory[0] === "media" ? relativeDirectory[1] : "";
      const normalizedTopLevelMediaFolder = topLevelMediaFolder.trim().toLowerCase();

      if (["generated", "品牌", "brand", "brands"].includes(normalizedTopLevelMediaFolder)) {
        continue;
      }

      files.push(...await collectProductImageFiles(nextPath, rootDirectory));
      continue;
    }

    if (!entry.isFile() || !supportedProductImageExtensions.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    files.push(path.relative(rootDirectory, nextPath));

    if (files.length >= maxScanItems) {
      break;
    }
  }

  return files.slice(0, maxScanItems);
}

export async function scanPublicMediaProductCandidates({
  products,
  rootDirectory = path.join(process.cwd(), "public"),
}: {
  products: ProductMediaScanProduct[];
  rootDirectory?: string;
}) {
  const publicMediaDirectory = path.join(rootDirectory, "media");
  const skuCategoryMap = new Map(products.map((product) => [product.sku, product.category]));
  const relativeFiles = await collectProductImageFiles(publicMediaDirectory, rootDirectory);

  const scannedCandidates = await Promise.all(
    relativeFiles.map(async (relativePath): Promise<ProductMediaScanCandidate | null> => {
      const absolutePath = path.join(rootDirectory, relativePath);
      const filename = path.basename(relativePath);
      const parsedPath = parseImportPath(
        {
          name: filename,
          webkitRelativePath: relativePath.split(path.sep).join("/"),
        } as File,
        skuCategoryMap,
      );
      const isProductSkuFile =
        parsedPath.category &&
        parsedPath.category !== "品牌" &&
        parsedPath.sku &&
        parsedPath.sourceInStandardSkuFolder;

      if (!isProductSkuFile) {
        return null;
      }

      const fileBuffer = await readFile(absolutePath);
      const fileStat = await stat(absolutePath);
      const contentHash = createHash("sha256").update(fileBuffer).digest("hex");
      const errors = [
        !parsedPath.category || !parsedPath.sku
          ? "文件夹结构需为：public/media/类目/SKU/原图|转换图|参考图/图片文件，或 public/media/类目/SKU/图片文件。"
          : "",
        !parsedPath.sourceInStandardSkuFolder
          ? "产品素材必须位于 public/media 下已建档 SKU 文件夹或其子文件夹中。"
          : "",
      ].filter(Boolean);
      const isPresetUsageType = Boolean(parsedPath.initialUsageType);

      return {
        category: parsedPath.category,
        classificationReason:
          parsedPath.initialUsageType === "reference"
            ? "根据 SKU 下“参考图”文件夹自动归类。"
            : "已从 public/media 标准产品素材目录扫描。",
        classificationSource: isPresetUsageType ? "manual" : "unknown",
        classificationStatus: isPresetUsageType ? "classified" : "unclassified",
        confidence: isPresetUsageType ? 1 : 0,
        contentHash,
        ...(errors.length > 0 ? { error: errors.join(" ") } : {}),
        fileSize: fileStat.size,
        filename: parsedPath.filename,
        id: `${contentHash}-${parsedPath.relativePath}`,
        mimeType: getMimeType(filename),
        previewUrl: toPublicMediaUrl(relativePath),
        qualityDimensions: null,
        qualityFlags: [],
        qualityScore: null,
        qualityScoreReason: "",
        relativePath: parsedPath.relativePath,
        reviewStatus: "pending",
        sku: parsedPath.sku,
        sourceInStandardSkuFolder: parsedPath.sourceInStandardSkuFolder,
        status: errors.length > 0 ? "error" : parsedPath.initialUsageType ? "ready" : "pending",
        storageFolder: parsedPath.storageFolder,
        suggestedUsageType: parsedPath.initialUsageType,
        usageType: parsedPath.initialUsageType,
      };
    }),
  );

  return scannedCandidates.filter(
    (candidate): candidate is ProductMediaScanCandidate => Boolean(candidate),
  );
}
