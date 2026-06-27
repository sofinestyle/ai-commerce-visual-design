import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { apiError, apiSuccess } from "@/lib/apiResponse";
import { mediaService } from "@/lib/services/mediaService";

const uploadDirectory = path.join(process.cwd(), "media", "uploads");

function safeFileName(fileName: string) {
  const parsedName = path.parse(fileName);
  const baseName = parsedName.name
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  const extension = parsedName.ext
    .trim()
    .replace(/[^a-zA-Z0-9.]+/g, "")
    .toLowerCase();

  return `${baseName || "upload"}${extension}`;
}

function getFileType(fileName: string) {
  const extension = path.extname(fileName).replace(".", "").toLowerCase();

  return extension || "image";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const projectId = readString(formData.get("projectId"));
    const productId = readString(formData.get("productId"));
    const file = formData.get("file");

    if (!projectId) {
      return apiError("projectId is required.", 400);
    }

    if (!(file instanceof File)) {
      return apiError("file is required.", 400);
    }

    const originalFileName = file.name || "upload";
    const savedFileName = `${Date.now()}-${safeFileName(originalFileName)}`;
    const storagePath = `/media/uploads/${savedFileName}`;
    const filePath = path.join(uploadDirectory, savedFileName);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const hash = createHash("sha256").update(fileBuffer).digest("hex");

    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(filePath, fileBuffer);

    const media = await mediaService.create({
      projectId,
      productId: productId || null,
      name: path.parse(originalFileName).name || savedFileName,
      filename: savedFileName,
      type: getFileType(originalFileName),
      mimeType: file.type || "application/octet-stream",
      storagePath,
      hash,
      thumbnail: storagePath,
      previewImage: storagePath,
      width: 0,
      height: 0,
      fileSize: formatFileSize(fileBuffer.byteLength),
      status: "Ready",
      tags: [],
      source: "Upload",
    });

    return apiSuccess(media);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to upload media.",
    );
  }
}
