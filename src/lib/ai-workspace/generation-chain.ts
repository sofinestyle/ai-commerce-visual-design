import type { GenerationRequest, GenerationTaskType } from "./generation-protocol";
import type { GeneratedImage, GenerationResult } from "./types";

type JsonObject = Record<string, unknown>;

export type DesignSessionStatus = "active" | "completed" | "abandoned";

export type SelectedMediaRole =
  | "primary"
  | "secondary"
  | "edit_reference"
  | "current_image";

export type PromptCandidateSource = "builder" | "model";

export type PromptCandidateStatus =
  | "candidate"
  | "selected"
  | "edited"
  | "rejected";

export type GenerationRunStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed";

export type GeneratedImageVersionStatus = "draft" | "saved" | "discarded";

export type DesignSessionRecord = {
  id: string;
  productId?: string;
  projectId?: string;
  sku: string;
  productName?: string;
  category?: string;
  platform: string;
  imageType: string;
  theme: string;
  designIntent: string;
  sourcePage: string;
  status: DesignSessionStatus;
  productSnapshot: JsonObject;
  visualRuleSnapshot: JsonObject;
  outputSpec: JsonObject;
  createdAt: string;
  updatedAt: string;
};

export type SelectedMediaRecord = {
  id: string;
  sessionId: string;
  mediaId?: string;
  url: string;
  role: SelectedMediaRole;
  imageType?: string;
  qualityScore?: number | null;
  sortOrder: number;
  sourceSnapshot: JsonObject;
  createdAt: string;
};

export type PromptCandidateRecord = {
  id: string;
  sessionId: string;
  source: PromptCandidateSource;
  promptModel?: string;
  chineseSummary?: string;
  englishPrompt: string;
  negativePrompt?: string;
  status: PromptCandidateStatus;
  userEditedPrompt?: string;
  rank?: number;
  metadata: JsonObject;
  createdAt: string;
  updatedAt: string;
};

export type GenerationRunRecord = {
  id: string;
  sessionId: string;
  promptCandidateId?: string;
  parentRunId?: string;
  runType: GenerationTaskType | "continue_design";
  imageModel: string;
  provider?: string;
  requestPayload: JsonObject;
  responseMetadata: JsonObject;
  status: GenerationRunStatus;
  errorMessage?: string;
  durationMs?: number;
  cost?: number;
  createdAt: string;
  updatedAt: string;
};

export type GeneratedImageVersionRecord = {
  id: string;
  sessionId: string;
  runId: string;
  mediaId?: string;
  parentImageId?: string;
  version: string;
  status: GeneratedImageVersionStatus;
  temporaryUrl?: string;
  storagePath?: string;
  promptSnapshot: string;
  editIntent?: string;
  editPrompt?: string;
  metadata: JsonObject;
  createdAt: string;
  updatedAt: string;
};

export type MediaAssetLike = {
  id: string;
  generationGroupId?: string | null;
  imageVersion?: string | null;
  prompt?: string | null;
  previewImage?: string | null;
  storagePath: string;
  status: string;
  styleSignals?: unknown;
};

export type BuildGenerationChainInput = {
  generationRequest: GenerationRequest;
  generatedResult?: GenerationResult;
  productId?: string;
  projectId?: string;
  provider?: string;
  parentRunId?: string;
  promptCandidateId?: string;
  generatedMedia?: MediaAssetLike[];
  now?: string;
};

function nowIso(now?: string) {
  return now || new Date().toISOString();
}

function normalizePromptSource(source: GenerationRequest["prompt"]["source"]) {
  return source === "llm" ? "model" : "builder";
}

function buildSessionId(request: GenerationRequest, fallbackTime: string) {
  return (
    request.context.generationContextId ||
    [
      "session",
      request.productFacts.sku || "unknown-sku",
      request.output.platform || "unknown-platform",
      request.output.imageType || "unknown-image-type",
      fallbackTime,
    ].join(":")
  );
}

function buildRecordId(prefix: string, parts: Array<string | number | undefined>) {
  return [prefix, ...parts.filter((part) => part !== undefined && part !== "")]
    .join(":")
    .replace(/\s+/g, "-");
}

export function buildDesignSessionRecord(
  request: GenerationRequest,
  options: {
    productId?: string;
    projectId?: string;
    status?: DesignSessionStatus;
    now?: string;
  } = {},
): DesignSessionRecord {
  const timestamp = nowIso(options.now);
  const sessionId = buildSessionId(request, timestamp);

  return {
    id: sessionId,
    productId: options.productId,
    projectId: options.projectId,
    sku: request.productFacts.sku,
    productName: request.productFacts.name,
    category: request.productFacts.category,
    platform: request.output.platform,
    imageType: request.output.imageType,
    theme: request.output.theme,
    designIntent: request.context.designIntent,
    sourcePage: request.context.sourcePage,
    status: options.status ?? "active",
    productSnapshot: { ...request.productFacts },
    visualRuleSnapshot: { ...request.visualRule },
    outputSpec: { ...request.output },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function buildSelectedMediaRecords(
  sessionId: string,
  request: GenerationRequest,
  options: {
    now?: string;
  } = {},
): SelectedMediaRecord[] {
  const timestamp = nowIso(options.now);

  return request.referenceImages.map((image, index) => ({
    id: buildRecordId("selected-media", [sessionId, image.id, index + 1]),
    sessionId,
    mediaId: image.id,
    url: image.url,
    role: image.role === "secondary" ? "secondary" : "primary",
    imageType: image.type,
    sortOrder: index + 1,
    sourceSnapshot: { ...image },
    createdAt: timestamp,
  }));
}

export function buildPromptCandidateRecord(
  sessionId: string,
  request: GenerationRequest,
  options: {
    id?: string;
    negativePrompt?: string;
    rank?: number;
    status?: PromptCandidateStatus;
    userEditedPrompt?: string;
    now?: string;
  } = {},
): PromptCandidateRecord {
  const timestamp = nowIso(options.now);

  return {
    id: options.id ?? buildRecordId("prompt", [sessionId, options.rank ?? 1]),
    sessionId,
    source: normalizePromptSource(request.prompt.source),
    promptModel: request.prompt.promptModel,
    chineseSummary: request.prompt.chineseSummary,
    englishPrompt: request.prompt.englishPrompt,
    negativePrompt: options.negativePrompt,
    status: options.status ?? "selected",
    userEditedPrompt: options.userEditedPrompt,
    rank: options.rank,
    metadata: {
      sourcePage: request.context.sourcePage,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function buildGenerationRunRecord(
  sessionId: string,
  request: GenerationRequest,
  options: {
    id?: string;
    parentRunId?: string;
    promptCandidateId?: string;
    provider?: string;
    responseMetadata?: JsonObject;
    status?: GenerationRunStatus;
    errorMessage?: string;
    durationMs?: number;
    cost?: number;
    now?: string;
  } = {},
): GenerationRunRecord {
  const timestamp = nowIso(options.now);

  return {
    id: options.id ?? buildRecordId("run", [sessionId, timestamp]),
    sessionId,
    promptCandidateId: options.promptCandidateId,
    parentRunId: options.parentRunId,
    runType: request.taskType,
    imageModel: request.model.imageModel,
    provider: options.provider,
    requestPayload: {
      imageModel: request.model,
      output: request.output,
      prompt: request.prompt,
      referenceImages: request.referenceImages,
      taskType: request.taskType,
    },
    responseMetadata: options.responseMetadata ?? {},
    status: options.status ?? "pending",
    errorMessage: options.errorMessage,
    durationMs: options.durationMs,
    cost: options.cost,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function buildGeneratedImageVersionRecords(input: {
  sessionId: string;
  runId: string;
  images: GeneratedImage[];
  mediaAssets?: MediaAssetLike[];
  editIntent?: string;
  editPrompt?: string;
  parentImageId?: string;
  startVersion?: number;
  now?: string;
}): GeneratedImageVersionRecord[] {
  const timestamp = nowIso(input.now);
  const mediaById = new Map(
    (input.mediaAssets ?? []).map((asset) => [asset.id, asset]),
  );

  return input.images.map((image, index) => {
    const media = image.mediaId ? mediaById.get(image.mediaId) : undefined;
    const version = media?.imageVersion || `v${(input.startVersion ?? 1) + index}`;

    return {
      id: buildRecordId("image-version", [input.sessionId, input.runId, version]),
      sessionId: input.sessionId,
      runId: input.runId,
      mediaId: image.mediaId,
      parentImageId: input.parentImageId || image.parentImageId,
      version,
      status: image.mediaStatus === "final" ? "saved" : "draft",
      temporaryUrl: media ? undefined : image.url,
      storagePath: media?.storagePath,
      promptSnapshot: image.prompt,
      editIntent: input.editIntent,
      editPrompt: input.editPrompt,
      metadata: {
        imageId: image.id,
        imageModel: image.model,
        mediaStatus: image.mediaStatus ?? "temporary",
        previewImage: media?.previewImage,
        styleSignals: media?.styleSignals,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });
}

export function buildGenerationChainDraft(input: BuildGenerationChainInput) {
  const timestamp = nowIso(input.now);
  const session = buildDesignSessionRecord(input.generationRequest, {
    now: timestamp,
    productId: input.productId,
    projectId: input.projectId,
  });
  const selectedMedia = buildSelectedMediaRecords(session.id, input.generationRequest, {
    now: timestamp,
  });
  const promptCandidate = buildPromptCandidateRecord(
    session.id,
    input.generationRequest,
    {
      now: timestamp,
      id: input.promptCandidateId,
    },
  );
  const run = buildGenerationRunRecord(session.id, input.generationRequest, {
    now: timestamp,
    parentRunId: input.parentRunId,
    promptCandidateId: promptCandidate.id,
    provider: input.provider,
    responseMetadata: input.generatedResult
      ? {
          generationGroupId: input.generatedResult.generationGroupId,
          resultStatus: input.generatedResult.status,
          taskId: input.generatedResult.taskId,
        }
      : {},
    status: input.generatedResult
      ? input.generatedResult.status === "failed"
        ? "failed"
        : "succeeded"
      : "pending",
  });
  const generatedImageVersions = input.generatedResult
    ? buildGeneratedImageVersionRecords({
        images: input.generatedResult.images,
        mediaAssets: input.generatedMedia,
        runId: run.id,
        sessionId: session.id,
        now: timestamp,
      })
    : [];

  return {
    session,
    selectedMedia,
    promptCandidate,
    run,
    generatedImageVersions,
  };
}
