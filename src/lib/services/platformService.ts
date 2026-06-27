import { platformRepository } from "@/lib/repositories/platformRepository";

export const platformService = {
  getAll() {
    return platformRepository.findAll();
  },

  getById(id: string) {
    return platformRepository.findById(id);
  },
};
