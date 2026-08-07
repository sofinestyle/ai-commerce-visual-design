import { getPlatformRulePlatform } from "@/lib/ai-workspace/themeMap";
import type { ImageType, Platform, PlatformRulePlatform } from "@/lib/ai-workspace/types";

const ruleIdByPlatformPrefix: Record<PlatformRulePlatform, string> = {
  跨境货架平台: "CROSS",
  内容与自营平台: "CONTENT",
};

const ruleSlugByImageTypeAndTheme: Record<ImageType, Record<string, string>> = {
  主图: {
    首图: "MAIN_HERO",
    产品图: "MAIN_PRODUCT",
    使用场景图: "MAIN_LIFESTYLE",
  },
  详情页: {
    详情页: "DETAIL_CONTENT",
  },
};

export function resolveRuleId(input: {
  platform: Platform | PlatformRulePlatform;
  imageType: ImageType;
  theme: string;
}) {
  const platformRulePlatform =
    input.platform === "跨境货架平台" || input.platform === "内容与自营平台"
      ? input.platform
      : getPlatformRulePlatform(input.platform);
  const prefix = ruleIdByPlatformPrefix[platformRulePlatform];
  const slug = ruleSlugByImageTypeAndTheme[input.imageType]?.[input.theme];

  if (!prefix || !slug) {
    return null;
  }

  return `${prefix}_${slug}`;
}
