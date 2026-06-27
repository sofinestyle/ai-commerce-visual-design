import { prisma } from "@/lib/prisma";

const activeOnly = {
  deletedAt: null,
};

export const mediaRepository = {
  findAll() {
    return prisma.media.findMany({
      where: activeOnly,
      orderBy: {
        updatedAt: "desc",
      },
    });
  },

  findById(id: string) {
    return prisma.media.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  },

  findByProductId(productId: string) {
    return prisma.media.findMany({
      where: {
        productId,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  },

  findByProjectId(projectId: string) {
    return prisma.media.findMany({
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
