import assert from "node:assert/strict";
import { test } from "node:test";

import { loadTsModule } from "./helpers/loadTsModule.mjs";

const { mapWithConcurrency } = loadTsModule(
  "src/lib/ai-workspace/ecommerceGenerationOrchestrator.ts",
  {
    stubs: {
      "@/lib/ai-workspace/aiWorkspaceGenerationService": {},
      "@/lib/ai-workspace/contextBuilder": {},
      "@/lib/ai-workspace/imageCopyGenerationService": {},
      "@/lib/ai-workspace/languageMap": {},
      "@/lib/ai-workspace/outputSpecMap": {},
      "@/lib/ai-workspace/promptGenerationService": {},
      "@/lib/ai-workspace/referenceImageRules": {},
      "@/lib/ai-workspace/referenceImageSelector": {},
      "@/lib/ai-workspace/visibleCopyPolicy": {},
      "@/lib/ai-workspace/visualSopLoader": {},
      "@/lib/modelDefaults": { defaultModelConfig: { imageModel: "mock-image-model" } },
      "@/lib/services/brandService": {},
      "@/lib/services/mediaService": {},
      "@/lib/services/productService": {},
    },
  },
);

test("mapWithConcurrency preserves order and caps active workers", async () => {
  let active = 0;
  let maxActive = 0;

  const results = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (item) => {
    active += 1;
    maxActive = Math.max(maxActive, active);

    await new Promise((resolve) => setTimeout(resolve, 10));

    active -= 1;

    return item * 10;
  });

  assert.deepEqual(results, [10, 20, 30, 40, 50]);
  assert.equal(maxActive, 2);
});
