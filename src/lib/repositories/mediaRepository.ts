import { prisma } from "@/lib/prisma";

const activeOnly = {
  deletedAt: null,
};

export type CreateMediaInput = {
  projectId: string;
  productId?: string | null;
  name: string;
  filename: string;
  type: string;
  mimeType: string;
  storagePath: string;
  hash: string;
  thumbnail?: string | null;
  previewImage?: string | null;
  width?: number | null;
  height?: number | null;
  fileSize?: string | null;
  status: string;
  tags: string[];
  source: string;
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

  create(input: CreateMediaInput) {
    return prisma.media.create({
      data: {
        projectId: input.projectId,
        productId: input.productId,
        name: input.name,
        filename: input.filename,
        type: input.type,
        mimeType: input.mimeType,
        storagePath: input.storagePath,
        hash: input.hash,
        thumbnail: input.thumbnail,
        previewImage: input.previewImage,
        width: input.width,
        height: input.height,
        fileSize: input.fileSize,
        status: input.status,
        tags: input.tags,
        source: input.source,
      },
    });
  },
};
