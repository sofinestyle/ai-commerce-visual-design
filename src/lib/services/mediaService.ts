import { mediaRepository } from "@/lib/repositories/mediaRepository";

export const mediaService = {
  getAll() {
    return mediaRepository.findAll();
  },

  getById(id: string) {
    return mediaRepository.findById(id);
  },

  getByProductId(productId: string) {
    return mediaRepository.findByProductId(productId);
  },

  getByProjectId(projectId: string) {
    return mediaRepository.findByProjectId(projectId);
  },
};
