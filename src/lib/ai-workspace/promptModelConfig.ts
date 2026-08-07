import { aiConfig } from "@/lib/aiConfig";
import { getCustomModels, getHiddenModels } from "@/lib/aiProviders/customModelStore";
import type { ModelPricing } from "@/lib/aiProviders/modelPricing";
import { defaultModelConfig } from "@/lib/modelDefaults";

export type PromptModelProvider = "dmx" | "openai-compatible";

export type PromptModelConfig = {
  id: string;
  label: string;
  apiModel: string;
  provider: PromptModelProvider;
  enabled: boolean;
  disabledReason?: string;
  pricing?: ModelPricing;
};

export type PromptModelOption = PromptModelConfig;

export const defaultPromptModel = defaultModelConfig.promptModel;

export const promptModelConfigs: PromptModelConfig[] = [
  {
    apiModel: "gpt-5.6-terra",
    enabled: true,
    id: "gpt-5.6-terra",
    label: "GPT-5.6 Terra",
    provider: "dmx",
  },
  {
    apiModel: "gpt-5.5",
    enabled: true,
    id: "gpt-5.5",
    label: "GPT-5.5",
    provider: "dmx",
  },
  {
    apiModel: "gpt-5.5-ssvip",
    enabled: true,
    id: "gpt-5.5-ssvip",
    label: "GPT-5.5 SSVIP",
    provider: "dmx",
  },
  {
    apiModel: "gemini-3.5-flash",
    enabled: true,
    id: "gemini-3.5-flash",
    label: "Gemini 3.5 Flash",
    provider: "dmx",
  },
  {
    apiModel: "gemini-3.5-flash-ssvip",
    enabled: true,
    id: "gemini-3.5-flash-ssvip",
    label: "Gemini 3.5 Flash SSVIP",
    provider: "dmx",
  },
  {
    apiModel: "doubao-seed-2-1-pro-260628",
    enabled: true,
    id: "doubao-seed-2-1-pro-260628",
    label: "Doubao Seed 2.1 Pro",
    provider: "dmx",
  },
];

export function hasPromptProviderConfig() {
  if (aiConfig.provider === "openai") {
    return Boolean(aiConfig.openaiApiKey);
  }

  if (aiConfig.provider === "dmxapi" || aiConfig.provider === "custom") {
    return Boolean(aiConfig.baseUrl && aiConfig.apiKey);
  }

  return false;
}

export function getPromptModelConfig(id: string) {
  return promptModelConfigs.find((config) => config.id === id);
}

export async function getPromptModelConfigAsync(id: string) {
  const builtInConfig = getPromptModelConfig(id);

  if (builtInConfig) {
    return builtInConfig;
  }

  const customModel = (await getCustomModels("prompt")).find((model) => model.id === id);

  if (!customModel) {
    return undefined;
  }

  return {
    apiModel: customModel.id,
    enabled: customModel.enabled,
    id: customModel.id,
    label: customModel.label,
    provider: "dmx" as const,
  };
}

export function getDefaultPromptModelConfig() {
  return (
    promptModelConfigs.find((config) => config.id === defaultPromptModel && config.enabled) ??
    promptModelConfigs.find((config) => config.enabled) ??
    promptModelConfigs[0]
  );
}

export async function buildPromptModelOptions(
  providerModels: string[] = [],
): Promise<PromptModelOption[]> {
  const configured = hasPromptProviderConfig();
  const knownProviderModels = new Set(providerModels);
  const hiddenPromptModels = new Set(await getHiddenModels("prompt"));
  const customPromptConfigs: PromptModelConfig[] = (await getCustomModels("prompt")).map(
    (model) => ({
      apiModel: model.id,
      enabled: model.enabled,
      id: model.id,
      label: model.label,
      provider: "dmx",
    }),
  );
  const promptConfigsById = new Map<string, PromptModelConfig>();

  for (const config of [...promptModelConfigs, ...customPromptConfigs]) {
    if (!promptConfigsById.has(config.id)) {
      promptConfigsById.set(config.id, config);
    }
  }

  return [...promptConfigsById.values()]
    .filter((config) => !hiddenPromptModels.has(config.id))
    .map((config) => {
      const providerConfirmed = !config.apiModel || knownProviderModels.has(config.apiModel);
      const enabled = config.enabled && configured;

      return {
        ...config,
        disabledReason: enabled
          ? undefined
          : config.disabledReason ||
            (configured
              ? providerConfirmed
                ? "当前 Prompt Model 暂不可用。"
                : "模型未在当前 provider 模型列表中确认，调用失败时会使用本地 Prompt Builder。"
              : "当前未配置可用文字模型 API，将使用本地 Prompt Builder。"),
        enabled,
      };
    });
}
