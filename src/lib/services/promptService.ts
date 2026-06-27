import { promptRepository } from "@/lib/repositories/promptRepository";

export const promptService = {
  getAll() {
    return promptRepository.findAll();
  },

  getById(id: string) {
    return promptRepository.findById(id);
  },
};
