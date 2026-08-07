import { buildGenerationChainGroups } from "@/lib/ai-workspace/generation-chain-read-model";
import { mediaService } from "@/lib/services/mediaService";

export type GenerationChainFilters = {
  generationGroupId?: string;
  projectId?: string;
  sku?: string;
};

function readImageFilePath(mediaAsset: {
  previewImage?: string | null;
  storagePath: string;
}) {
  const candidate = mediaAsset.previewImage || mediaAsset.storagePath;

  return candidate.startsWith("/media/") ? candidate : null;
}

export const generationChainService = {
  async getAll(filters: GenerationChainFilters = {}) {
    const mediaAssets = await mediaService.getAll({
      generationGroupId: filters.generationGroupId,
      projectId: filters.projectId,
      sku: filters.sku,
      source: "AI",
    });
    const fileCheckItems = mediaAssets.flatMap((mediaAsset) => {
      const mediaPath = readImageFilePath(mediaAsset);

      return mediaPath ? [{ id: mediaAsset.id, path: mediaPath }] : [];
    });
    const fileChecks =
      fileCheckItems.length > 0
        ? await mediaService.checkLocalMediaFiles(fileCheckItems)
        : [];
    const fileCheckById = new Map(fileChecks.map((check) => [check.id, check]));
    const mediaAssetsWithFileStatus = mediaAssets.map((mediaAsset) => {
      const mediaPath = readImageFilePath(mediaAsset);
      const fileCheck = fileCheckById.get(mediaAsset.id);

      return {
        ...mediaAsset,
        imageFileCheckedPath: mediaPath,
        imageFileStatus: mediaPath
          ? fileCheck?.available
            ? ("available" as const)
            : ("missing" as const)
          : ("unchecked" as const),
      };
    });

    return buildGenerationChainGroups(mediaAssetsWithFileStatus);
  },
};
