export type PromptCategory =
  | "Amazon"
  | "Temu"
  | "Tmall"
  | "TikTok"
  | "Shopify"
  | "Banner"
  | "Detail"
  | "White Background"
  | "Lifestyle";

export type PromptPlatform = "Amazon" | "Temu" | "Tmall" | "TikTok" | "Shopify";

export type PromptStatus = "Draft" | "Ready" | "Review" | "Archived";

export interface Prompt {
  id: string;
  name: string;
  category: PromptCategory;
  platform: PromptPlatform;
  language: string;
  model: string;
  content: string;
  variables: string[];
  tags: string[];
  version: string;
  status: PromptStatus;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

const categories: PromptCategory[] = [
  "Amazon",
  "Temu",
  "Tmall",
  "TikTok",
  "Shopify",
  "Banner",
  "Detail",
  "White Background",
  "Lifestyle",
];
const platforms: PromptPlatform[] = ["Amazon", "Temu", "Tmall", "TikTok", "Shopify"];
const models = ["OpenAI Image", "Gemini Vision", "Flux Pro", "Local Draft"];
const statuses: PromptStatus[] = ["Draft", "Ready", "Review", "Archived"];
const languages = ["English", "Chinese", "English", "English", "Chinese"];
const promptNames = [
  "Hero Product Visual",
  "Marketplace White Background",
  "Lifestyle Scene Builder",
  "Feature Detail Closeup",
  "Seasonal Banner Concept",
  "Premium Packaging Shot",
  "Social Commerce Hook",
  "Comparison Image Layout",
  "Texture And Material Focus",
  "Storefront Collection Cover",
];

export const mockPrompts: Prompt[] = Array.from({ length: 50 }, (_, index) => {
  const promptNumber = index + 1;
  const category = categories[index % categories.length];
  const platform = platforms[index % platforms.length];
  const model = models[index % models.length];
  const status = statuses[index % statuses.length];
  const baseName = promptNames[index % promptNames.length];

  return {
    id: `prompt-${String(promptNumber).padStart(3, "0")}`,
    name: `${baseName} ${String(promptNumber).padStart(2, "0")}`,
    category,
    platform,
    language: languages[index % languages.length],
    model,
    content:
      "Create a polished e-commerce visual for {{productName}} using {{sourceMedia}}. Emphasize {{sellingPoint}}, maintain platform-safe composition, and prepare a clean result for {{platform}}.",
    variables: ["productName", "sourceMedia", "sellingPoint", "platform"],
    tags: [category, platform, model.split(" ")[0]],
    version: `v${1 + (index % 3)}.${index % 10}`,
    status,
    favorite: index % 4 === 0,
    createdAt: `2026-05-${String((index % 28) + 1).padStart(2, "0")}`,
    updatedAt: `2026-06-${String(26 - (index % 21)).padStart(2, "0")}`,
  };
});
