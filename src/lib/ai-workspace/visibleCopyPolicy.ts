import type {
  OutputLanguage,
  VisibleCopy,
  VisualRule,
} from "@/lib/ai-workspace/types";

export type VisibleCopyPolicy = {
  allowed: boolean;
  copySpace: string;
  reason: string;
};

const forbiddenValuePattern =
  /^(?:no|none|forbidden|not allowed|disabled|禁止|不允许|不可|无|否)$/i;
const forbiddenGuidancePattern =
  /\b(?:no|without)\s+(?:copy|text|wording)\b|\bdo not (?:add|include|render|show) (?:copy|text|wording)\b|(?:copy|text|wording)\s+(?:is\s+)?forbidden|禁止(?:文案|文字|文本)|不要添加(?:文案|文字|文本)|不得出现(?:文案|文字|文本)|无文案|无文字/i;

function findCopySpaceEntry(visualRule: VisualRule) {
  return Object.entries(visualRule.visualSpecification).find(([key]) =>
    /copy\s*space|文案空间|文字空间|文本空间/i.test(key),
  );
}

function normalizeSellingPoints(value: string[] | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const points: string[] = [];

  for (const item of value) {
    const point = item.trim();
    const key = point.toLocaleLowerCase();

    if (!point || seen.has(key)) {
      continue;
    }

    seen.add(key);
    points.push(Array.from(point).slice(0, 40).join(""));

    if (points.length === 3) {
      break;
    }
  }

  return points;
}

export function getVisibleCopyPolicy(
  visualRule?: VisualRule | null,
): VisibleCopyPolicy {
  if (!visualRule) {
    return {
      allowed: false,
      copySpace: "",
      reason: "视觉规则尚未加载，暂不能确认是否允许画面文案。",
    };
  }

  const copySpaceEntry = findCopySpaceEntry(visualRule);
  const copySpace = copySpaceEntry?.[1]?.trim() ?? "";
  const guidance = [
    ...visualRule.promptGuidance.focus,
    ...visualRule.promptGuidance.avoid,
  ].join(" ");

  if (
    (copySpace && forbiddenValuePattern.test(copySpace)) ||
    forbiddenGuidancePattern.test(guidance)
  ) {
    return {
      allowed: false,
      copySpace,
      reason: `当前视觉规则 ${visualRule.ruleId} 禁止画面文案。`,
    };
  }

  if (!copySpace) {
    return {
      allowed: false,
      copySpace: "",
      reason: `当前视觉规则 ${visualRule.ruleId} 未明确提供文案空间。`,
    };
  }

  return {
    allowed: true,
    copySpace,
    reason: `当前视觉规则允许文案，文案空间：${copySpace}。`,
  };
}

export function normalizeVisibleCopy(
  visibleCopy: VisibleCopy | undefined,
  visualRule: VisualRule,
): VisibleCopy {
  const policy = getVisibleCopyPolicy(visualRule);
  const headline = visibleCopy?.headline?.trim() ?? "";
  const subheadline = visibleCopy?.subheadline?.trim() ?? "";
  const sellingPoints = normalizeSellingPoints(visibleCopy?.sellingPoints);
  const placementHint = visibleCopy?.placementHint?.trim() ?? "";

  if (!visibleCopy?.enabled || !policy.allowed || !headline) {
    return {
      enabled: false,
    };
  }

  return {
    ...visibleCopy,
    enabled: true,
    headline,
    sellingPoints: sellingPoints.length > 0 ? sellingPoints : undefined,
    subheadline: subheadline || undefined,
    placementHint: placementHint || policy.copySpace || undefined,
  };
}

function quoteVisibleText(value: string) {
  return JSON.stringify(value);
}

function trimTrailingSentencePunctuation(value: string) {
  return value.replace(/[.。；;，,\s]+$/g, "").trim();
}

function buildTextRenderingInstruction(language: OutputLanguage) {
  if (language.code === "zh-CN") {
    return "Render Simplified Chinese as large, clean, readable printed sans-serif typography; no pseudo-Chinese, decorative calligraphy, distorted glyphs, or lookalike characters.";
  }

  return "Use clean, modern, mobile-readable sans-serif typography with clear hierarchy.";
}

function buildVisibleCopyLayoutInstruction() {
  return [
    "Place it in clean whitespace away from the product and logo.",
    "Keep it compact with a clear hierarchy.",
    "The text must not overlap, crop, squeeze, or visually compete with the product.",
    "Do not add badges, seals, icon rows, discounts, or extra callouts.",
  ].join(" ");
}

export function buildVisibleCopyInstruction(input: {
  language: OutputLanguage;
  visibleCopy?: VisibleCopy;
  visualRule: VisualRule;
}) {
  const normalizedCopy = normalizeVisibleCopy(
    input.visibleCopy,
    input.visualRule,
  );

  if (!normalizedCopy.enabled || !normalizedCopy.headline) {
    return "Do not render visible marketing copy, captions, slogans, or incidental text in the image.";
  }

  return [
    `Render only the approved ${input.language.promptName} copy exactly; do not translate, rewrite, misspell, reorder, or add text.`,
    `Headline: ${quoteVisibleText(normalizedCopy.headline)}.`,
    normalizedCopy.subheadline
      ? `Subheadline: ${quoteVisibleText(normalizedCopy.subheadline)}.`
      : "Do not add a subheadline.",
    normalizedCopy.sellingPoints?.length
      ? `Selling point bullets: ${normalizedCopy.sellingPoints.map(quoteVisibleText).join(", ")}.`
      : "Do not add selling-point bullets.",
    normalizedCopy.placementHint
      ? `Copy placement: ${trimTrailingSentencePunctuation(normalizedCopy.placementHint)}.`
      : "",
    buildVisibleCopyLayoutInstruction(),
    buildTextRenderingInstruction(input.language),
  ]
    .filter(Boolean)
    .join(" ");
}
