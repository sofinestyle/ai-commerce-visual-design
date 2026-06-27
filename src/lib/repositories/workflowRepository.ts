import { prisma } from "@/lib/prisma";

const activeOnly = {
  deletedAt: null,
};

export const workflowRepository = {
  findAll() {
    return prisma.workflow.findMany({
      where: activeOnly,
      orderBy: {
        updatedAt: "desc",
      },
    });
  },

  findById(id: string) {
    return prisma.workflow.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  },
};
