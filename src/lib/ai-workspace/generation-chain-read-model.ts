type JsonObject = Record<string, unknown>;

export type GenerationChainMediaAsset = {
  imageFileCheckedPath?: string | null;
  imageFileStatus?: "available" | "missing" | "unchecked";
  id: string;
  generationGroupId?: string | null;
  imageVersion?: string | null;
  prompt?: string | null;
  previewImage?: string | null;
  sku?: string | null;
  storagePath: string;
  status: string;
  styleSignals?: unknown;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type GenerationChainMetadataSummary = {
  actualImageModel: string | null;
  imageType: string | null;
  platform: string | null;
  promptActualModel: string | null;
  promptFallbackReason: string | null;
  promptRequestedModel: string | null;
  promptSource: string | null;
  qualityScore: number | null;
  qualityStatus: string | null;
  referenceImageCount: number | null;
  requestedImageModel: string | null;
  sku: string | null;
  theme: string | null;
  visualRuleId: string | null;
};

export type GenerationChainImageNode = {
  id: string;
  mediaId: string;
  generationGroupId: string;
  version: string;
  versionNumber: number;
  status: string;
  prompt: string;
  imageUrl: string;
  imageFileCheckedPath: string | null;
  imageFileStatus: "available" | "missing" | "unchecked";
  parentImageId: string | null;
  editIntent: string;
  revisionMode: string | null;
  metadataSummary: GenerationChainMetadataSummary;
  createdAt: string;
  updatedAt: string;
};

export type GenerationChainDisplayConsistency = {
  issues: Array<{
    id: string;
    message: string;
    severity: "warning" | "critical";
  }>;
  score: number;
  status: "consistent" | "needs_review" | "broken";
  summary: string;
};

export type GenerationChainGroup = {
  consistency: GenerationChainDisplayConsistency;
  generationGroupId: string;
  rootImages: GenerationChainImageNode[];
  images: GenerationChainImageNode[];
};

function isRecord(value: unknown): value is JsonObject {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function toIsoString(value: string | Date | undefined) {
  if (!value) {
    return "";
  }

  return value instanceof Date ? value.toISOString() : value;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readRecord(value: unknown) {
  return isRecord(value) ? value : {};
}

export function readImageVersionNumber(version: string | null | undefined) {
  const match = version?.trim().match(/^v(\d+)$/i);

  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

export function readGenerationMetadataSummary(
  asset: GenerationChainMediaAsset,
): GenerationChainMetadataSummary {
  const styleSignals = readRecord(asset.styleSignals);
  const generationMetadata = readRecord(styleSignals.generationMetadata);
  const promptObservability = readRecord(styleSignals.promptObservability);
  const qualityReview = readRecord(styleSignals.qualityReview);
  const visualRule = readRecord(generationMetadata.visualRule);

  return {
    actualImageModel: readString(generationMetadata.actualImageModel),
    imageType: readString(generationMetadata.imageType),
    platform: readString(generationMetadata.platform),
    promptActualModel: readString(promptObservability.actualModel),
    promptFallbackReason: readString(promptObservability.fallbackReason),
    promptRequestedModel: readString(promptObservability.requestedModel),
    promptSource: readString(promptObservability.source),
    qualityScore: readNumber(qualityReview.score),
    qualityStatus: readString(qualityReview.status),
    referenceImageCount: readNumber(generationMetadata.referenceImageCount),
    requestedImageModel: readString(generationMetadata.requestedImageModel),
    sku: readString(asset.sku),
    theme: readString(generationMetadata.theme),
    visualRuleId: readString(visualRule.ruleId),
  };
}

export function readEditMetadata(styleSignals: unknown) {
  if (!isRecord(styleSignals) || !isRecord(styleSignals.editMetadata)) {
    return {
      editIntent: "",
      parentImageId: null,
      revisionMode: null,
    };
  }

  const editIntent =
    typeof styleSignals.editMetadata.editIntent === "string"
      ? styleSignals.editMetadata.editIntent
      : "";
  const parentImageId =
    typeof styleSignals.editMetadata.parentImageId === "string" &&
    styleSignals.editMetadata.parentImageId.trim()
      ? styleSignals.editMetadata.parentImageId.trim()
      : null;

  return {
    editIntent,
    parentImageId,
    revisionMode: readString(styleSignals.editMetadata.revisionMode),
  };
}

export function buildGenerationChainImageNode(
  asset: GenerationChainMediaAsset,
): GenerationChainImageNode | null {
  const generationGroupId = asset.generationGroupId?.trim();

  if (!generationGroupId) {
    return null;
  }

  const editMetadata = readEditMetadata(asset.styleSignals);
  const version = asset.imageVersion?.trim() || "";

  return {
    id: asset.id,
    mediaId: asset.id,
    generationGroupId,
    version,
    versionNumber: readImageVersionNumber(version),
    status: asset.status,
    prompt: asset.prompt || "",
    imageUrl: asset.previewImage || asset.storagePath,
    imageFileCheckedPath: asset.imageFileCheckedPath ?? null,
    imageFileStatus: asset.imageFileStatus ?? "unchecked",
    parentImageId: editMetadata.parentImageId,
    editIntent: editMetadata.editIntent,
    revisionMode: editMetadata.revisionMode,
    metadataSummary: readGenerationMetadataSummary(asset),
    createdAt: toIsoString(asset.createdAt),
    updatedAt: toIsoString(asset.updatedAt),
  };
}

function buildDisplayConsistency(
  images: GenerationChainImageNode[],
): GenerationChainDisplayConsistency {
  const issues: GenerationChainDisplayConsistency["issues"] = [];

  if (images.length === 0) {
    issues.push({
      id: "missing-history-images",
      message: "生成组没有可展示图片。",
      severity: "critical",
    });
  }

  for (const image of images) {
    if (!image.generationGroupId) {
      issues.push({
        id: `missing-generation-group-${image.id}`,
        message: `${image.id} 缺少 generationGroupId。`,
        severity: "critical",
      });
    }

    if (!image.prompt) {
      issues.push({
        id: `missing-prompt-${image.id}`,
        message: `${image.id} 缺少最终 Prompt 快照。`,
        severity: "warning",
      });
    }

    if (!image.imageUrl) {
      issues.push({
        id: `missing-image-url-${image.id}`,
        message: `${image.id} 缺少图片地址。`,
        severity: "critical",
      });
    }

    if (image.imageFileStatus === "missing") {
      issues.push({
        id: `missing-image-file-${image.id}`,
        message: `${image.id} 的本地图片文件缺失，历史页将显示占位缩略图。`,
        severity: "warning",
      });
    }

    const metadata = image.metadataSummary;
    const missingMetadataFields = [
      metadata.sku ? "" : "SKU",
      metadata.platform ? "" : "平台",
      metadata.imageType ? "" : "图片类型",
      metadata.actualImageModel ? "" : "实际生图模型",
      metadata.promptSource ? "" : "Prompt 来源",
      metadata.qualityStatus ? "" : "QA 状态",
      metadata.referenceImageCount === null ? "参考图数量" : "",
    ].filter(Boolean);

    if (missingMetadataFields.length > 0) {
      issues.push({
        id: `incomplete-metadata-${image.id}`,
        message: `${image.id} 缺少历史页核对字段：${missingMetadataFields.join("、")}。`,
        severity: "warning",
      });
    }
  }

  const score = Math.max(
    0,
    issues.reduce((currentScore, issue) => currentScore - (issue.severity === "critical" ? 30 : 10), 100),
  );
  const status = issues.some((issue) => issue.severity === "critical")
    ? "broken"
    : issues.length > 0
      ? "needs_review"
      : "consistent";
  const summary =
    status === "consistent"
      ? "历史页关键生成链字段完整。"
      : status === "needs_review"
        ? "历史页存在非关键字段缺失，建议复核。"
        : "历史页存在关键链路字段缺失。";

  return {
    issues,
    score,
    status,
    summary,
  };
}

export function buildGenerationChainGroups(
  assets: GenerationChainMediaAsset[],
): GenerationChainGroup[] {
  const groupedNodes = new Map<string, GenerationChainImageNode[]>();

  for (const asset of assets) {
    const node = buildGenerationChainImageNode(asset);

    if (!node) {
      continue;
    }

    groupedNodes.set(node.generationGroupId, [
      ...(groupedNodes.get(node.generationGroupId) ?? []),
      node,
    ]);
  }

  return Array.from(groupedNodes.entries())
    .map(([generationGroupId, nodes]) => {
      const images = [...nodes].sort((left, right) => {
        if (left.versionNumber !== right.versionNumber) {
          return left.versionNumber - right.versionNumber;
        }

        return left.createdAt.localeCompare(right.createdAt);
      });

      return {
        consistency: buildDisplayConsistency(images),
        generationGroupId,
        images,
        rootImages: images.filter((image) => !image.parentImageId),
      };
    })
    .sort((left, right) => {
      const leftCreatedAt = left.images[0]?.createdAt ?? "";
      const rightCreatedAt = right.images[0]?.createdAt ?? "";

      return rightCreatedAt.localeCompare(leftCreatedAt);
    });
}
