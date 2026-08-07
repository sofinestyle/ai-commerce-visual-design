import assert from "node:assert/strict";
import { test } from "node:test";

import { loadTsModule } from "./helpers/loadTsModule.mjs";

const { findBrandLogoReferenceImage } = loadTsModule(
  "src/lib/ai-workspace/referenceImageSelector.ts",
);
const { buildWorkspacePrompt } = loadTsModule(
  "src/lib/ai-workspace/promptBuilder.ts",
);

test("brand logo selector chooses an image asset and excludes PDFs", () => {
  const logo = findBrandLogoReferenceImage([
    {
      filename: "brand-guide.pdf",
      id: "pdf",
      mimeType: "application/pdf",
      source: "brand_asset",
      tags: ["usage:brand_logo"],
      url: "/media/brand-guide.pdf",
    },
    {
      filename: "yor-ray-logo.png",
      id: "logo",
      mimeType: "image/png",
      source: "brand_asset",
      status: "final",
      tags: ["usage:brand_logo"],
      url: "/media/yor-ray-logo.png",
    },
  ]);

  assert.equal(logo.id, "logo");
  assert.equal(logo.type, "brand_logo");
});

test("brand logo selector excludes AI-generated pseudo logo assets", () => {
  const logo = findBrandLogoReferenceImage([
    {
      filename: "ai-logo.png",
      id: "ai-logo",
      mimeType: "image/png",
      source: "AI",
      tags: ["usage:brand_logo"],
      url: "/media/ai-logo.png",
    },
    {
      filename: "true-logo.png",
      id: "true-logo",
      mimeType: "image/png",
      source: "brand_asset",
      tags: ["usage:brand_logo"],
      url: "/media/true-logo.png",
    },
  ]);

  assert.equal(logo.id, "true-logo");
  assert.equal(logo.type, "brand_logo");
});


test("workspace prompt treats the original brand logo as the source of truth", () => {
  const prompt = buildWorkspacePrompt({
    designIntent: "突出品牌识别",
    imageType: "详情页",
    language: {
      code: "zh-CN",
      label: "中文",
      promptName: "Chinese",
      visibleTextInstruction: "Use Chinese text",
    },
    outputSpecification: {
      imageCount: 1,
      imageType: "详情页",
      platform: "天猫",
      theme: "产品图",
    },
    platform: "天猫",
    productFacts: {
      brand: "YorRay",
      id: "product-1",
      name: "小提琴",
      sku: "L101-BR",
    },
    referenceImages: [
      {
        id: "logo",
        type: "brand_logo",
        url: "/media/yor-ray-logo.png",
      },
    ],
    theme: "产品图",
    visualRule: {
      designObjective: "突出产品与品牌",
      mediaGuidance: { primary: [], secondary: [] },
      promptGuidance: { avoid: [], focus: [] },
      ruleId: "tmall-detail",
      theme: "产品图",
      visualSpecification: {},
    },
  });

  assert.match(
    prompt.englishPrompt,
    /Use the logo reference as the only source of truth when logo display is allowed/i,
  );
  assert.match(prompt.englishPrompt, /do not redraw, restyle, misspell, approximate, or invent branding/i);
  assert.match(prompt.chinesePromptSummary, /已加载品牌 Logo 原图/);
});

test("workspace prompt forbids visible logos when no true logo asset is selected", () => {
  const prompt = buildWorkspacePrompt({
    designIntent: "突出品牌识别，但素材库没有 logo 文件",
    imageType: "详情页",
    language: {
      code: "zh-CN",
      label: "中文",
      promptName: "Chinese",
      visibleTextInstruction: "Use Chinese text",
    },
    outputSpecification: {
      imageCount: 1,
      imageType: "详情页",
      platform: "天猫",
      theme: "产品图",
    },
    platform: "天猫",
    productFacts: {
      brand: "YorRay",
      id: "product-1",
      name: "小提琴",
      sku: "L101-BR",
    },
    referenceImages: [
      {
        id: "front",
        type: "front",
        url: "/media/front.jpg",
      },
    ],
    theme: "产品图",
    visualRule: {
      designObjective: "突出产品与品牌",
      mediaGuidance: { primary: [], secondary: [] },
      promptGuidance: { avoid: [], focus: [] },
      ruleId: "tmall-detail",
      theme: "产品图",
      visualSpecification: {},
    },
  });

  assert.match(prompt.englishPrompt, /No verified logo reference is provided/i);
  assert.match(prompt.englishPrompt, /Do not create, approximate, redraw, spell, or hallucinate any visible logo/i);
  assert.match(prompt.chinesePromptSummary, /未加载品牌 Logo 原图/);
  assert.doesNotMatch(prompt.chinesePromptSummary, /已加载品牌 Logo 原图/);
});


test("workspace prompt keeps output count separate from a single image composition", () => {
  const prompt = buildWorkspacePrompt({
    designIntent: "采用整洁制琴工坊背景，辅助展现乐器制作语境。",
    imageType: "主图",
    language: {
      code: "en-US",
      label: "英文",
      promptName: "English",
      visibleTextInstruction: "Use English text",
    },
    outputSpecification: {
      aspectRatio: "1:1",
      imageCount: 3,
      imageType: "主图",
      outputSize: "1024x1024",
      platform: "Amazon",
      theme: "产品图",
    },
    platform: "Amazon",
    productFacts: {
      brand: "YorRay",
      id: "product-2",
      name: "深棕色实木小提琴",
      sku: "L201-DB",
    },
    referenceImages: [
      { id: "front", type: "Front", url: "/media/front.jpg" },
      { id: "back", type: "Back", url: "/media/back.jpg" },
      { id: "side", type: "Side", url: "/media/side.jpg" },
    ],
    theme: "产品图",
    visualRule: {
      designObjective: "展示产品整体外观，建立第一层产品信任。",
      mediaGuidance: { primary: ["Front", "Back", "Side"], secondary: [] },
      promptGuidance: { avoid: [], focus: [] },
      ruleId: "AMZ_MAIN_PRODUCT",
      theme: "产品图",
      visualSpecification: { Background: "Pure White" },
    },
  });

  assert.match(
    prompt.englishPrompt,
    /Each API candidate must be an independent single-canvas image/i,
  );
  assert.match(
    prompt.englishPrompt,
    /never depict the output count, numbered variants, panels, collages, contact sheets, comparison views, or multiple canvases/i,
  );
  assert.match(prompt.englishPrompt, /^Task:/m);
  assert.match(prompt.englishPrompt, /^Product Accuracy:/m);
  assert.match(prompt.englishPrompt, /^Effective Scene Direction:/m);
  assert.match(prompt.englishPrompt, /^Visible Copy:/m);
  assert.match(prompt.englishPrompt, /^Compliance Constraints:/m);
  assert.match(prompt.englishPrompt, /Use the 3 confirmed reference image\(s\) only for visual accuracy/i);
  assert.match(prompt.englishPrompt, /Do not copy references as inset images, multi-view layouts, or reference sheets/i);
  assert.match(prompt.englishPrompt, /collages, split screens, comparison layouts/i);
  assert.doesNotMatch(prompt.englishPrompt, /3 variant\(s\)/i);
  assert.doesNotMatch(prompt.englishPrompt, /Workspace context that must be followed/i);
  assert.doesNotMatch(prompt.englishPrompt, /Visual SOP Rule ID/i);
  assert.doesNotMatch(prompt.englishPrompt, /SKU:/i);
  assert.doesNotMatch(prompt.englishPrompt, /制琴工坊背景/);
  assert.match(prompt.chinesePromptSummary, /系统将独立生成 3 张候选图/);
  assert.match(prompt.chinesePromptSummary, /严格遵循纯白背景规则/);
});
