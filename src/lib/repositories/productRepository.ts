import { prisma } from "@/lib/prisma";

const activeOnly = {
  deletedAt: null,
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
};
