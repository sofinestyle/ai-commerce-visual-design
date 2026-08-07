import assert from "node:assert/strict";
import { test } from "node:test";

import { loadTsModule } from "./helpers/loadTsModule.mjs";

function loadReview() {
  return loadTsModule("src/lib/ai-workspace/generatedImageQualityReview.ts");
}

function createImage() {
  return {
    id: "image-1",
    model: "gpt-image-2",
    prompt:
      "Create one standalone complete commercial product image. Do not create a collage, split screen, or multi-panel image.",
    url: "data:image/png;base64,abc",
  };
}

function createViolinPromptImage(promptExtra = "") {
  return {
    ...createImage(),
    prompt: [
      "Create one standalone complete commercial product image. Do not create a collage, split screen, or multi-panel image.",
      "Preserve violin-specific structure: scroll, pegs, fingerboard, bridge, four continuous strings, f-holes, tailpiece, body curves, varnish gloss, and realistic proportions.",
      "This is a 4/4 full-size violin; keep adult full-size proportions accurate.",
      "Accessories are factual boundaries; show them only for set-content images or when explicitly requested.",
      promptExtra,
    ].join(" "),
  };
}

function createViolinFacts(patch = {}) {
  return {
    brand: "YorRay",
    category: "小提琴",
    color: "亮光棕色",
    id: "product-1",
    material: "面板：夹板；背板：夹板；拉弦板：碳纤；琴弦：铝镁合金",
    name: "夹板普及小提琴",
    size: "4/4",
    sku: "N101-BR",
    ...patch,
  };
}

function createValidation(score = 96, valid = true) {
  return {
    duplicateConstraints: [],
    genericPlaceholders: [],
    invalidVisibleCopy: [],
    missingFacts: [],
    missingSceneElements: [],
    referenceRoleIssues: [],
    score,
    valid,
  };
}

test("local generated image review passes a complete generation record", () => {
  const { reviewGeneratedImages } = loadReview();
  const review = reviewGeneratedImages({
    actualImageModel: "gpt-image-2",
    images: [createImage()],
    promptValidation: createValidation(),
    referenceImageCount: 2,
    requestedImageCount: 1,
    requestedImageModel: "gpt-image-2",
  });

  assert.equal(review.status, "usable");
  assert.equal(review.decision, "pass");
  assert.equal(review.retryRecommended, false);
  assert.equal(review.reviewer, "local-heuristic-v1");
  assert.ok(review.score >= 90);
});

test("local generated image review asks for review when candidate count differs", () => {
  const { reviewGeneratedImages } = loadReview();
  const review = reviewGeneratedImages({
    actualImageModel: "gpt-image-2",
    images: [createImage()],
    promptValidation: createValidation(),
    referenceImageCount: 2,
    requestedImageCount: 3,
    requestedImageModel: "gpt-image-2",
  });

  assert.equal(review.status, "needs_review");
  assert.equal(review.decision, "usable_with_caveats");
  assert.equal(review.retryRecommended, false);
  assert.match(
    review.checks.find((check) => check.id === "candidate-count")?.message || "",
    /请求 3 张，实际返回 1 张/,
  );
});

test("local generated image review blocks low-score invalid prompt output", () => {
  const { reviewGeneratedImages } = loadReview();
  const review = reviewGeneratedImages({
    actualImageModel: "gpt-image-2",
    images: [createImage()],
    promptValidation: {
      ...createValidation(62, false),
      missingFacts: ["Product: solid wood violin"],
    },
    referenceImageCount: 2,
    requestedImageCount: 1,
    requestedImageModel: "gpt-image-2",
  });

  assert.equal(review.status, "not_recommended");
  assert.equal(review.decision, "retry");
  assert.equal(review.retryRecommended, true);
  assert.ok(review.score < 80);
});

test("local generated image review blocks visible logo prompt without brand_logo reference", () => {
  const { reviewGeneratedImages } = loadReview();
  const review = reviewGeneratedImages({
    actualImageModel: "gpt-image-2",
    images: [
      {
        ...createImage(),
        prompt:
          "Create one standalone complete commercial product image. Do not create a collage, split screen, or multi-panel image. Must show the visible logo on the violin case.",
      },
    ],
    promptValidation: createValidation(),
    referenceImageCount: 1,
    referenceImages: [{ id: "front", type: "front", url: "/media/front.jpg" }],
    requestedImageCount: 1,
    requestedImageModel: "gpt-image-2",
  });

  assert.equal(review.status, "not_recommended");
  assert.equal(review.decision, "needs_input");
  assert.equal(review.retryRecommended, false);
  assert.ok(review.failureTypes.includes("LOGO_REFERENCE_MISSING"));
  assert.equal(
    review.checks.find((check) => check.id === "brand-logo-reference")?.status,
    "fail",
  );
});

test("local generated image review accepts visible logo prompt with brand_logo reference", () => {
  const { reviewGeneratedImages } = loadReview();
  const review = reviewGeneratedImages({
    actualImageModel: "gpt-image-2",
    images: [
      {
        ...createImage(),
        prompt:
          "Create one standalone complete commercial product image. Do not create a collage, split screen, or multi-panel image. Use the selected logo reference as the source of truth for the visible logo.",
      },
    ],
    promptValidation: createValidation(),
    referenceImageCount: 2,
    referenceImages: [
      { id: "logo", type: "brand_logo", url: "/media/logo.png" },
      { id: "front", type: "front", url: "/media/front.jpg" },
    ],
    requestedImageCount: 1,
    requestedImageModel: "gpt-image-2",
  });

  assert.equal(review.status, "usable");
  assert.equal(review.decision, "pass");
  assert.equal(
    review.checks.find((check) => check.id === "brand-logo-reference")?.status,
    "pass",
  );
});


test("instrument review passes a violin prompt with structure, scale, and accessory boundaries", () => {
  const { reviewGeneratedImages } = loadReview();
  const review = reviewGeneratedImages({
    actualImageModel: "gpt-image-2",
    imageType: "主图",
    images: [createViolinPromptImage()],
    productFacts: createViolinFacts({
      accessories: "三角琴盒、琴弦、松香、塑料黑色肩托",
    }),
    promptValidation: createValidation(),
    referenceImageCount: 2,
    requestedImageCount: 1,
    requestedImageModel: "gpt-image-2",
    theme: "使用场景图",
  });

  assert.equal(review.status, "usable");
  assert.equal(
    review.checks.find((check) => check.id === "instrument-violin-structure")?.status,
    "pass",
  );
  assert.equal(
    review.checks.find((check) => check.id === "instrument-scale-positioning")?.status,
    "pass",
  );
});

test("instrument review flags violin prompts that omit key structure terms", () => {
  const { reviewGeneratedImages } = loadReview();
  const review = reviewGeneratedImages({
    actualImageModel: "gpt-image-2",
    imageType: "主图",
    images: [createImage()],
    productFacts: createViolinFacts(),
    promptValidation: createValidation(),
    referenceImageCount: 2,
    requestedImageCount: 1,
    requestedImageModel: "gpt-image-2",
    theme: "使用场景图",
  });

  assert.equal(review.status, "not_recommended");
  assert.equal(review.decision, "retry");
  assert.equal(review.maxAttempts, 3);
  assert.equal(
    review.checks.find((check) => check.id === "instrument-violin-structure")?.status,
    "fail",
  );
});

test("local generated image review stops after retryable critical max attempts", () => {
  const { reviewGeneratedImages } = loadReview();
  const review = reviewGeneratedImages({
    actualImageModel: "gpt-image-2",
    attempt: 3,
    imageType: "主图",
    images: [createImage()],
    productFacts: createViolinFacts(),
    promptValidation: createValidation(),
    referenceImageCount: 2,
    requestedImageCount: 1,
    requestedImageModel: "gpt-image-2",
    theme: "使用场景图",
  });

  assert.equal(review.status, "not_recommended");
  assert.equal(review.decision, "fail_stop");
  assert.equal(review.retryRecommended, false);
  assert.equal(review.attempt, 3);
  assert.equal(review.maxAttempts, 3);
});

test("instrument review blocks miniature craft violins without scale-safe wording", () => {
  const { reviewGeneratedImages } = loadReview();
  const review = reviewGeneratedImages({
    actualImageModel: "gpt-image-2",
    imageType: "主图",
    images: [
      {
        ...createViolinPromptImage(),
        prompt:
          "Create one standalone complete commercial product image. Do not create a collage, split screen, or multi-panel image. Preserve violin-specific structure: scroll, pegs, fingerboard, bridge, four continuous strings, f-holes, tailpiece, body curves, varnish gloss, and realistic proportions.",
      },
    ],
    productFacts: createViolinFacts({
      name: "1/64工艺小提琴",
      size: "1/64",
    }),
    promptValidation: createValidation(),
    referenceImageCount: 2,
    requestedImageCount: 1,
    requestedImageModel: "gpt-image-2",
    theme: "使用场景图",
  });

  assert.equal(review.status, "not_recommended");
  assert.equal(
    review.checks.find((check) => check.id === "instrument-scale-positioning")?.status,
    "fail",
  );
});
