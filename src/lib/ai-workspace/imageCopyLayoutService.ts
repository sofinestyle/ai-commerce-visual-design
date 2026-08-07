import type { GenerationContext } from "@/lib/ai-workspace/types";
import { getVisibleCopyPolicy } from "@/lib/ai-workspace/visibleCopyPolicy";

export type ImageCopyLayoutSuggestion = {
  placementHint: string;
  styleHint: string;
};

export function buildImageCopyLayoutSuggestion(
  context: GenerationContext,
): ImageCopyLayoutSuggestion {
  const policy = getVisibleCopyPolicy(context.visualRule);
  const normalizedCopySpace = policy.copySpace.trim().toLowerCase();
  const isMinimal =
    /minimal|small|少量|少/.test(normalizedCopySpace);
  const isLarge =
    /large|大量|多/.test(normalizedCopySpace);
  const placementHint = isMinimal
    ? "将主标题放在商品外侧的小块留白区，卖点精简排列，避免遮挡商品。"
    : isLarge
      ? "使用商品外侧较大的留白区域排布主标题、副标题和卖点，保持清晰层级并避免遮挡商品。"
      : "将主标题与卖点放在商品外侧的有效留白区，避免遮挡商品主体和品牌 Logo。";
  const styleHint =
    context.language.code === "zh-CN"
      ? "使用醒目、简洁、移动端易读的中文无衬线字体，主标题加粗，卖点保持短句。"
      : "Use bold, clean, mobile-readable sans-serif typography with a clear headline hierarchy.";

  return {
    placementHint,
    styleHint,
  };
}
