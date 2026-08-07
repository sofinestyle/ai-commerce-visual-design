import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { loadTsModule } from "./helpers/loadTsModule.mjs";

let mediaFilters = null;
let mediaAssets = [];
let checkedFiles = [];
let fileChecks = [];

const { generationChainService } = loadTsModule(
  "src/lib/services/generationChainService.ts",
  {
    stubs: {
      "@/lib/services/mediaService": {
        mediaService: {
          checkLocalMediaFiles: async (items) => {
            checkedFiles = items;

            return fileChecks;
          },
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
  checkedFiles = [];
  fileChecks = [];
  mediaFilters = null;
  mediaAssets = [
    {
      createdAt: "2026-07-04T00:00:00.000Z",
      generationGroupId: "group-1",
      id: "media-1",
      imageVersion: "v1",
      prompt: "Prompt",
      status: "draft",
      storagePath: "/media/media-1.png",
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
  assert.deepEqual(checkedFiles, [{ id: "media-1", path: "/media/media-1.png" }]);
  assert.equal(result[0].images[0].imageFileStatus, "missing");
});

test("generationChainService marks local media files available and skips external URLs", async () => {
  mediaAssets = [
    {
      createdAt: "2026-07-04T00:00:00.000Z",
      generationGroupId: "group-1",
      id: "media-local",
      imageVersion: "v1",
      previewImage: "/media/local.png",
      prompt: "Prompt",
      status: "draft",
      storagePath: "/media/local-storage.png",
    },
    {
      createdAt: "2026-07-04T00:01:00.000Z",
      generationGroupId: "group-1",
      id: "media-external",
      imageVersion: "v2",
      previewImage: "https://example.test/image.png",
      prompt: "Prompt",
      status: "draft",
      storagePath: "https://example.test/image.png",
    },
  ];
  fileChecks = [{ available: true, id: "media-local", path: "/media/local.png" }];

  const result = await generationChainService.getAll();

  assert.deepEqual(checkedFiles, [{ id: "media-local", path: "/media/local.png" }]);
  assert.equal(result[0].images[0].imageFileStatus, "available");
  assert.equal(result[0].images[0].imageFileCheckedPath, "/media/local.png");
  assert.equal(result[0].images[1].imageFileStatus, "unchecked");
  assert.equal(result[0].images[1].imageFileCheckedPath, null);
});
