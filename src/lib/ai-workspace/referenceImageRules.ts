import type { ImageType } from "@/lib/ai-workspace/types";

export type ReferenceImageRole =
  | "front"
  | "back"
  | "side"
  | "detail"
  | "accessories"
  | "packaging"
  | "brand_logo"
  | "brand_asset"
  | "reference"
  | "ai_generated"
  | "user_upload";

export type ReferenceImageRule = {
  roles: ReferenceImageRole[];
  defaultCount: number;
  maxCount: number;
};

function normalizeRoleText(value?: string | null) {
  return value?.trim().toLowerCase().replace(/[_\s-]+/g, "_") || "";
}

export function normalizeReferenceImageRole(value?: string | null): ReferenceImageRole | null {
  const normalized = normalizeRoleText(value);

  if (["front", "正面图", "正面"].map(normalizeRoleText).includes(normalized)) return "front";
  if (["back", "背面图", "背面"].map(normalizeRoleText).includes(normalized)) return "back";
  if (["side", "侧面图", "侧面"].map(normalizeRoleText).includes(normalized)) return "side";
  if (["detail", "细节图", "细节"].map(normalizeRoleText).includes(normalized)) return "detail";
  if (["accessories", "accessory", "配件图", "配件"].map(normalizeRoleText).includes(normalized)) {
    return "accessories";
  }
  if (["packaging", "package", "包装图", "包装"].map(normalizeRoleText).includes(normalized)) {
    return "packaging";
  }
  if (["brand_logo", "logo", "品牌_logo", "品牌 logo"].map(normalizeRoleText).includes(normalized)) {
    return "brand_logo";
  }
  if (
    ["brand_asset", "brand_other", "品牌素材", "品牌其他资料", "品牌资料"].map(normalizeRoleText).includes(normalized)
  ) {
    return "brand_asset";
  }
  if (["reference", "参考图", "参考"].map(normalizeRoleText).includes(normalized)) {
    return "reference";
  }
  if (["ai_generated", "生成图", "ai生成图"].map(normalizeRoleText).includes(normalized)) {
    return "ai_generated";
  }
  if (["user_upload", "用户上传图", "上传图"].map(normalizeRoleText).includes(normalized)) {
    return "user_upload";
  }

  return null;
}

const ruleMap: Record<ImageType, Record<string, ReferenceImageRule>> = {
  主图: {
    首图: {
      roles: ["front", "accessories", "packaging"],
      defaultCount: 1,
      maxCount: 3,
    },
    产品图: {
      roles: ["front", "detail", "accessories", "packaging", "brand_logo"],
      defaultCount: 2,
      maxCount: 6,
    },
    使用场景图: {
      roles: ["front", "detail", "brand_logo", "reference"],
      defaultCount: 2,
      maxCount: 6,
    },
  },
  详情页: {
    详情页: {
      roles: ["front", "detail", "accessories", "packaging", "brand_logo"],
      defaultCount: 2,
      maxCount: 6,
    },
  },
};

export function getReferenceImageRule(imageType: ImageType, theme: string) {
  return ruleMap[imageType]?.[theme];
}
