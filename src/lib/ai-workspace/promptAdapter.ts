import type { GenerationContext, PromptResult } from "@/lib/ai-workspace/types";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string | {
    code: string;
    detail?: string;
    message: string;
  };
};

export type PromptCandidate = PromptResult & {
  apiModel: string;
  generatedTime: string;
  id: string;
  promptModel: string;
  promptModelLabel: string;
  source: "fallback" | "model";
  fallbackReason?: string;
};

function readError(error: ApiResponse<unknown>["error"]) {
  if (!error) {
    return "Prompt 生成失败。";
  }

  return typeof error === "string" ? error : error.detail || error.message;
}

export async function generatePromptCandidates(input: {
  context: GenerationContext;
  promptModels: string[];
}) {
  const response = await fetch("/api/ai-workspace/prompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      generationContext: input.context,
      promptModels: input.promptModels,
    }),
  });
  const payload = (await response.json()) as ApiResponse<{
    prompts: PromptCandidate[];
  }>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(readError(payload.error));
  }

  return payload.data.prompts;
}
