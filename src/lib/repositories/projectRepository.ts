import { prisma } from "@/lib/prisma";

const activeOnly = {
  deletedAt: null,
};

export type CreateProjectInput = {
  name: string;
  description?: string | null;
  platformId: string;
  language: string;
  status: string;
  coverMediaId?: string | null;
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

  create(input: CreateProjectInput) {
    return prisma.project.create({
      data: {
        name: input.name,
        description: input.description,
        platformId: input.platformId,
        language: input.language,
        status: input.status,
        coverMediaId: input.coverMediaId,
      },
    });
  },
};
