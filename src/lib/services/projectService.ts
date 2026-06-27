import {
  projectRepository,
  type CreateProjectInput,
} from "@/lib/repositories/projectRepository";

export const projectService = {
  getAll() {
    return projectRepository.findAll();
  },

  getById(id: string) {
    return projectRepository.findById(id);
  },

  getWithProducts() {
    return projectRepository.findWithProducts();
  },

  getWithMedia() {
    return projectRepository.findWithMedia();
  },

  getWithWorkflows() {
    return projectRepository.findWithWorkflows();
  },

  create(input: CreateProjectInput) {
    return projectRepository.create(input);
  },
};
