import { prisma } from "@/lib/prisma";

const activeOnly = {
  deletedAt: null,
};

export const generationHistoryRepository = {
  findAll() {
    return prisma.generationHistory.findMany({
      where: activeOnly,
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findById(id: string) {
    return prisma.generationHistory.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  },
};
