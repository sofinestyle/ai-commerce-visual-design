import { aiConfig } from "@/lib/aiConfig";
import { apiError, apiSuccess } from "@/lib/apiResponse";

const PROVIDER_TEST_TIMEOUT_MS = 10_000;

function buildOpenAICompatibleModelsUrl(baseUrl: string) {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  if (normalizedBaseUrl.endsWith("/v1")) {
    return `${normalizedBaseUrl}/models`;
  }

  return `${normalizedBaseUrl}/v1/models`;
}

async function testDmxApiConnection() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildOpenAICompatibleModelsUrl(aiConfig.baseUrl), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${aiConfig.apiKey}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`DMXAPI provider test failed with HTTP ${response.status}.`);
    }

    return {
      provider: "dmxapi",
      mode: "connection-test",
      message: "DMXAPI provider connection succeeded.",
      imageModel: aiConfig.imageModel,
      baseUrlConfigured: true,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("DMXAPI provider test timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  try {
    if (aiConfig.provider === "mock") {
      return apiSuccess({
        provider: "mock",
        mode: "mock",
        message: "AI provider is running in mock mode.",
        imageModel: aiConfig.imageModel,
      });
    }

    if (aiConfig.provider !== "dmxapi") {
      return apiError(
        `AI provider test is not implemented for ${aiConfig.provider}.`,
        400,
      );
    }

    if (!aiConfig.baseUrl || !aiConfig.apiKey) {
      return apiError(
        "AI_BASE_URL and AI_API_KEY are required when AI_PROVIDER is set to dmxapi.",
        400,
      );
    }

    const result = await testDmxApiConnection();

    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
