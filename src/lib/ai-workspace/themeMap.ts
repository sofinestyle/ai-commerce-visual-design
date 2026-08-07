import type { ImageType, Platform, PlatformRulePlatform } from "@/lib/ai-workspace/types";
import { getRecommendedOutputSpec } from "@/lib/ai-workspace/outputSpecMap";

export const platforms: Platform[] = ["Amazon", "TEMU", "SHEIN", "天猫", "抖店", "独立站"];

export const platformRulePlatforms: PlatformRulePlatform[] = ["跨境货架平台", "内容与自营平台"];

export const imageTypes: ImageType[] = ["主图", "详情页"];

export const themeMap: Record<ImageType, string[]> = {
  主图: ["首图", "产品图", "使用场景图"],
  详情页: ["详情页"],
};

export function getThemesByImageType(imageType: ImageType) {
  return themeMap[imageType];
}

export function getDefaultTheme(imageType: ImageType) {
  return themeMap[imageType][0];
}

export function getOutputDefaults(platform: Platform, imageType: ImageType) {
  return getRecommendedOutputSpec(platform, imageType);
}

export function getPlatformRulePlatform(platform: Platform): PlatformRulePlatform {
  return platform === "Amazon" || platform === "TEMU" || platform === "SHEIN"
    ? "跨境货架平台"
    : "内容与自营平台";
}

export function toLegacyPlatform(platform: Platform) {
  const legacyMap: Record<Platform, string> = {
    Amazon: "Amazon",
    TEMU: "Temu",
    SHEIN: "SHEIN",
    天猫: "Tmall",
    抖店: "TikTok",
    独立站: "Shopify",
  };

  return legacyMap[platform];
}

export function toLegacyImageType(imageType: ImageType) {
  const legacyMap: Record<ImageType, string> = {
    主图: "Main Image",
    详情页: "Detail",
  };

  return legacyMap[imageType];
}
