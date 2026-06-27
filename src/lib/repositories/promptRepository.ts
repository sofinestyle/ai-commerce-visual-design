import { prisma } from "@/lib/prisma";

const activeOnly = {
  deletedAt: null,
};

export const promptRepository = {
  findAll() {
    return prisma.promptTemplate.findMany({
      where: activeOnly,
      orderBy: {
        updatedAt: "desc",
      },
    });
  },

  findById(id: string) {
    return prisma.promptTemplate.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  },
};
