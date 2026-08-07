import type { DesignIntentCandidate } from "@/lib/ai-workspace/types";

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

export type DesignIntentAssistantContext = {
  productName?: string;
  category?: string;
  platform?: string;
  imageType?: string;
  theme?: string;
  designObjective?: string;
};

function readError(error: ApiResponse<unknown>["error"]) {
  if (!error) {
    return "设计意图生成失败。";
  }

  return typeof error === "string" ? error : error.detail || error.message;
}

export async function generateDesignIntentCandidates(input: {
  context?: DesignIntentAssistantContext;
  promptModel: string;
  sceneBrief: string;
}) {
  const response = await fetch("/api/ai-workspace/design-intent", {
    body: JSON.stringify({
      context: input.context,
      promptModel: input.promptModel,
      sceneBrief: input.sceneBrief,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json()) as ApiResponse<{
    candidates: DesignIntentCandidate[];
  }>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(readError(payload.error));
  }

  return payload.data.candidates;
}
