import {
  productRepository,
  type CreateProductInput,
} from "@/lib/repositories/productRepository";

export const productService = {
  getAll() {
    return productRepository.findAll();
  },

  getById(id: string) {
    return productRepository.findById(id);
  },

  getByProjectId(projectId: string) {
    return productRepository.findByProjectId(projectId);
  },

  create(input: CreateProductInput) {
    return productRepository.create(input);
  },
};
