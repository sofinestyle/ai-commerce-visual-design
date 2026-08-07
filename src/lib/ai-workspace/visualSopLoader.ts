import { readFile } from "fs/promises";
import path from "path";

import { parseRuleCard } from "@/lib/ai-workspace/ruleCardParser";
import { resolveRuleId } from "@/lib/ai-workspace/ruleIdMap";
import type { ImageType, Platform } from "@/lib/ai-workspace/types";
import { getPlatformRuleWithBaseline } from "@/lib/ai-workspace/platformRuleStore";

const visualSopFileByPlatform: Record<Platform, string> = {
  Amazon: "03_VISUAL_SOP_v1.0_Amazon.md",
  TEMU: "03_VISUAL_SOP_v1.0_TEMU.md",
  SHEIN: "03_VISUAL_SOP_v1.0_SHEIN.md",
  天猫: "03_VISUAL_SOP_v1.0_Tmall.md",
  抖店: "03_VISUAL_SOP_v1.0_Doudian.md",
  独立站: "03_VISUAL_SOP_v1.0_IndependentSite.md",
};

function getVisualSopPath(platform: Platform) {
  return path.join(process.cwd(), "docs", visualSopFileByPlatform[platform]);
}

export async function loadVisualRule(input: {
  platform: Platform;
  imageType: ImageType;
  theme: string;
}) {
  const customRule = await getPlatformRuleWithBaseline(input);

  if (customRule) {
    return customRule;
  }

  const ruleId = resolveRuleId(input);

  if (!ruleId) {
    throw new Error("未找到对应视觉规则。");
  }

  const filePath = getVisualSopPath(input.platform);
  const markdown = await readFile(filePath, "utf8");
  const visualRule = parseRuleCard(markdown, ruleId);

  if (!visualRule) {
    throw new Error(`未找到对应视觉规则：${ruleId}`);
  }

  if (visualRule.theme !== input.theme) {
    throw new Error(`视觉规则主题不匹配：${ruleId}`);
  }

  return visualRule;
}
