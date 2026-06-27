import { prisma } from "@/lib/prisma";

const activeOnly = {
  deletedAt: null,
};

export const taskRepository = {
  findAll() {
    return prisma.task.findMany({
      where: activeOnly,
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findById(id: string) {
    return prisma.task.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  },

  findByStatus(status: string) {
    return prisma.task.findMany({
      where: {
        status,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findRunning() {
    return prisma.task.findMany({
      where: {
        status: "Running",
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },
};
