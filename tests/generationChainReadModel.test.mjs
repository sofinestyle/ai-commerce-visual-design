import assert from "node:assert/strict";
import { test } from "node:test";

import { loadTsModule } from "./helpers/loadTsModule.mjs";

const {
  buildGenerationChainGroups,
  buildGenerationChainImageNode,
  readGenerationMetadataSummary,
  readEditMetadata,
  readImageVersionNumber,
} = loadTsModule("src/lib/ai-workspace/generation-chain-read-model.ts");

test("readImageVersionNumber parses v-prefixed versions and pushes unknown versions last", () => {
  assert.equal(readImageVersionNumber("v1"), 1);
  assert.equal(readImageVersionNumber("V12"), 12);
  assert.equal(readImageVersionNumber("draft"), Number.MAX_SAFE_INTEGER);
  assert.equal(readImageVersionNumber(null), Number.MAX_SAFE_INTEGER);
});

test("readEditMetadata extracts continue-design parent image and intent", () => {
  assert.deepEqual(
    readEditMetadata({
      editMetadata: {
        editIntent: "换成白底并保留文字",
        parentImageId: "image-v1",
      },
    }),
    {
      editIntent: "换成白底并保留文字",
      parentImageId: "image-v1",
    },
  );
  assert.deepEqual(readEditMetadata({}), {
    editIntent: "",
    parentImageId: null,
  });
});

test("buildGenerationChainImageNode maps Media fields into a version-chain node", () => {
  const node = buildGenerationChainImageNode({
    createdAt: new Date("2026-07-04T00:00:00.000Z"),
    generationGroupId: "group-1",
    id: "media-1",
    imageVersion: "v1",
    previewImage: "/preview.png",
    prompt: "Generate product hero",
    status: "draft",
    storagePath: "/storage.png",
    updatedAt: "2026-07-04T00:01:00.000Z",
  });

  assert.deepEqual(node, {
    createdAt: "2026-07-04T00:00:00.000Z",
    editIntent: "",
    generationGroupId: "group-1",
    id: "media-1",
    imageUrl: "/preview.png",
    mediaId: "media-1",
    metadataSummary: {
      actualImageModel: null,
      imageType: null,
      platform: null,
      promptActualModel: null,
      promptFallbackReason: null,
      promptRequestedModel: null,
      promptSource: null,
      qualityScore: null,
      qualityStatus: null,
      referenceImageCount: null,
      requestedImageModel: null,
      sku: null,
      theme: null,
      visualRuleId: null,
    },
    parentImageId: null,
    prompt: "Generate product hero",
    status: "draft",
    updatedAt: "2026-07-04T00:01:00.000Z",
    version: "v1",
    versionNumber: 1,
  });
});

test("readGenerationMetadataSummary extracts platform chain observability fields", () => {
  assert.deepEqual(
    readGenerationMetadataSummary({
      generationGroupId: "group-1",
      id: "media-1",
      imageVersion: "v1",
      prompt: "Prompt",
      sku: "W102-BR",
      status: "draft",
      storagePath: "/v1.png",
      styleSignals: {
        generationMetadata: {
          actualImageModel: "gpt-image-2-03",
          imageType: "产品图",
          platform: "temu",
          referenceImageCount: 3,
          requestedImageModel: "gpt-image-2-03",
          theme: "starter set",
          visualRule: {
            ruleId: "temu-main-product",
          },
        },
        promptObservability: {
          actualModel: "gpt-5.6-terra",
          requestedModel: "gpt-5.6-terra",
          source: "llm",
        },
        qualityReview: {
          score: 92,
          status: "usable",
        },
      },
    }),
    {
      actualImageModel: "gpt-image-2-03",
      imageType: "产品图",
      platform: "temu",
      promptActualModel: "gpt-5.6-terra",
      promptFallbackReason: null,
      promptRequestedModel: "gpt-5.6-terra",
      promptSource: "llm",
      qualityScore: 92,
      qualityStatus: "usable",
      referenceImageCount: 3,
      requestedImageModel: "gpt-image-2-03",
      sku: "W102-BR",
      theme: "starter set",
      visualRuleId: "temu-main-product",
    },
  );
});

test("buildGenerationChainGroups groups by generation group and links continue-design children", () => {
  const groups = buildGenerationChainGroups([
    {
      createdAt: "2026-07-04T00:03:00.000Z",
      generationGroupId: "group-1",
      id: "media-v3",
      imageVersion: "v3",
      prompt: "Edit prompt",
      status: "draft",
      storagePath: "/v3.png",
      styleSignals: {
        editMetadata: {
          editIntent: "增加场景光影",
          parentImageId: "image-v2",
        },
      },
    },
    {
      createdAt: "2026-07-04T00:01:00.000Z",
      generationGroupId: "group-1",
      id: "media-v1",
      imageVersion: "v1",
      prompt: "Initial prompt",
      status: "final",
      storagePath: "/v1.png",
    },
    {
      createdAt: "2026-07-04T00:02:00.000Z",
      generationGroupId: "group-1",
      id: "image-v2",
      imageVersion: "v2",
      prompt: "Edit prompt",
      status: "draft",
      storagePath: "/v2.png",
      styleSignals: {
        editMetadata: {
          editIntent: "保留产品，换白底",
          parentImageId: "media-v1",
        },
      },
    },
    {
      createdAt: "2026-07-04T00:00:00.000Z",
      generationGroupId: null,
      id: "product-photo",
      imageVersion: null,
      prompt: null,
      status: "final",
      storagePath: "/photo.png",
    },
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].generationGroupId, "group-1");
  assert.equal(groups[0].consistency.status, "needs_review");
  assert.equal(groups[0].consistency.score, 70);
  assert.deepEqual(
    groups[0].images.map((image) => image.id),
    ["media-v1", "image-v2", "media-v3"],
  );
  assert.deepEqual(
    groups[0].rootImages.map((image) => image.id),
    ["media-v1"],
  );
  assert.deepEqual(
    groups[0].images.map((image) => image.parentImageId),
    [null, "media-v1", "image-v2"],
  );
  assert.equal(groups[0].images[1].editIntent, "保留产品，换白底");
});
