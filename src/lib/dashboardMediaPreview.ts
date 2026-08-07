import { stat } from "fs/promises";
import * as path from "path";

import { isPathInside } from "@/lib/pathSafety";

export type DashboardMediaPreviewItem = {
  previewImage?: string | null;
  storagePath: string;
  thumbnail?: string | null;
};

export type DashboardMediaPreviewState = {
  status: "available" | "missing" | "unchecked";
  url: string;
};

export function getDashboardMediaPreviewUrl(item: DashboardMediaPreviewItem) {
  return item.thumbnail || item.previewImage || item.storagePath;
}

function resolvePublicMediaFilePath(mediaPath: string) {
  if (!mediaPath.startsWith("/media/")) {
    return null;
  }

  try {
    const decodedPath = decodeURIComponent(mediaPath);
    const publicDirectory = path.join(process.cwd(), "public");
    const filePath = path.normalize(path.join(publicDirectory, decodedPath));

    return isPathInside(path.join(publicDirectory, "media"), filePath) ? filePath : null;
  } catch {
    return null;
  }
}

export async function getDashboardMediaPreviewState(
  item: DashboardMediaPreviewItem,
): Promise<DashboardMediaPreviewState> {
  const url = getDashboardMediaPreviewUrl(item);

  if (!url) {
    return {
      status: "missing",
      url,
    };
  }

  if (!url.startsWith("/media/")) {
    return {
      status: "unchecked",
      url,
    };
  }

  const filePath = resolvePublicMediaFilePath(url);

  if (!filePath) {
    return {
      status: "missing",
      url,
    };
  }

  try {
    const fileStat = await stat(filePath);

    return {
      status: fileStat.isFile() ? "available" : "missing",
      url,
    };
  } catch {
    return {
      status: "missing",
      url,
    };
  }
}
