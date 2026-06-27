import { aiConfig } from "@/lib/aiConfig";
import { customProvider } from "@/lib/aiProviders/customProvider";
import { dmxProvider } from "@/lib/aiProviders/dmxProvider";
import { mockProvider } from "@/lib/aiProviders/mockProvider";
import { openaiProvider } from "@/lib/aiProviders/openaiProvider";
import type { AIImageProvider } from "@/lib/aiProviders/types";

export const providerFactory = {
  getProvider(): AIImageProvider {
    switch (aiConfig.provider) {
      case "dmxapi":
        return dmxProvider;
      case "openai":
        return openaiProvider;
      case "custom":
        return customProvider;
      case "mock":
      default:
        return mockProvider;
    }
  },
};
