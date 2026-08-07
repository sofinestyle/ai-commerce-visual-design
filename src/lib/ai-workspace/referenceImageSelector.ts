import type { ImageType, ReferenceImage, VisualRule } from "@/lib/ai-workspace/types";
import {
  getReferenceImageRule,
  normalizeReferenceImageRole,
  type ReferenceImageRole,
} from "@/lib/ai-workspace/referenceImageRules";

export type ReferenceImageCandidate = ReferenceImage & {
  filename?: string;
  mimeType?: string;
  source?: string;
  tags?: unknown;
};

export type ReferenceImageSelectionResult = {
  images: ReferenceImage[];
  missingBehavior?: string;
  missingRoles: ReferenceImageRole[];
  message?: string;
  requiredCount: number;
  ruleRoles: ReferenceImageRole[];
  usedFallback: boolean;
};

const roleDisplayNames: Record<ReferenceImageRole, string> = {
  accessories: "配件图",
  ai_generated: "生成图",
  back: "背面图",
  brand_asset: "品牌素材",
  brand_logo: "品牌 Logo",
  detail: "细节图",
  front: "正面图",
  packaging: "包装图",
  reference: "参考图",
  side: "侧面图",
  user_upload: "用户上传图",
};

function normalizeText(value?: string | null) {
  return value?.trim().toLowerCase().replace(/[_\s-]+/g, "_") || "";
}

function getTags(tags: unknown) {
  return Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === "string") : [];
}

function roleFromExactType(value?: string | null): ReferenceImageRole | null {
  return normalizeReferenceImageRole(value);
}

function roleFromSemanticTag(tag: string): ReferenceImageRole | null {
  const normalized = normalizeText(tag);
  const [rawKey, ...rawValueParts] = normalized.split(":");
  const value = rawValueParts.join(":");

  if (!value) {
    return roleFromExactType(normalized);
  }

  if (rawKey === "usage" || rawKey === "suggested_usage" || rawKey === "requested_type") {
    return roleFromExactType(value);
  }

  if (rawKey === "asset_domain" && value === "brand") {
    return "brand_asset";
  }

  return null;
}

function getCandidateRoles(candidate: ReferenceImageCandidate) {
  const roles = new Set<ReferenceImageRole>();
  const primaryRole = roleFromExactType(candidate.type);

  if (primaryRole) {
    roles.add(primaryRole);
  }

  for (const tag of getTags(candidate.tags)) {
    const tagRole = roleFromSemanticTag(tag);

    if (tagRole) {
      roles.add(tagRole);
    }
  }

  if (candidate.source === "AI") {
    roles.add("ai_generated");
  }

  if (candidate.source === "user_upload") {
    roles.add("user_upload");
  }

  return roles;
}

function mapMediaTypeToRole(value: string): ReferenceImageRole | null {
  const normalized = normalizeText(value);

  if (["front", "正面图", "白底图", "产品实拍图"].map(normalizeText).includes(normalized)) {
    return "front";
  }

  if (["back", "背面图"].map(normalizeText).includes(normalized)) {
    return "back";
  }

  if (["side", "侧面图"].map(normalizeText).includes(normalized)) {
    return "side";
  }

  if (["detail", "细节图", "材质图", "工艺图"].map(normalizeText).includes(normalized)) {
    return "detail";
  }

  if (["accessories", "配件图"].map(normalizeText).includes(normalized)) {
    return "accessories";
  }

  if (["packaging", "包装图"].map(normalizeText).includes(normalized)) {
    return "packaging";
  }

  if (["brand_logo", "品牌_logo", "品牌 logo"].map(normalizeText).includes(normalized)) {
    return "brand_logo";
  }

  if (["brand_asset", "brand_other", "品牌素材", "品牌其他资料", "场景图"].map(normalizeText).includes(normalized)) {
    return "brand_asset";
  }

  if (["reference", "参考图", "参考"].map(normalizeText).includes(normalized)) {
    return "reference";
  }

  if (["ai_generated", "生成图", "ai生成图"].map(normalizeText).includes(normalized)) {
    return "ai_generated";
  }

  if (["user_upload", "用户上传图", "上传图"].map(normalizeText).includes(normalized)) {
    return "user_upload";
  }

  return null;
}

function getVisualRuleSelection(visualRule?: VisualRule) {
  const mediaSelection = visualRule?.mediaSelection;

  if (!mediaSelection) {
    return null;
  }

  const roles = [
    ...mediaSelection.primaryTypes,
    ...mediaSelection.secondaryTypes,
  ]
    .map(mapMediaTypeToRole)
    .filter((role): role is ReferenceImageRole => Boolean(role));

  if (roles.length === 0) {
    return null;
  }

  return {
    defaultCount: Math.max(mediaSelection.minCount || 1, 1),
    missingBehavior: mediaSelection.missingBehavior,
    maxCount: Math.max(mediaSelection.maxCount || roles.length, 1),
    requiredCount: Math.max(mediaSelection.minCount || 0, 0),
    roles: [...new Set(roles)],
  };
}

function getStatusWeight(status?: string) {
  if (status === "final") return 3;
  if (status === "draft") return 2;
  if (status === "temporary") return 1;

  return 0;
}

function rankCandidates(
  candidates: ReferenceImageCandidate[],
  roles: ReferenceImageRole[],
) {
  return [...candidates].sort((left, right) => {
    const leftRoles = getCandidateRoles(left);
    const rightRoles = getCandidateRoles(right);
    const leftRoleIndex = roles.findIndex((role) => leftRoles.has(role));
    const rightRoleIndex = roles.findIndex((role) => rightRoles.has(role));
    const leftMatched = leftRoleIndex >= 0;
    const rightMatched = rightRoleIndex >= 0;

    if (leftMatched !== rightMatched) return leftMatched ? -1 : 1;
    if (leftMatched && rightMatched && leftRoleIndex !== rightRoleIndex) {
      return leftRoleIndex - rightRoleIndex;
    }

    return (
      getStatusWeight(right.status) - getStatusWeight(left.status) ||
      (right.qualityScore ?? 0) - (left.qualityScore ?? 0)
    );
  });
}

function isImageCandidate(candidate: ReferenceImageCandidate) {
  if (candidate.mimeType) {
    return candidate.mimeType.toLowerCase().startsWith("image/");
  }

  return /\.(?:jpe?g|png|webp)(?:\?.*)?$/i.test(candidate.url);
}

function hasBrandLogoSignal(candidate: ReferenceImageCandidate) {
  if (getCandidateRoles(candidate).has("brand_logo")) {
    return true;
  }

  const searchableText = [candidate.filename, candidate.type, ...getTags(candidate.tags)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    candidate.source === "brand_asset" &&
    /(?:brand[_\s-]*logo|logo|品牌标识|品牌标志|商标)/i.test(searchableText)
  );
}

export function findBrandLogoReferenceImage(
  candidates: ReferenceImageCandidate[],
): ReferenceImageCandidate | null {
  const logoCandidates = candidates.filter(
    (candidate) =>
      candidate.url &&
      candidate.source !== "AI" &&
      isImageCandidate(candidate) &&
      hasBrandLogoSignal(candidate),
  );
  const logo = rankCandidates(logoCandidates, ["brand_logo"])[0];

  return logo
    ? {
        ...logo,
        type: "brand_logo",
      }
    : null;
}

function selectCandidatesByRoles(
  candidates: ReferenceImageCandidate[],
  roles: ReferenceImageRole[],
  targetCount: number,
) {
  const selected: ReferenceImageCandidate[] = [];
  const selectedIds = new Set<string>();
  const missingRoles: ReferenceImageRole[] = [];
  const ranked = rankCandidates(candidates, roles);

  for (const role of roles) {
    const candidate = ranked.find((item) => {
      if (selectedIds.has(item.id)) {
        return false;
      }

      return getCandidateRoles(item).has(role);
    });

    if (!candidate) {
      missingRoles.push(role);
      continue;
    }

    selected.push(candidate);
    selectedIds.add(candidate.id);
  }

  if (missingRoles.length === 0 && selected.length < targetCount) {
    for (const candidate of ranked) {
      if (selectedIds.has(candidate.id)) {
        continue;
      }

      const candidateRoles = getCandidateRoles(candidate);

      if (!roles.some((role) => candidateRoles.has(role))) {
        continue;
      }

      selected.push(candidate);
      selectedIds.add(candidate.id);

      if (selected.length >= targetCount) {
        break;
      }
    }
  }

  return {
    missingRoles,
    selected,
  };
}

export function selectReferenceImagesForTask(input: {
  candidates: ReferenceImageCandidate[];
  imageType: ImageType;
  theme: string;
  visualRule?: VisualRule;
}): ReferenceImageSelectionResult {
  const validCandidates = input.candidates.filter((candidate) => candidate.url);
  const rule = getVisualRuleSelection(input.visualRule) ?? getReferenceImageRule(input.imageType, input.theme);

  if (!rule) {
    return {
      images: [],
      missingRoles: [],
      message: "未找到素材推荐规则，请手动选择参考图或维护平台规则。",
      requiredCount: 0,
      ruleRoles: [],
      usedFallback: true,
    };
  }

  const requiredCount =
    "requiredCount" in rule && typeof rule.requiredCount === "number"
      ? rule.requiredCount
      : rule.defaultCount;
  const missingBehavior =
    "missingBehavior" in rule && typeof rule.missingBehavior === "string"
      ? rule.missingBehavior
      : undefined;

  const selection = selectCandidatesByRoles(
    validCandidates,
    rule.roles,
    Math.min(rule.defaultCount, rule.maxCount),
  );
  const matched = selection.selected.slice(0, rule.maxCount);

  if (matched.length > 0) {
    const missingMessage =
      selection.missingRoles.length > 0
        ? `缺少${selection.missingRoles.map((role) => roleDisplayNames[role]).join("、")}素材，已先推荐已匹配的参考图。`
        : undefined;

    return {
      images: matched.slice(0, rule.defaultCount),
      missingBehavior,
      missingRoles: selection.missingRoles,
      message: missingMessage,
      requiredCount,
      ruleRoles: rule.roles,
      usedFallback: selection.missingRoles.length > 0,
    };
  }

  const missingMessage = `未找到平台规则要求的${rule.roles
    .map((role) => roleDisplayNames[role])
    .join("、")}素材。`;

  return {
    images: [],
    missingBehavior,
    missingRoles: rule.roles,
    message:
      missingBehavior === "阻止生成并提示"
        ? `${missingMessage}请先补充素材或调整平台规则。`
        : `${missingMessage}请手动选择参考图，或按规则确认无参考图继续。`,
    requiredCount,
    ruleRoles: rule.roles,
    usedFallback: true,
  };
}
