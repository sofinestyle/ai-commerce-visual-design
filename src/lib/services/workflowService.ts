import { workflowRepository } from "@/lib/repositories/workflowRepository";

export const workflowService = {
  getAll() {
    return workflowRepository.findAll();
  },

  getById(id: string) {
    return workflowRepository.findById(id);
  },
};
