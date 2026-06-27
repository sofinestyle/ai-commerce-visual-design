import { prisma } from "@/lib/prisma";

const activeOnly = {
  deletedAt: null,
};

export const platformRepository = {
  findAll() {
    return prisma.platform.findMany({
      where: activeOnly,
      orderBy: {
        name: "asc",
      },
    });
  },

  findById(id: string) {
    return prisma.platform.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  },
};
