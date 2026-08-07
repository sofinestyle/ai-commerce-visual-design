import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, test } from "node:test";

import { loadTsModule, projectRoot } from "./helpers/loadTsModule.mjs";

let statPaths = [];
let statResult = { isFile: () => true };
let statShouldThrow = false;

const {
  getDashboardMediaPreviewState,
  getDashboardMediaPreviewUrl,
} = loadTsModule("src/lib/dashboardMediaPreview.ts", {
  cache: new Map(),
  stubs: {
    "fs/promises": {
      stat: async (filePath) => {
        statPaths.push(filePath);

        if (statShouldThrow) {
          throw new Error("missing");
        }

        return statResult;
      },
    },
  },
});

test("AI workspace dashboard preview does not hard-code legacy missing media", () => {
  const source = readFileSync(
    join(projectRoot, "src", "components", "layout", "AIWorkspaceCard.tsx"),
    "utf8",
  );

  assert.doesNotMatch(source, /L3-BR|电商8/);
});

beforeEach(() => {
  statPaths = [];
  statResult = { isFile: () => true };
  statShouldThrow = false;
});

test("getDashboardMediaPreviewUrl prefers thumbnail, preview, then storage", () => {
  assert.equal(
    getDashboardMediaPreviewUrl({
      previewImage: "/media/preview.png",
      storagePath: "/media/storage.png",
      thumbnail: "/media/thumb.png",
    }),
    "/media/thumb.png",
  );
  assert.equal(
    getDashboardMediaPreviewUrl({
      previewImage: "/media/preview.png",
      storagePath: "/media/storage.png",
      thumbnail: null,
    }),
    "/media/preview.png",
  );
});

test("getDashboardMediaPreviewState marks existing local media available", async () => {
  const result = await getDashboardMediaPreviewState({
    previewImage: null,
    storagePath: "/media/%E5%B0%8F%E6%8F%90%E7%90%B4/L3-BR/%E5%8E%9F%E5%9B%BE/front.jpg",
    thumbnail: null,
  });

  assert.deepEqual(result, {
    status: "available",
    url: "/media/%E5%B0%8F%E6%8F%90%E7%90%B4/L3-BR/%E5%8E%9F%E5%9B%BE/front.jpg",
  });
  assert.deepEqual(statPaths, [
    join(projectRoot, "public", "media", "小提琴", "L3-BR", "原图", "front.jpg"),
  ]);
});

test("getDashboardMediaPreviewState marks missing local media without throwing", async () => {
  statShouldThrow = true;

  const result = await getDashboardMediaPreviewState({
    previewImage: null,
    storagePath: "/media/missing.jpg",
    thumbnail: null,
  });

  assert.deepEqual(result, {
    status: "missing",
    url: "/media/missing.jpg",
  });
});

test("getDashboardMediaPreviewState skips external urls and blocks traversal", async () => {
  assert.deepEqual(
    await getDashboardMediaPreviewState({
      previewImage: "https://example.test/image.png",
      storagePath: "https://example.test/image.png",
      thumbnail: null,
    }),
    {
      status: "unchecked",
      url: "https://example.test/image.png",
    },
  );
  assert.deepEqual(
    await getDashboardMediaPreviewState({
      previewImage: null,
      storagePath: "/media/../secret.png",
      thumbnail: null,
    }),
    {
      status: "missing",
      url: "/media/../secret.png",
    },
  );
});
