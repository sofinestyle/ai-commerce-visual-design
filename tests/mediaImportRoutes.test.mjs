import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import {
  jsonResponse,
  loadRouteModule,
  makePostRequest,
  readJson,
} from "./helpers/routeTestUtils.mjs";

let authResponse = null;
let duplicateItems = null;
let duplicateResults = [];
let importedItems = null;
let importResult = { importedCount: 0 };
let classifiedItems = null;
let classifiedModel = null;
let classificationResults = [];

const routeStubs = {
  "@/lib/apiResponse": {
    apiError: (error, statusCode = 500) =>
      jsonResponse({ success: false, error: String(error) }, { status: statusCode }),
    apiSuccess: (data) => jsonResponse({ success: true, data }),
  },
  "@/lib/auth/requestAuth": {
    requireUserApiResponse: async () => authResponse,
  },
  "@/lib/services/mediaClassificationService": {
    mediaClassificationService: {
      classifyProductPhotos: async (items, model) => {
        classifiedItems = items;
        classifiedModel = model;

        return classificationResults;
      },
    },
  },
  "@/lib/services/mediaService": {
    mediaService: {
      checkImportDuplicates: async (items) => {
        duplicateItems = items;

        return duplicateResults;
      },
      importProductPhotography: async (items) => {
        importedItems = items;

        return importResult;
      },
    },
  },
};

function loadMediaImportRoute(relativePath) {
  return loadRouteModule(relativePath, routeStubs);
}

beforeEach(() => {
  authResponse = null;
  duplicateItems = null;
  duplicateResults = [];
  importedItems = null;
  importResult = { importedCount: 1 };
  classifiedItems = null;
  classifiedModel = null;
  classificationResults = [];
});

test("check-import-duplicates validates items and forwards sanitized payload", async () => {
  duplicateResults = [{ duplicate: true, id: "image-1" }];
  const { POST } = loadMediaImportRoute("src/app/api/media/check-import-duplicates/route.ts");
  const response = await POST(
    makePostRequest({
      items: [
        {
          category: " 鞋靴 ",
          contentHash: " hash-1 ",
          fileSize: 1024,
          id: " image-1 ",
          relativePath: " 鞋靴/SKU-1/front.jpg ",
          sku: " SKU-1 ",
        },
        {
          id: "invalid",
        },
      ],
    }),
  );
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.deepEqual(duplicateItems, [
    {
      category: "鞋靴",
      contentHash: "hash-1",
      fileSize: 1024,
      id: "image-1",
      relativePath: "鞋靴/SKU-1/front.jpg",
      sku: "SKU-1",
    },
  ]);
  assert.deepEqual(body, {
    success: true,
    data: { results: [{ duplicate: true, id: "image-1" }] },
  });
});

test("check-import-duplicates rejects requests without valid items", async () => {
  const { POST } = loadMediaImportRoute("src/app/api/media/check-import-duplicates/route.ts");
  const response = await POST(makePostRequest({ items: [{ id: "missing-fields" }] }));
  const body = await readJson(response);

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.error, "At least one valid media item is required.");
  assert.equal(duplicateItems, null);
});

test("classify-images forwards only valid data URLs and selected model", async () => {
  classificationResults = [{ confidence: 0.92, id: "image-1", suggestedUsageType: "front" }];
  const { POST } = loadMediaImportRoute("src/app/api/media/classify-images/route.ts");
  const response = await POST(
    makePostRequest({
      items: [
        {
          category: " 鞋靴 ",
          filename: " front.jpg ",
          id: " image-1 ",
          imageDataUrl: " data:image/jpeg;base64,abcd ",
          relativePath: " 鞋靴/SKU-1/front.jpg ",
          sku: " SKU-1 ",
        },
        {
          category: "鞋靴",
          filename: "bad.txt",
          id: "bad",
          imageDataUrl: "not-a-data-url",
          relativePath: "鞋靴/SKU-1/bad.txt",
          sku: "SKU-1",
        },
      ],
      model: " gpt-5.4-mini ",
    }),
  );
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.deepEqual(classifiedItems, [
    {
      category: "鞋靴",
      filename: "front.jpg",
      id: "image-1",
      imageDataUrl: "data:image/jpeg;base64,abcd",
      relativePath: "鞋靴/SKU-1/front.jpg",
      sku: "SKU-1",
    },
  ]);
  assert.equal(classifiedModel, "gpt-5.4-mini");
  assert.deepEqual(body, {
    success: true,
    data: { results: [{ confidence: 0.92, id: "image-1", suggestedUsageType: "front" }] },
  });
});

test("classify-images rejects batches above route limit", async () => {
  const { POST } = loadMediaImportRoute("src/app/api/media/classify-images/route.ts");
  const items = Array.from({ length: 21 }, (_, index) => ({
    category: "鞋靴",
    filename: `image-${index}.jpg`,
    id: `image-${index}`,
    imageDataUrl: "data:image/jpeg;base64,abcd",
    relativePath: `鞋靴/SKU-1/image-${index}.jpg`,
    sku: "SKU-1",
  }));
  const response = await POST(makePostRequest({ items }));
  const body = await readJson(response);

  assert.equal(response.status, 400);
  assert.equal(body.error, "A single classification batch cannot exceed 20 images.");
  assert.equal(classifiedItems, null);
});

test("import-folder validates, normalizes and forwards import items", async () => {
  importResult = { importedCount: 1, skippedCount: 0 };
  const { POST } = loadMediaImportRoute("src/app/api/media/import-folder/route.ts");
  const response = await POST(
    makePostRequest({
      items: [
        {
          category: " 鞋靴 ",
          classificationReason: " AI suggested front ",
          classificationSource: "vision",
          confidence: 0.88,
          contentHash: " hash-1 ",
          fileDataUrl: " data:image/jpeg;base64,abcd ",
          fileSize: 2048,
          filename: " front.JPG ",
          height: 1200,
          mimeType: "IMAGE/JPEG",
          qualityDimensions: {
            aiReferenceValue: 105,
            backgroundCleanliness: -5,
            lightingColor: 80.4,
            sharpness: 81,
            subjectCompleteness: 82,
          },
          qualityFlags: [" blur ", "", 42, "low-light"],
          qualityScore: 101,
          qualityScoreReason: " solid ",
          relativePath: " 鞋靴/SKU-1/front.JPG ",
          reviewStatus: "reviewed",
          sku: " SKU-1 ",
          sourceInStandardSkuFolder: false,
          storageFolder: "",
          suggestedUsageType: "side",
          usageType: "front",
          width: 1000,
        },
      ],
    }),
  );
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.deepEqual(importedItems, [
    {
      category: "鞋靴",
      classificationReason: "AI suggested front",
      classificationSource: "vision",
      confidence: 0.88,
      contentHash: "hash-1",
      fileDataUrl: "data:image/jpeg;base64,abcd",
      fileSize: 2048,
      filename: "front.JPG",
      height: 1200,
      mimeType: "IMAGE/JPEG",
      qualityDimensions: {
        aiReferenceValue: 100,
        backgroundCleanliness: 0,
        lightingColor: 80,
        sharpness: 81,
        subjectCompleteness: 82,
      },
      qualityFlags: ["blur", "low-light"],
      qualityScore: 100,
      qualityScoreReason: "solid",
      relativePath: "鞋靴/SKU-1/front.JPG",
      reviewStatus: "reviewed",
      sku: "SKU-1",
      sourceInStandardSkuFolder: false,
      storageFolder: null,
      suggestedUsageType: "side",
      usageType: "front",
      width: 1000,
    },
  ]);
  assert.deepEqual(body, {
    success: true,
    data: { importedCount: 1, skippedCount: 0 },
  });
});

test("import-folder rejects unsupported file types before calling service", async () => {
  const { POST } = loadMediaImportRoute("src/app/api/media/import-folder/route.ts");
  const response = await POST(
    makePostRequest({
      items: [
        {
          category: "鞋靴",
          contentHash: "hash-1",
          fileSize: 2048,
          filename: "front.gif",
          mimeType: "image/gif",
          relativePath: "鞋靴/SKU-1/front.gif",
          reviewStatus: "reviewed",
          sku: "SKU-1",
          usageType: "front",
        },
      ],
    }),
  );
  const body = await readJson(response);

  assert.equal(response.status, 400);
  assert.equal(
    body.error,
    "At least one valid media import item is required.",
  );
  assert.equal(importedItems, null);
});

test("media import routes return auth response before reading request bodies", async () => {
  authResponse = jsonResponse({ success: false, error: "请先登录。" }, { status: 401 });
  const { POST } = loadMediaImportRoute("src/app/api/media/import-folder/route.ts");
  const response = await POST(makePostRequest({ items: "not-read" }));
  const body = await readJson(response);

  assert.equal(response.status, 401);
  assert.deepEqual(body, { success: false, error: "请先登录。" });
  assert.equal(importedItems, null);
});
