import { prisma } from "@/lib/prisma";

const activeOnly = {
  deletedAt: null,
};

export const brandRepository = {
  findAll() {
    return prisma.brand.findMany({
      where: activeOnly,
      orderBy: {
        name: "asc",
      },
    });
  },

  findById(id: string) {
    return prisma.brand.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  },
};
