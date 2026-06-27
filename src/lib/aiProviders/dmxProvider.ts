import { aiConfig } from "@/lib/aiConfig";
import type {
  AIGeneratedImage,
  AIGenerationInput,
  AIGenerationResult,
  AIImageProvider,
} from "@/lib/aiProviders/types";

type DmxImageItem = {
  url?: unknown;
  b64_json?: unknown;
  base64?: unknown;
};

type DmxImageResponse = {
  data?: unknown;
};

function buildImageGenerationUrl(baseUrl: string) {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  if (normalizedBaseUrl.endsWith("/v1")) {
    return `${normalizedBaseUrl}/images/generations`;
  }

  return `${normalizedBaseUrl}/v1/images/generations`;
}

function readCount(count: number | undefined) {
  if (typeof count !== "number" || !Number.isFinite(count)) {
    return 1;
  }

  return Math.max(1, Math.floor(count));
}

async function readErrorSummary(response: Response) {
  const text = await response.text();

  if (!text) {
    return `HTTP ${response.status}`;
  }

  return `HTTP ${response.status}: ${text.slice(0, 500)}`;
}

function readImageUrl(item: DmxImageItem) {
  if (typeof item.url === "string" && item.url) {
    return item.url;
  }

  if (typeof item.b64_json === "string" && item.b64_json) {
    return `data:image/png;base64,${item.b64_json}`;
  }

  if (typeof item.base64 === "string" && item.base64) {
    return `data:image/png;base64,${item.base64}`;
  }

  return "";
}

function mapImages(
  response: DmxImageResponse,
  input: AIGenerationInput,
  model: string,
  timestamp: number,
): AIGeneratedImage[] {
  if (!Array.isArray(response.data)) {
    throw new Error("DMXAPI image generation response did not include a data array.");
  }

  const images = response.data
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const url = readImageUrl(item as DmxImageItem);

      if (!url) {
        return null;
      }

      return {
        id: `dmx-image-${timestamp}-${index + 1}`,
        url,
        prompt: input.prompt,
        model,
      };
    })
    .filter((image): image is AIGeneratedImage => image !== null);

  if (images.length === 0) {
    throw new Error("DMXAPI image generation response did not include usable image data.");
  }

  return images;
}

export const dmxProvider: AIImageProvider = {
  async generateImage(input): Promise<AIGenerationResult> {
    if (!aiConfig.baseUrl || !aiConfig.apiKey) {
      throw new Error(
        "AI_BASE_URL and AI_API_KEY are required when AI_PROVIDER is set to dmxapi.",
      );
    }

    const model = input.model || aiConfig.imageModel;
    const timestamp = Date.now();
    const response = await fetch(buildImageGenerationUrl(aiConfig.baseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aiConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: input.prompt,
        n: readCount(input.count),
        size: input.size || "1024x1024",
      }),
    });

    if (!response.ok) {
      throw new Error(`DMXAPI image generation failed: ${await readErrorSummary(response)}`);
    }

    const result = (await response.json()) as DmxImageResponse;

    return {
      taskId: `dmx-task-${timestamp}`,
      status: "Completed",
      images: mapImages(result, input, model, timestamp),
    };
  },
};
