import type {
  GenerationContext,
  ImageCopyCandidate,
  ProductMarketingAnalysis,
} from "@/lib/ai-workspace/types";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?:
    | string
    | {
        code: string;
        detail?: string;
        message: string;
      };
};

function readError(error: ApiResponse<unknown>["error"]) {
  if (!error) {
    return "主图文案生成失败。";
  }

  return typeof error === "string"
    ? error
    : error.detail || error.message;
}

export async function generateImageCopyCandidates(input: {
  context: GenerationContext;
  marketingPositioningOverride?: string;
  promptModel: string;
}) {
  const response = await fetch("/api/ai-workspace/image-copy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      generationContext: input.context,
      marketingPositioningOverride:
        input.marketingPositioningOverride,
      promptModel: input.promptModel,
    }),
  });
  const payload = (await response.json()) as ApiResponse<{
    analysis: ProductMarketingAnalysis;
    candidates: ImageCopyCandidate[];
  }>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(readError(payload.error));
  }

  return payload.data;
}
