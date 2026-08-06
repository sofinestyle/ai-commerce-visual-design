import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { loadTsModule } from "./helpers/loadTsModule.mjs";

let mediaFilters = null;
let mediaAssets = [];

const { generationChainService } = loadTsModule(
  "src/lib/services/generationChainService.ts",
  {
    stubs: {
      "@/lib/services/mediaService": {
        mediaService: {
          getAll: async (filters) => {
            mediaFilters = filters;

            return mediaAssets;
          },
        },
      },
    },
  },
);

beforeEach(() => {
  mediaFilters = null;
  mediaAssets = [
    {
      createdAt: "2026-07-04T00:00:00.000Z",
      generationGroupId: "group-1",
      id: "media-1",
      imageVersion: "v1",
      prompt: "Prompt",
      status: "draft",
      storagePath: "/media-1.png",
    },
  ];
});

test("generationChainService reads AI media and returns chain groups", async () => {
  const result = await generationChainService.getAll({
    generationGroupId: "group-1",
    projectId: "project-1",
    sku: "SKU-1",
  });

  assert.deepEqual(mediaFilters, {
    generationGroupId: "group-1",
    projectId: "project-1",
    sku: "SKU-1",
    source: "AI",
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].generationGroupId, "group-1");
  assert.deepEqual(
    result[0].images.map((image) => image.id),
    ["media-1"],
  );
});
