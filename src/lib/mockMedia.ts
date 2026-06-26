export type MediaType = "image" | "psd" | "png" | "jpg" | "webp";

export type MediaSource = "Camera" | "Upload" | "AI";

export type MediaStatus = "Draft" | "Ready" | "Processing" | "Archived";

export interface MediaAsset {
  id: string;
  projectId: string;
  productId: string;
  name: string;
  filename: string;
  type: MediaType;
  thumbnail: string;
  previewImage: string;
  width: number;
  height: number;
  fileSize: string;
  status: MediaStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  source: MediaSource;
}

const mediaNames = [
  "Hero Front View",
  "Lifestyle Scene",
  "Transparent Cutout",
  "Detail Texture",
  "Packaging Shot",
  "Comparison Layout",
  "Social Cover",
  "Store Banner",
  "Feature Closeup",
  "Angle Variant",
];

const types: MediaType[] = ["image", "psd", "png", "jpg", "webp"];
const sources: MediaSource[] = ["Camera", "Upload", "AI"];
const statuses: MediaStatus[] = ["Draft", "Ready", "Processing", "Archived"];
const tagGroups = [
  ["hero", "clean", "commerce"],
  ["lifestyle", "warm", "campaign"],
  ["cutout", "white-bg", "product"],
  ["detail", "texture", "premium"],
  ["banner", "seasonal", "marketplace"],
];
const sizes = [
  { width: 1200, height: 1200 },
  { width: 1600, height: 1200 },
  { width: 1920, height: 1080 },
  { width: 1080, height: 1350 },
  { width: 2000, height: 2000 },
  { width: 3000, height: 2000 },
];

function formatFileSize(index: number) {
  const size = 1.2 + (index % 12) * 0.7;
  return `${size.toFixed(1)} MB`;
}

export const mockMediaAssets: MediaAsset[] = Array.from({ length: 80 }, (_, index) => {
  const assetNumber = index + 1;
  const type = types[index % types.length];
  const source = sources[index % sources.length];
  const status = statuses[index % statuses.length];
  const size = sizes[index % sizes.length];
  const name = `${mediaNames[index % mediaNames.length]} ${String(assetNumber).padStart(2, "0")}`;
  const slug = name.toLowerCase().replaceAll(" ", "-");

  return {
    id: `media-${String(assetNumber).padStart(3, "0")}`,
    projectId: `project-${String((index % 20) + 1).padStart(3, "0")}`,
    productId: `product-${String((index % 50) + 1).padStart(3, "0")}`,
    name,
    filename: `${slug}.${type === "image" ? "jpg" : type}`,
    type,
    thumbnail: `thumbnail-${slug}`,
    previewImage: `preview-${slug}`,
    width: size.width,
    height: size.height,
    fileSize: formatFileSize(index),
    status,
    tags: tagGroups[index % tagGroups.length],
    createdAt: `2026-05-${String((index % 28) + 1).padStart(2, "0")}`,
    updatedAt: `2026-06-${String(26 - (index % 21)).padStart(2, "0")}`,
    source,
  };
});
