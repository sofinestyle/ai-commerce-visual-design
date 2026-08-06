import type { GenerationChainGroup } from "@/lib/ai-workspace/generation-chain-read-model";
import type { GeneratedImage, GenerationRecord, GenerationResult } from "@/lib/ai-workspace/types";

type JsonObject = Record<string, unknown>;

type GenerationChainDraftLike = {
  session?: {
    id?: string;
    sku?: string;
    platform?: string;
    imageType?: string;
    theme?: string;
    designIntent?: string;
  };
  selectedMedia?: unknown[];
  promptCandidate?: {
    englishPrompt?: string;
    promptModel?: string;
    source?: string;
  };
  run?: {
    imageModel?: string;
    requestPayload?: JsonObject;
    responseMetadata?: JsonObject;
    status?: string;
  };
  generatedImageVersions?: Array<{
    mediaId?: string;
    promptSnapshot?: string;
    storagePath?: string;
    version?: string;
  }>;
};

export type GenerationHistoryConsistencyIssue = {
  id: string;
  message: string;
  severity: "warning" | "critical";
};

export type GenerationHistoryConsistencyResult = {
  issues: GenerationHistoryConsistencyIssue[];
  score: number;
  status: "consistent" | "needs_review" | "broken";
  summary: string;
};

type ConsistencyInput = {
  generationChainDraft?: GenerationChainDraftLike | null;
  generationRecord?: GenerationRecord | null;
  generationResult: GenerationResult;
  historyGroups?: GenerationChainGroup[];
  requested?: {
    imageCount?: number;
    imageModel?: string | null;
    platform?: string;
    referenceImageCount?: number;
    sku?: string;
  };
};

function addIssue(
  issues: GenerationHistoryConsistencyIssue[],
  issue: GenerationHistoryConsistencyIssue,
) {
  issues.push(issue);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function readMediaIds(images: GeneratedImage[]) {
  return new Set(images.map((image) => image.mediaId).filter(hasText));
}

function scoreIssues(issues: GenerationHistoryConsistencyIssue[]) {
  return Math.max(
    0,
    issues.reduce((score, issue) => score - (issue.severity === "critical" ? 30 : 10), 100),
  );
}

function summarize(status: GenerationHistoryConsistencyResult["status"]) {
  if (status === "consistent") {
    return "生成结果、媒体记录和生成链关键字段一致。";
  }

  if (status === "needs_review") {
    return "生成链存在非关键字段缺失或不一致，建议复核历史记录展示。";
  }

  return "生成链关键字段缺失或断裂，历史记录可能无法正确追溯。";
}

export function validateGenerationHistoryConsistency(
  input: ConsistencyInput,
): GenerationHistoryConsistencyResult {
  const issues: GenerationHistoryConsistencyIssue[] = [];
  const images = input.generationResult.images ?? [];
  const mediaIds = readMediaIds(images);

  if (!hasText(input.generationResult.generationGroupId)) {
    addIssue(issues, {
      id: "missing-generation-group",
      message: "生成结果缺少 generationGroupId，历史记录无法稳定分组。",
      severity: "critical",
    });
  }

  if (images.length === 0) {
    addIssue(issues, {
      id: "missing-generated-images",
      message: "生成结果没有返回图片。",
      severity: "critical",
    });
  }

  for (const [index, image] of images.entries()) {
    if (!hasText(image.mediaId)) {
      addIssue(issues, {
        id: `missing-media-id-${index + 1}`,
        message: `第 ${index + 1} 张生成图缺少 mediaId，可能没有写入媒体库。`,
        severity: "critical",
      });
    }

    if (!hasText(image.prompt)) {
      addIssue(issues, {
        id: `missing-image-prompt-${index + 1}`,
        message: `第 ${index + 1} 张生成图缺少 prompt 快照。`,
        severity: "warning",
      });
    }

    if (!hasText(image.model)) {
      addIssue(issues, {
        id: `missing-image-model-${index + 1}`,
        message: `第 ${index + 1} 张生成图缺少实际生图模型。`,
        severity: "warning",
      });
    }
  }

  if (input.requested?.imageCount && images.length !== input.requested.imageCount) {
    addIssue(issues, {
      id: "image-count-mismatch",
      message: `请求 ${input.requested.imageCount} 张，生成结果返回 ${images.length} 张。`,
      severity: "warning",
    });
  }

  const record = input.generationRecord;

  if (!record) {
    addIssue(issues, {
      id: "missing-generation-record",
      message: "缺少 generationRecord，模型、Prompt 和 QA 观测信息无法完整追溯。",
      severity: "critical",
    });
  } else {
    if (input.requested?.platform && record.platform !== input.requested.platform) {
      addIssue(issues, {
        id: "platform-mismatch",
        message: `generationRecord 平台为 ${record.platform}，与请求 ${input.requested.platform} 不一致。`,
        severity: "critical",
      });
    }

    if (
      input.requested?.referenceImageCount !== undefined &&
      record.referenceImageCount !== input.requested.referenceImageCount
    ) {
      addIssue(issues, {
        id: "reference-count-mismatch",
        message: `generationRecord 参考图数量为 ${record.referenceImageCount ?? "缺失"}，与请求 ${input.requested.referenceImageCount} 不一致。`,
        severity: "warning",
      });
    }

    if (!record.qualityReview) {
      addIssue(issues, {
        id: "missing-quality-review",
        message: "generationRecord 缺少 QA 质检结果。",
        severity: "warning",
      });
    }

    if (!record.prompt) {
      addIssue(issues, {
        id: "missing-prompt-observability",
        message: "generationRecord 缺少 Prompt 模型观测信息。",
        severity: "warning",
      });
    }
  }

  const draft = input.generationChainDraft;

  if (!draft) {
    addIssue(issues, {
      id: "missing-generation-chain-draft",
      message: "缺少 generationChainDraft，前端无法展示完整生成链草稿。",
      severity: "critical",
    });
  } else {
    if (input.requested?.sku && draft.session?.sku !== input.requested.sku) {
      addIssue(issues, {
        id: "session-sku-mismatch",
        message: `生成链 session SKU 为 ${draft.session?.sku ?? "缺失"}，与请求 ${input.requested.sku} 不一致。`,
        severity: "critical",
      });
    }

    if (input.requested?.platform && draft.session?.platform !== input.requested.platform) {
      addIssue(issues, {
        id: "session-platform-mismatch",
        message: `生成链 session 平台为 ${draft.session?.platform ?? "缺失"}，与请求 ${input.requested.platform} 不一致。`,
        severity: "critical",
      });
    }

    if (!hasText(draft.promptCandidate?.englishPrompt)) {
      addIssue(issues, {
        id: "missing-chain-prompt",
        message: "生成链缺少被选中的 Prompt 快照。",
        severity: "critical",
      });
    }

    if (!hasText(draft.run?.imageModel)) {
      addIssue(issues, {
        id: "missing-chain-image-model",
        message: "生成链 run 缺少生图模型。",
        severity: "warning",
      });
    }

    const draftMediaIds = new Set(
      (draft.generatedImageVersions ?? [])
        .map((version) => version.mediaId)
        .filter(hasText),
    );

    for (const mediaId of mediaIds) {
      if (!draftMediaIds.has(mediaId)) {
        addIssue(issues, {
          id: `media-missing-in-chain-${mediaId}`,
          message: `媒体 ${mediaId} 未出现在 generationChainDraft.generatedImageVersions 中。`,
          severity: "critical",
        });
      }
    }
  }

  if (input.historyGroups) {
    const group = input.historyGroups.find(
      (item) => item.generationGroupId === input.generationResult.generationGroupId,
    );

    if (!group) {
      addIssue(issues, {
        id: "missing-history-group",
        message: "历史读模型没有返回对应 generationGroupId 的分组。",
        severity: "critical",
      });
    } else {
      const historyMediaIds = new Set(group.images.map((image) => image.mediaId));

      for (const mediaId of mediaIds) {
        if (!historyMediaIds.has(mediaId)) {
          addIssue(issues, {
            id: `media-missing-in-history-${mediaId}`,
            message: `媒体 ${mediaId} 未出现在历史记录分组中。`,
            severity: "critical",
          });
        }
      }
    }
  }

  const status = issues.some((issue) => issue.severity === "critical")
    ? "broken"
    : issues.length > 0
    ? "needs_review"
    : "consistent";

  return {
    issues,
    score: scoreIssues(issues),
    status,
    summary: summarize(status),
  };
}
