import { buildGenerationChainGroups } from "@/lib/ai-workspace/generation-chain-read-model";
import { mediaService } from "@/lib/services/mediaService";

export type GenerationChainFilters = {
  generationGroupId?: string;
  projectId?: string;
  sku?: string;
};

export const generationChainService = {
  async getAll(filters: GenerationChainFilters = {}) {
    const mediaAssets = await mediaService.getAll({
      generationGroupId: filters.generationGroupId,
      projectId: filters.projectId,
      sku: filters.sku,
      source: "AI",
    });

    return buildGenerationChainGroups(mediaAssets);
  },
};
