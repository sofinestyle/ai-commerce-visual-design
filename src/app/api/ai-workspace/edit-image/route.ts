import { requireUserApiResponse } from "@/lib/auth/requestAuth";
import { apiError, apiSuccess } from "@/lib/apiResponse";
import {
  buildConstraintMemory,
  buildImageEditPrompt,
  type EditTurnSummary,
} from "@/lib/ai-workspace/editPromptBuilder";
import { reviewGeneratedImages } from "@/lib/ai-workspace/generatedImageQualityReview";
import type { ProductFacts, VisualRule } from "@/lib/ai-workspace/types";
import { normalizeReferenceImagesInput } from "@/lib/aiProviders/referenceImageInput";
import type { AIImageEditTurn } from "@/lib/aiProviders/types";
import { aiGenerationService } from "@/lib/services/aiGenerationService";
import { mediaService } from "@/lib/services/mediaService";
import { productService } from "@/lib/services/productService";
import { projectService } from "@/lib/services/projectService";

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function readProductFacts(value: unknown): ProductFacts | null {
  const item = readObject(value);
  const id = readString(item.id);
  const sku = readString(item.sku);
  const name = readString(item.name);

  if (!id || !sku || !name) {
    return null;
  }

  return {
    id,
    sku,
    name,
    accessories: readString(item.accessories) || undefined,
    brand: readString(item.brand) || undefined,
    category: readString(item.category) || undefined,
    color: readString(item.color) || undefined,
    description: readString(item.description) || null,
    material: readString(item.material) || undefined,
    packaging: readString(item.packaging) || undefined,
    size: readString(item.size) || undefined,
  };
}

function readVisualRule(value: unknown): VisualRule | undefined {
  const item = readObject(value);
  const ruleId = readString(item.ruleId);

  if (!ruleId) {
    return undefined;
  }

  return {
    designObjective: readString(item.designObjective),
    mediaGuidance: {
      primary: [],
      secondary: [],
    },
    promptGuidance: {
      avoid: [],
      focus: [],
    },
    ruleId,
    theme: readString(item.theme),
    visualSpecification: {},
  };
}

function readEditTurns(value: unknown): EditTurnSummary[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((turn) => readObject(turn))
    .map((turn) => ({
      editIntent: readString(turn.editIntent),
    }))
    .filter((turn) => turn.editIntent);
}

function readProviderHistory(value: unknown): AIImageEditTurn[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const turns: AIImageEditTurn[] = [];

  for (const rawTurn of value) {
    const turn = readObject(rawTurn);
    const role = readString(turn.role);

    if (role !== "user" && role !== "model") {
      continue;
    }

    turns.push({
        assistantImageUrl: readString(turn.assistantImageUrl) || undefined,
        editPrompt: readString(turn.editPrompt) || undefined,
        role,
        text: readString(turn.text) || undefined,
    });
  }

  return turns;
}

export async function POST(request: Request) {
  const authError = await requireUserApiResponse();

  if (authError) {
    return authError;
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const productFacts = readProductFacts(body.productFacts);
    const currentImage = normalizeReferenceImagesInput([body.currentImage])[0];
    const editReferenceImages = normalizeReferenceImagesInput(body.editReferenceImages);
    const editIntent = readString(body.editIntent);
    const model = readString(body.model);
    const projectIdFromRequest = readString(body.projectId);
    const generationGroupId = readString(body.generationGroupId) || `edit-${Date.now()}`;
    const revisionMode = readString(body.revisionMode) || "local_edit";

    if (!productFacts) {
      return apiError("productFacts is required.", 400);
    }

    if (!currentImage?.url) {
      return apiError("currentImage.url is required.", 400);
    }

    if (!editIntent) {
      return apiError("editIntent is required.", 400);
    }

    const storedProduct = await productService.getById(productFacts.id);

    if (!storedProduct) {
      return apiError("productFacts.id does not exist in the database.", 400);
    }

    const fallbackProject = projectIdFromRequest ? null : (await projectService.getAll())[0];
    const projectId = projectIdFromRequest || fallbackProject?.id || "";

    if (!projectId) {
      return apiError("projectId is required for media save.", 400);
    }

    const editTurns = readEditTurns(body.editTurns);
    const visualRule = readVisualRule(body.visualRule);
    const preserveExistingText = readBoolean(body.preserveExistingText, true);
    const constraintMemory = buildConstraintMemory({
      designIntent: readString(body.designIntent),
      editTurns,
      preserveExistingText,
      productFacts,
      visualRule,
    });
    const historySummary = editTurns.map((turn) => turn.editIntent).join("；");
    const editPrompt = buildImageEditPrompt({
      constraintMemory,
      editIntent,
      editReferenceImageCount: editReferenceImages.length,
      historySummary,
      originalPrompt: readString(body.originalPrompt),
      preserveExistingText,
    });
    const result = await aiGenerationService.edit({
      currentImage,
      editPrompt,
      editReferenceImages,
      history: readProviderHistory(body.providerHistory),
      model,
      productId: productFacts.id,
      projectId,
      quality: readString(body.quality) || undefined,
      size: readString(body.size) || undefined,
    });
    const actualImageModel = result.images.find((image) => readString(image.model))?.model || model || null;
    const qualityReview = reviewGeneratedImages({
      actualImageModel,
      imageType: "local_edit",
      images: result.images,
      productFacts,
      referenceImageCount: editReferenceImages.length + 1,
      referenceImages: [
        ...(currentImage ? [currentImage] : []),
        ...editReferenceImages,
      ],
      requestedImageCount: result.images.length,
      requestedImageModel: model || actualImageModel,
      theme: readString(visualRule?.theme) || "local_edit",
      visualRule,
    });
    const generatedMedia = await mediaService.saveGeneratedImagesAsDraft({
      generationGroupId,
      imageType: "continue_design",
      images: result.images,
      platform: readString(body.platform) || null,
      productId: productFacts.id,
      projectId,
      prompt: editPrompt,
      sku: productFacts.sku,
      styleSignals: {
        generationMetadata: {
          actualImageModel,
          decision: qualityReview.decision,
          attempt: qualityReview.attempt,
          failureTypes: qualityReview.failureTypes,
          maxAttempts: qualityReview.maxAttempts,
          imageType: "continue_design",
          requestedImageModel: model || actualImageModel,
          referenceImageCount: editReferenceImages.length + 1,
          platform: readString(body.platform) || null,
          theme: readString(visualRule?.theme) || "local_edit",
        },
        qualityReview,
        editMetadata: {
          constraintMemory,
          editIntent,
          editMode: result.metadata?.editMode || "summary-plus-latest-image",
          editReferenceImageCount: editReferenceImages.length,
          editReferenceImages: editReferenceImages.map((image) => ({
            id: image.id,
            source: image.source,
            type: image.type,
            url: image.url,
          })),
          editSessionId: readString(body.editSessionId) || generationGroupId,
          parentImageId: readString(body.parentImageId) || currentImage.id || null,
          preserveExistingText,
          revisionMode,
          turnCount: editTurns.length + 1,
        },
      },
    });

    return apiSuccess({
      ...result,
      generationGroupId,
      images: result.images.map((image, index) => ({
        ...image,
        mediaId: generatedMedia[index]?.id,
        qualityReview,
        mediaStatus: generatedMedia[index]?.status ?? "draft",
      })),
      editRecord: {
        constraintMemory,
        editIntent,
        editReferenceImageCount: editReferenceImages.length,
        editPrompt,
        editSessionId: readString(body.editSessionId) || generationGroupId,
        generatedTime: new Date().toISOString(),
        parentImageId: readString(body.parentImageId) || currentImage.id || null,
        preserveExistingText,
        revisionMode,
      },
      qualityReview,
      generatedMediaIds: generatedMedia.map((media) => media.id),
    });
  } catch (error) {
    return apiError(error);
  }
}
