import { prisma } from "@/lib/prisma";

const activeOnly = {
  deletedAt: null,
};

export type CreateProductInput = {
  projectId: string;
  brandId: string;
  platformId: string;
  name: string;
  sku: string;
  category: string;
  language: string;
  description?: string | null;
  status: string;
  tags: string[];
};

export const productRepository = {
  findAll() {
    return prisma.product.findMany({
      where: activeOnly,
      orderBy: {
        updatedAt: "desc",
      },
    });
  },

  findById(id: string) {
    return prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  },

  findByProjectId(projectId: string) {
    return prisma.product.findMany({
      where: {
        projectId,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  },

  create(input: CreateProductInput) {
    return prisma.product.create({
      data: {
        projectId: input.projectId,
        brandId: input.brandId,
        platformId: input.platformId,
        name: input.name,
        sku: input.sku,
        category: input.category,
        language: input.language,
        description: input.description,
        status: input.status,
        tags: input.tags,
      },
    });
  },
};
