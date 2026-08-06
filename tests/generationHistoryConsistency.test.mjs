import assert from "node:assert/strict";
import { test } from "node:test";

import { loadTsModule } from "./helpers/loadTsModule.mjs";

const { validateGenerationHistoryConsistency } = loadTsModule(
  "src/lib/ai-workspace/generationHistoryConsistency.ts",
);

function createCompleteFixture() {
  return {
    generationChainDraft: {
      generatedImageVersions: [
        {
          mediaId: "media-1",
          promptSnapshot: "Generate a product hero image",
          storagePath: "/media/generated-1.png",
          version: "v1",
        },
      ],
      promptCandidate: {
        englishPrompt: "Generate a product hero image",
        promptModel: "gpt-5.6-terra",
        source: "model",
      },
      run: {
        imageModel: "gpt-image-2-03",
        responseMetadata: {
          generationGroupId: "group-1",
        },
        status: "succeeded",
      },
      selectedMedia: [{ mediaId: "ref-1" }],
      session: {
        designIntent: "主体：小提琴；场景：居家室内",
        id: "group-1",
        imageType: "主图",
        platform: "TEMU",
        sku: "W102-BR",
        theme: "产品图",
      },
    },
    generationRecord: {
      actualImageModel: "gpt-image-2-03",
      generatedTime: "2026-08-06T00:00:00.000Z",
      imageCount: 1,
      imageModel: "gpt-image-2-03",
      outputSpecification: {
        aspectRatio: "1:1",
        outputSize: "1024x1024",
      },
      platform: "TEMU",
      prompt: {
        actualModel: "gpt-5.6-terra",
        requestedModel: "gpt-5.6-terra",
        source: "llm",
      },
      qualityReview: {
        checks: [],
        generatedTime: "2026-08-06T00:00:00.000Z",
        reviewer: "local-heuristic-v1",
        score: 96,
        status: "usable",
        summary: "基础检查通过",
      },
      referenceImageCount: 1,
      requestedImageModel: "gpt-image-2-03",
    },
    generationResult: {
      generationGroupId: "group-1",
      images: [
        {
          id: "image-1",
          mediaId: "media-1",
          mediaStatus: "draft",
          model: "gpt-image-2-03",
          prompt: "Generate a product hero image",
          url: "/media/generated-1.png",
        },
      ],
      status: "Completed",
      taskId: "task-1",
    },
    historyGroups: [
      {
        generationGroupId: "group-1",
        images: [
          {
            createdAt: "2026-08-06T00:00:00.000Z",
            editIntent: "",
            generationGroupId: "group-1",
            id: "media-1",
            imageUrl: "/media/generated-1.png",
            mediaId: "media-1",
            parentImageId: null,
            prompt: "Generate a product hero image",
            status: "draft",
            updatedAt: "2026-08-06T00:00:00.000Z",
            version: "v1",
            versionNumber: 1,
          },
        ],
        rootImages: [],
      },
    ],
    requested: {
      imageCount: 1,
      imageModel: "gpt-image-2-03",
      platform: "TEMU",
      referenceImageCount: 1,
      sku: "W102-BR",
    },
  };
}

test("generation history consistency passes a complete platform chain", () => {
  const result = validateGenerationHistoryConsistency(createCompleteFixture());

  assert.equal(result.status, "consistent");
  assert.equal(result.score, 100);
  assert.deepEqual(result.issues, []);
});

test("generation history consistency catches missing media history linkage", () => {
  const fixture = createCompleteFixture();
  const result = validateGenerationHistoryConsistency({
    ...fixture,
    historyGroups: [
      {
        generationGroupId: "group-1",
        images: [],
        rootImages: [],
      },
    ],
  });

  assert.equal(result.status, "broken");
  assert.ok(
    result.issues.some((issue) => issue.id === "media-missing-in-history-media-1"),
  );
});
