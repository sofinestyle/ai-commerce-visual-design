import assert from "node:assert/strict";
import { test } from "node:test";

import { loadTsModule } from "./helpers/loadTsModule.mjs";

function createGenerationRequest() {
  return {
    context: {
      designIntent: "主体：小提琴；场景：浅暖色居家室内",
      generationContextId: "group-history-1",
      sourcePage: "ai-workspace",
    },
    model: {
      imageModel: "gpt-image-2-03",
    },
    output: {
      aspectRatio: "1:1",
      imageCount: 1,
      imageType: "主图",
      language: "英文",
      languageCode: "en",
      platform: "TEMU",
      size: "1024x1024",
      theme: "产品图",
    },
    productFacts: {
      category: "小提琴",
      name: "W102-BR 小提琴",
      sku: "W102-BR",
    },
    prompt: {
      chineseSummary: "浅暖色居家室内小提琴产品图",
      englishPrompt:
        "Task: Create one standalone complete commercial product image. Product Accuracy: preserve the violin. Effective Scene Direction: warm home interior. Visible Copy: no visible marketing copy. Compliance Constraints: no collage.",
      promptModel: "gpt-5.6-terra",
      requestedPromptModel: "gpt-5.6-terra",
      source: "llm",
    },
    referenceImages: [
      {
        id: "ref-1",
        role: "primary",
        type: "front",
        url: "data:image/png;base64,abc",
      },
    ],
    taskType: "generate",
    visualRule: {
      designObjective: "清晰展示产品。",
      mediaGuidance: {
        primary: ["front"],
        secondary: [],
      },
      promptGuidance: {
        avoid: [],
        focus: ["product accuracy"],
      },
      ruleId: "TEMU_MAIN_PRODUCT",
      theme: "产品图",
      visualSpecification: {
        Background: "Light Warm",
      },
    },
  };
}

test("workspace generation response includes history consistency", async () => {
  const { generateFromWorkspaceRequest } = loadTsModule(
    "src/lib/ai-workspace/aiWorkspaceGenerationService.ts",
    {
      stubs: {
        "@/lib/promptEngine/rules": {
          imageTypeRules: [{ imageType: "主图" }],
          platformRules: [{ id: "TEMU", platform: "TEMU" }],
        },
        "@/lib/services/aiGenerationService": {
          aiGenerationService: {
            generate: async (input) => ({
              images: [
                {
                  id: "generated-1",
                  model: input.model,
                  prompt: input.prompt,
                  url: "data:image/png;base64,generated",
                },
              ],
              status: "Completed",
              taskId: "task-history-1",
            }),
          },
        },
        "@/lib/services/mediaService": {
          mediaService: {
            saveGeneratedImagesAsDraft: async ({ generationGroupId, images, prompt }) =>
              images.map((image, index) => ({
                generationGroupId,
                id: `media-${index + 1}`,
                imageVersion: `v${index + 1}`,
                previewImage: `/media/generated-${index + 1}.png`,
                prompt,
                status: "draft",
                storagePath: `/media/generated-${index + 1}.png`,
                styleSignals: {},
              })),
          },
        },
        "@/lib/services/productService": {
          productService: {
            getAll: async () => [
              {
                id: "product-1",
                name: "W102-BR 小提琴",
                sku: "W102-BR",
              },
            ],
          },
        },
        "@/lib/services/projectService": {
          projectService: {
            getAll: async () => [{ id: "project-1" }],
          },
        },
      },
    },
  );

  const result = await generateFromWorkspaceRequest(createGenerationRequest());

  assert.equal(result.historyConsistency.status, "consistent");
  assert.equal(result.historyConsistency.score, 100);
  assert.equal(result.generationRecord.platform, "TEMU");
  assert.equal(result.generationChainDraft.session.sku, "W102-BR");
});

test("workspace generation attaches per-image quality review metadata", async () => {
  const { generateFromWorkspaceRequest } = loadTsModule(
    "src/lib/ai-workspace/aiWorkspaceGenerationService.ts",
    {
      stubs: {
        "@/lib/promptEngine/rules": {
          imageTypeRules: [{ imageType: "主图" }],
          platformRules: [{ id: "TEMU", platform: "TEMU" }],
        },
        "@/lib/services/aiGenerationService": {
          aiGenerationService: {
            generate: async (input) => ({
              images: [
                {
                  id: "generated-1",
                  model: input.model,
                  prompt: input.prompt,
                  url: "data:image/png;base64,generated-1",
                },
                {
                  id: "generated-2",
                  model: input.model,
                  prompt: input.prompt,
                  url: "data:image/png;base64,generated-2",
                },
              ],
              status: "Completed",
              taskId: "task-history-2",
            }),
          },
        },
        "@/lib/services/mediaService": {
          mediaService: {
            saveGeneratedImagesAsDraft: async ({ generationGroupId, images, prompt }) =>
              images.map((image, index) => ({
                generationGroupId,
                id: `media-${index + 1}`,
                imageVersion: `v${index + 1}`,
                previewImage: `/media/generated-${index + 1}.png`,
                prompt,
                status: "draft",
                storagePath: `/media/generated-${index + 1}.png`,
                styleSignals: {},
              })),
          },
        },
        "@/lib/services/productService": {
          productService: {
            getAll: async () => [{
              id: "product-1",
              name: "W102-BR 小提琴",
              sku: "W102-BR",
            }],
          },
        },
      },
    },
  );

  const result = await generateFromWorkspaceRequest({
    ...createGenerationRequest(),
    output: {
      ...createGenerationRequest().output,
      imageCount: 2,
    },
  });

  assert.equal(result.images.length, 2);
  assert.ok(result.images[0].qualityReview);
  assert.ok(result.images[1].qualityReview);
  assert.equal(result.images[0].qualityReview === result.images[1].qualityReview, false);
  assert.equal(result.images[0].qualityReview.checks.some((check) => check.id === "candidate-count"), true);
  assert.equal(result.images[0].qualityReview.checks.find((check) => check.id === "candidate-count")?.status, "pass");
});
