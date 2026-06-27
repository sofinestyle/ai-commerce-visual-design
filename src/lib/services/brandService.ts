import { brandRepository } from "@/lib/repositories/brandRepository";

export const brandService = {
  getAll() {
    return brandRepository.findAll();
  },

  getById(id: string) {
    return brandRepository.findById(id);
  },
};
