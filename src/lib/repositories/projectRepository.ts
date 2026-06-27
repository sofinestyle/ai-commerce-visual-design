import { prisma } from "@/lib/prisma";

const activeOnly = {
  deletedAt: null,
};

export const projectRepository = {
  findAll() {
    return prisma.project.findMany({
      where: activeOnly,
      orderBy: {
        updatedAt: "desc",
      },
    });
  },

  findById(id: string) {
    return prisma.project.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  },

  findWithProducts() {
    return prisma.project.findMany({
      where: activeOnly,
      include: {
        products: {
          where: activeOnly,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  },

  findWithMedia() {
    return prisma.project.findMany({
      where: activeOnly,
      include: {
        media: {
          where: activeOnly,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  },

  findWithWorkflows() {
    return prisma.project.findMany({
      where: activeOnly,
      include: {
        workflows: {
          where: activeOnly,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  },
};
