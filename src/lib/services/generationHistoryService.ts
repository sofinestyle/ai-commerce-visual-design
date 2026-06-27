import { generationHistoryRepository } from "@/lib/repositories/generationHistoryRepository";

export const generationHistoryService = {
  getAll() {
    return generationHistoryRepository.findAll();
  },

  getById(id: string) {
    return generationHistoryRepository.findById(id);
  },
};
