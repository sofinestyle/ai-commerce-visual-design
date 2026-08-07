import assert from "node:assert/strict";
import { test } from "node:test";

import { loadTsModule } from "./helpers/loadTsModule.mjs";

function createContext() {
  return {
    designIntent:
      "一把小提琴立于浅色摄影棚中央，柔和侧光突出棕色漆面，背景干净克制。",
    imageType: "主图",
    language: {
      code: "en",
      label: "英文",
      promptName: "English",
      visibleTextInstruction: "Use English text",
    },
    outputSpecification: {
      aspectRatio: "1:1",
      imageCount: 4,
      imageType: "主图",
      outputSize: "1024x1024",
      platform: "TEMU",
      theme: "使用场景图",
    },
    platform: "TEMU",
    productFacts: {
      brand: "YorRay",
      color: "亮光棕色",
      id: "product-1",
      material: "面板：夹板；背板：夹板；拉弦板：碳纤；琴弦：铝镁合金",
      name: "夹板普及小提琴",
      size: "4/4",
      sku: "N101-BR",
    },
    referenceImages: [
      { id: "front", type: "Front", url: "/media/front.jpg" },
      { id: "logo", type: "brand_logo", url: "/media/logo.png" },
    ],
    theme: "使用场景图",
    visibleCopy: {
      enabled: true,
      headline: "4/4 Glossy Brown Violin",
      placementHint: "Top-left copy space",
      subheadline: "Laminated top and back",
    },
    visualRule: {
      designObjective: "建立真实使用场景，帮助用户理解商品适用环境。",
      mediaGuidance: { primary: ["Front"], secondary: ["Brand Logo"] },
      promptGuidance: {
        avoid: ["Complex Layout", "Too Much Text"],
        focus: ["Product Accuracy", "Mobile Readability"],
      },
      ruleId: "TEMU_MAIN_LIFESTYLE",
      theme: "使用场景图",
      visualSpecification: {
        Background: "Light Neutral Preferred",
        "Copy Space": "Allowed / Minimal Copy Space",
        Logo: "Allowed",
        "Product Ratio": "85%",
      },
    },
  };
}

test("workspace prompt builder emits five concise sections without raw workspace dump", () => {
  const { buildWorkspacePrompt } = loadTsModule(
    "src/lib/ai-workspace/promptBuilder.ts",
  );
  const prompt = buildWorkspacePrompt(createContext());

  assert.match(prompt.englishPrompt, /^Task:/m);
  assert.match(prompt.englishPrompt, /^Product Accuracy:/m);
  assert.match(prompt.englishPrompt, /^Effective Scene Direction:/m);
  assert.match(prompt.englishPrompt, /^Visible Copy:/m);
  assert.match(prompt.englishPrompt, /^Compliance Constraints:/m);
  assert.doesNotMatch(prompt.englishPrompt, /Workspace context that must be followed/i);
  assert.doesNotMatch(prompt.englishPrompt, /Visual SOP Rule ID/i);
  assert.doesNotMatch(prompt.englishPrompt, /SKU:/i);
  assert.doesNotMatch(prompt.englishPrompt, /4 variant\(s\)|generate 4 images/i);
  assert.doesNotMatch(prompt.englishPrompt, /[\u3400-\u9fff]/);
  assert.match(prompt.englishPrompt, /Use the 2 confirmed reference image\(s\) only for visual accuracy/i);
  assert.match(prompt.englishPrompt, /Do not copy references as inset images, multi-view layouts, or reference sheets/i);
  assert.match(prompt.englishPrompt, /logo reference as the only source of truth/i);
  assert.match(prompt.englishPrompt, /4\/4 Glossy Brown Violin/);
  assert.doesNotMatch(prompt.englishPrompt, /within 20[–-]25% of the canvas/i);
  assert.match(prompt.englishPrompt, /visually compete with the product/i);
  assert.match(prompt.englishPrompt, /clear hierarchy/i);
  assert.doesNotMatch(prompt.englishPrompt, /maximum 3 bullet lines/i);
  assert.doesNotMatch(prompt.englishPrompt, /18[–-]22% of the canvas width/i);
  assert.match(prompt.englishPrompt, /Photography profile: commercial product photography/i);
  assert.match(prompt.englishPrompt, /eye-level natural 50mm perspective/i);
  assert.match(prompt.englishPrompt, /beginner laminated violin/i);
  assert.match(prompt.englishPrompt, /glossy brown/i);
  assert.match(prompt.englishPrompt, /laminated top, laminated back, carbon fiber tailpiece, aluminum-magnesium alloy strings/i);
});

test("workspace prompt builder translates common Chinese scene directions to English", () => {
  const { buildWorkspacePrompt } = loadTsModule(
    "src/lib/ai-workspace/promptBuilder.ts",
  );
  const context = createContext();
  const prompt = buildWorkspacePrompt({
    ...context,
    designIntent:
      "场景中，乐器主体置于海边木质码头中央，远处蔚蓝海面与天空相接，细碎波光沿画面纵深延伸。黄金时刻的暖色侧光落在主体，远景保留细腻空气透视，画面开阔清新，呈现音乐与自然相遇的宁静时刻。",
  });

  assert.doesNotMatch(prompt.englishPrompt, /[\u3400-\u9fff]/);
  assert.match(prompt.englishPrompt, /wooden seaside dock/i);
  assert.match(prompt.englishPrompt, /blue sea and sky/i);
  assert.match(prompt.englishPrompt, /golden-hour side light/i);
  assert.match(prompt.englishPrompt, /music meets nature/i);
});

test("workspace prompt builder translates practice-room scene directions without Chinese residue", () => {
  const { buildWorkspacePrompt } = loadTsModule(
    "src/lib/ai-workspace/promptBuilder.ts",
  );
  const context = createContext();
  const prompt = buildWorkspacePrompt({
    ...context,
    designIntent:
      "场景中，小提琴立于浅色木质练习室中央，远处有模糊琴谱架和柔和窗光。暖色侧光沿琴身漆面形成细腻高光，背景保持安静、真实、克制，突出入门练习氛围。",
  });

  assert.doesNotMatch(prompt.englishPrompt, /[\u3400-\u9fff]/);
  assert.match(prompt.englishPrompt, /light wood practice room/i);
  assert.match(prompt.englishPrompt, /softly blurred music stand/i);
  assert.match(prompt.englishPrompt, /gentle window light/i);
  assert.match(prompt.englishPrompt, /entry-level daily practice atmosphere/i);
});

test("workspace prompt preserves uncovered Chinese design intent instead of replacing it with a generic fallback", () => {
  const { buildWorkspacePrompt } = loadTsModule(
    "src/lib/ai-workspace/promptBuilder.ts",
  );
  const context = createContext();
  const unknownChineseIntent =
    "场景中，小提琴悬浮在未来感透明音符装置旁，背景有银色声波轨迹和蓝紫色光线。";
  const prompt = buildWorkspacePrompt({
    ...context,
    designIntent: unknownChineseIntent,
  });

  assert.match(prompt.englishPrompt, new RegExp(unknownChineseIntent));
  assert.doesNotMatch(
    prompt.englishPrompt,
    /Create a specific, realistic, product-first ecommerce scene that follows the approved design intent/i,
  );
});

test("workspace prompt preserves approved Chinese visible copy while translating instructions", () => {
  const { buildWorkspacePrompt } = loadTsModule(
    "src/lib/ai-workspace/promptBuilder.ts",
  );
  const context = createContext();
  const prompt = buildWorkspacePrompt({
    ...context,
    language: {
      code: "zh-CN",
      label: "中文",
      promptName: "Simplified Chinese",
      visibleTextInstruction: "Use Simplified Chinese text",
    },
    visibleCopy: {
      enabled: true,
      headline: "让音乐自然发生",
      placementHint: "画面左上留白",
      sellingPoints: ["云杉面板", "乌木配件", "4/4标准尺寸"],
      subheadline: "清晰呈现每一处细节",
    },
  });

  assert.match(prompt.englishPrompt, /Headline: "让音乐自然发生"/);
  assert.match(prompt.englishPrompt, /Subheadline: "清晰呈现每一处细节"/);
  assert.match(prompt.englishPrompt, /Selling point bullets: "云杉面板", "乌木配件", "4\/4标准尺寸"/);
  assert.doesNotMatch(prompt.englishPrompt, /Let music happen naturally/i);
  assert.doesNotMatch(prompt.englishPrompt, /Spruce top/i);
  assert.match(prompt.englishPrompt, /Product: beginner laminated violin/i);
  assert.doesNotMatch(prompt.englishPrompt, /Product: .*夹板普及小提琴/);
  assert.match(prompt.englishPrompt, /soft side lighting highlights the brown varnish/i);
});

test("workspace prompt preserves solid wood violin product facts instead of generic fallbacks", () => {
  const { buildWorkspacePrompt } = loadTsModule(
    "src/lib/ai-workspace/promptBuilder.ts",
  );
  const context = createContext();
  const prompt = buildWorkspacePrompt({
    ...context,
    productFacts: {
      brand: "YorRay",
      category: "小提琴",
      color: "黑色",
      id: "product-2",
      material:
        "面板：云杉，背板：无花纹枫木，配件：乌木，拉弦板：乌木，琴弦：Alice铝镁合金琴弦",
      name: "黑色实木小提琴",
      packaging: "彩盒",
      size: "44",
      sku: "L201-BK",
    },
  });

  assert.match(prompt.englishPrompt, /Product: black solid wood violin/i);
  assert.match(prompt.englishPrompt, /Color: black/i);
  assert.match(prompt.englishPrompt, /Size: 4\/4/i);
  assert.match(prompt.englishPrompt, /spruce top/i);
  assert.match(prompt.englishPrompt, /plain maple back/i);
  assert.match(prompt.englishPrompt, /ebony fittings/i);
  assert.match(prompt.englishPrompt, /ebony tailpiece/i);
  assert.match(prompt.englishPrompt, /Alice aluminum-magnesium alloy strings/i);
  assert.doesNotMatch(prompt.englishPrompt, /color box/i);
  assert.match(prompt.englishPrompt, /Do not alter verified product facts/i);
  assert.doesNotMatch(prompt.englishPrompt, /verified product color/i);
  assert.doesNotMatch(prompt.englishPrompt, /verified product materials/i);
});

test("workspace prompt aligns reference guidance with selected reference images", () => {
  const { buildWorkspacePrompt } = loadTsModule(
    "src/lib/ai-workspace/promptBuilder.ts",
  );
  const context = createContext();
  const prompt = buildWorkspacePrompt({
    ...context,
    referenceImages: [
      { id: "logo", type: "brand_logo", url: "/media/logo.png" },
      { id: "front", type: "front", url: "/media/front.jpg" },
    ],
    visualRule: {
      ...context.visualRule,
      mediaGuidance: { primary: ["Front", "Back"], secondary: ["Side"] },
    },
  });

  assert.match(prompt.englishPrompt, /Provided reference roles: Brand Logo, Front/i);
  assert.doesNotMatch(prompt.englishPrompt, /Primary accuracy guidance/i);
  assert.doesNotMatch(prompt.englishPrompt, /reference guidance was requested by the rule/i);
  assert.doesNotMatch(prompt.englishPrompt, /do not invent unseen back, side details/i);
  assert.doesNotMatch(prompt.englishPrompt, /Reference roles: Image 1/i);
});

test("prompt model branch keeps structured output without appending workspace context", async () => {
  const { buildWorkspacePrompt } = loadTsModule(
    "src/lib/ai-workspace/promptBuilder.ts",
  );
  const structuredEnglishPrompt = buildWorkspacePrompt(createContext()).englishPrompt;
  const { generateWorkspacePromptCandidates } = loadTsModule(
    "src/lib/ai-workspace/promptGenerationService.ts",
    {
      stubs: {
        "@/lib/ai-workspace/promptModelConfig": {
          defaultPromptModel: "mock-prompt-model",
          getDefaultPromptModelConfig: () => ({
            apiModel: "mock-api-model",
            enabled: true,
            id: "mock-prompt-model",
            label: "Mock Prompt Model",
            provider: "openai-compatible",
          }),
          getPromptModelConfigAsync: async () => ({
            apiModel: "mock-api-model",
            enabled: true,
            id: "mock-prompt-model",
            label: "Mock Prompt Model",
            provider: "openai-compatible",
          }),
        },
        "@/lib/ai-workspace/promptProviderFactory": {
          promptProviderFactory: {
            generate: async () =>
              JSON.stringify({
                chinesePromptSummary: "五段结构化主图提示词。",
                englishPrompt: structuredEnglishPrompt,
              }),
            isConfigured: () => true,
          },
        },
      },
    },
  );

  const [candidate] = await generateWorkspacePromptCandidates({
    generationContext: createContext(),
    promptModels: ["mock-prompt-model"],
  });

  assert.equal(candidate.source, "model");
  assert.equal(candidate.englishPrompt, structuredEnglishPrompt);
  assert.equal(candidate.promptValidation.valid, true);
  assert.doesNotMatch(candidate.englishPrompt, /Workspace context that must be followed/i);
  assert.doesNotMatch(candidate.englishPrompt, /Visual SOP Rule ID/i);
});

test("prompt model branch falls back when five-section output drops required facts", async () => {
  const incompleteStructuredPrompt = [
    "Task:\nCreate one standalone composition in each output image.",
    "Product Accuracy:\nPreserve the product accurately.",
    "Effective Scene Direction:\nUse a clean realistic studio scene.",
    "Visible Copy:\nRender the approved English copy exactly.",
    "Compliance Constraints:\nDo not create a collage, split screen, or multi-view canvas.",
  ].join("\n\n");
  const { generateWorkspacePromptCandidates } = loadTsModule(
    "src/lib/ai-workspace/promptGenerationService.ts",
    {
      stubs: {
        "@/lib/ai-workspace/promptModelConfig": {
          defaultPromptModel: "mock-prompt-model",
          getDefaultPromptModelConfig: () => ({
            apiModel: "mock-api-model",
            enabled: true,
            id: "mock-prompt-model",
            label: "Mock Prompt Model",
            provider: "openai-compatible",
          }),
          getPromptModelConfigAsync: async () => ({
            apiModel: "mock-api-model",
            enabled: true,
            id: "mock-prompt-model",
            label: "Mock Prompt Model",
            provider: "openai-compatible",
          }),
        },
        "@/lib/ai-workspace/promptProviderFactory": {
          promptProviderFactory: {
            generate: async () =>
              JSON.stringify({
                chinesePromptSummary: "五段结构化主图提示词。",
                englishPrompt: incompleteStructuredPrompt,
              }),
            isConfigured: () => true,
          },
        },
      },
    },
  );

  const [candidate] = await generateWorkspacePromptCandidates({
    generationContext: createContext(),
    promptModels: ["mock-prompt-model"],
  });

  assert.equal(candidate.source, "fallback");
  assert.match(candidate.fallbackReason, /语义校验/);
  assert.match(candidate.englishPrompt, /beginner laminated violin/i);
  assert.match(candidate.englishPrompt, /Provided reference roles: Front, Brand Logo/i);
});

test("brand other reference images are treated as brand assets in prompt validation", () => {
  const { buildWorkspacePrompt } = loadTsModule(
    "src/lib/ai-workspace/promptBuilder.ts",
  );
  const { validateWorkspacePrompt } = loadTsModule(
    "src/lib/ai-workspace/promptSemanticValidator.ts",
  );
  const context = {
    ...createContext(),
    referenceImages: [
      { id: "front", type: "Front", url: "/media/front.jpg" },
      { id: "logo", type: "brand_logo", url: "/media/logo.png" },
      { id: "brand-guide", type: "brand_other", url: "/media/brand-guide.png" },
    ],
  };
  const prompt = buildWorkspacePrompt(context);
  const validation = validateWorkspacePrompt(prompt.englishPrompt, context);

  assert.match(prompt.englishPrompt, /Provided reference roles: Front, Brand Logo, Brand Asset/i);
  assert.equal(validation.referenceRoleIssues.length, 0);
  assert.doesNotMatch(validation.referenceRoleIssues.join(" "), /brand_other/i);
});

test("prompt validation catches enabled visible copy without layout controls", () => {
  const { validateWorkspacePrompt } = loadTsModule(
    "src/lib/ai-workspace/promptSemanticValidator.ts",
  );
  const context = createContext();
  const promptWithoutLayoutControls = [
    "Task:\nCreate one standalone complete commercial product image. Do not create collages, panels, or multiple canvases.",
    "Product Accuracy:\nBrand: YorRay. Product: beginner laminated violin. Category: violin. Color: glossy brown. Size: 4/4. Material: laminated top, laminated back, carbon fiber tailpiece, aluminum-magnesium alloy strings. Preserve violin-specific structure: scroll, pegs, fingerboard, bridge, four continuous strings, f-holes, tailpiece, body curves, varnish gloss, and realistic proportions. Reference roles: Image 1: Front; Image 2: brand_logo.",
    "Effective Scene Direction:\nUse a clean realistic studio scene with soft side lighting highlights the brown varnish.",
    "Visible Copy:\nRender approved copy exactly. Headline: \"4/4 Glossy Brown Violin\". Subheadline: \"Laminated top and back\". Copy placement: Top-left copy space.",
    "Compliance Constraints:\nReference images are accuracy sources only and must not appear as separate inset images. Do not create a collage, triptych, contact sheet, split screen, comparison layout, storyboard, multi-panel image, or multiple product views within one canvas.",
  ].join("\n\n");

  const validation = validateWorkspacePrompt(promptWithoutLayoutControls, context);

  assert.equal(validation.valid, false);
  assert.match(validation.duplicateConstraints.join("; "), /visible copy product priority/);
  assert.match(validation.duplicateConstraints.join("; "), /visible copy hierarchy/);
});

test("prompt validation does not treat verified accessory and packaging boundaries as generic placeholders", () => {
  const { buildWorkspacePrompt } = loadTsModule(
    "src/lib/ai-workspace/promptBuilder.ts",
  );
  const { validateWorkspacePrompt } = loadTsModule(
    "src/lib/ai-workspace/promptSemanticValidator.ts",
  );
  const baseContext = createContext();
  const context = {
    ...baseContext,
    productFacts: {
      ...baseContext.productFacts,
      accessories: "三角琴盒、琴弦、松香、塑料黑色肩托",
      packaging: "牛皮纸外箱",
    },
  };
  const prompt = buildWorkspacePrompt(context);
  const validation = validateWorkspacePrompt(prompt.englishPrompt, context);

  assert.deepEqual(validation.genericPlaceholders, []);
  assert.equal(validation.valid, true);
});
