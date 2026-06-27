import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const platforms = [
  { id: "platform-amazon", name: "Amazon", code: "amazon", description: "Amazon marketplace." },
  { id: "platform-temu", name: "Temu", code: "temu", description: "Temu marketplace." },
  { id: "platform-tmall", name: "Tmall", code: "tmall", description: "Tmall marketplace." },
  { id: "platform-tiktok", name: "TikTok", code: "tiktok", description: "TikTok commerce." },
  { id: "platform-shopify", name: "Shopify", code: "shopify", description: "Shopify storefront." },
  { id: "platform-unknown", name: "Unknown", code: "unknown", description: "Unassigned platform." },
];

const brands = [
  { id: "brand-yorray", name: "YorRay", code: "yorray", description: "YorRay commerce brand." },
  { id: "brand-sylvata", name: "sylvata", code: "sylvata", description: "sylvata commerce brand." },
];

const projectNames = [
  "Summer Skincare Launch",
  "Premium Coffee Gift Set",
  "Smart Desk Campaign",
  "Home Storage Refresh",
  "Athleisure Capsule",
];

const productNames = [
  "Hydrating Serum Set",
  "Premium Coffee Beans",
  "Smart Standing Desk",
  "Foldable Storage Box",
  "Performance Hoodie",
  "Kitchen Knife Bundle",
  "Facial Cleansing Device",
  "Solar Garden Lamp",
  "Pet Grooming Kit",
  "Minimal Gold Necklace",
  "Travel Packing Cubes",
  "Baby Care Lotion",
  "Resistance Band Set",
  "Magnetic Cable Clips",
  "Aromatherapy Candle",
  "Portable Juice Blender",
  "Holiday Gift Box",
  "Eco Cleaning Spray",
  "Shockproof Phone Case",
  "Premium Oolong Tea",
];

const modelNames = ["OpenAI Image", "Gemini Vision", "Flux Pro", "Local Draft"];

function platformId(index) {
  return platforms[index % 5].id;
}

function projectId(index) {
  return `project-${String((index % projectNames.length) + 1).padStart(3, "0")}`;
}

function productId(index) {
  return `product-${String((index % productNames.length) + 1).padStart(3, "0")}`;
}

function workflowId(index) {
  return `workflow-${String((index % projectNames.length) + 1).padStart(3, "0")}`;
}

function promptTemplateId(index) {
  return `prompt-template-${String((index % 10) + 1).padStart(3, "0")}`;
}

function taskId(index) {
  return `task-${String((index % 20) + 1).padStart(3, "0")}`;
}

async function clearTables() {
  await prisma.generationHistory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.promptTemplate.deleteMany();
  await prisma.media.deleteMany();
  await prisma.product.deleteMany();
  await prisma.project.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.platform.deleteMany();
}

async function seed() {
  await clearTables();

  await prisma.platform.createMany({ data: platforms });
  await prisma.brand.createMany({ data: brands });

  await prisma.project.createMany({
    data: projectNames.map((name, index) => ({
      id: projectId(index),
      name,
      description: `Seed project for ${name}.`,
      platformId: platformId(index),
      language: index % 2 === 0 ? "English" : "Chinese",
      status: index % 2 === 0 ? "Working" : "Draft",
    })),
  });

  await prisma.product.createMany({
    data: productNames.map((name, index) => ({
      id: productId(index),
      projectId: projectId(index),
      brandId: index % 2 === 0 ? "brand-yorray" : "brand-sylvata",
      platformId: platformId(index),
      name,
      sku: `SKU-${String(10000 + index * 37)}`,
      category: ["Beauty", "Food", "Home", "Fashion", "Electronics"][index % 5],
      language: index % 3 === 0 ? "Chinese" : "English",
      description: `Seed product record for ${name}.`,
      status: ["Draft", "Ready", "Generating", "Completed"][index % 4],
      tags: ["seed", "product", platforms[index % 5].name],
    })),
  });

  await prisma.media.createMany({
    data: Array.from({ length: 40 }, (_, index) => {
      const currentProductId = index % 4 === 0 ? null : productId(index);
      const type = ["jpg", "png", "webp", "psd"][index % 4];

      return {
        id: `media-${String(index + 1).padStart(3, "0")}`,
        projectId: projectId(index),
        productId: currentProductId,
        name: `Seed Media ${String(index + 1).padStart(2, "0")}`,
        filename: `seed-media-${String(index + 1).padStart(2, "0")}.${type}`,
        type,
        mimeType: type === "psd" ? "image/vnd.adobe.photoshop" : `image/${type}`,
        storagePath: `/media/seed-media-${String(index + 1).padStart(2, "0")}.${type}`,
        hash: `seed-hash-${String(index + 1).padStart(3, "0")}`,
        thumbnail: `/media/thumb-${String(index + 1).padStart(2, "0")}.jpg`,
        previewImage: `/media/preview-${String(index + 1).padStart(2, "0")}.jpg`,
        width: [1200, 1600, 1920, 1080][index % 4],
        height: [1200, 1200, 1080, 1350][index % 4],
        fileSize: `${(1.2 + index * 0.18).toFixed(1)} MB`,
        status: ["Draft", "Ready", "Processing", "Archived"][index % 4],
        tags: ["seed", "media", type],
        source: ["Camera", "Upload", "AI"][index % 3],
      };
    }),
  });

  await prisma.workflow.createMany({
    data: projectNames.map((name, index) => ({
      id: workflowId(index),
      projectId: projectId(index),
      name: `${name} Workflow`,
      description: `Seed workflow for ${name}.`,
      status: index % 2 === 0 ? "Ready" : "Draft",
      workflowJson: {
        steps: ["Import Product", "Select Media", "Prompt", "Generate", "Review", "Export"],
      },
    })),
  });

  await prisma.promptTemplate.createMany({
    data: Array.from({ length: 10 }, (_, index) => ({
      id: promptTemplateId(index),
      name: `Seed Prompt Template ${String(index + 1).padStart(2, "0")}`,
      category: ["Amazon", "Temu", "Tmall", "TikTok", "Shopify", "Banner", "Detail", "White Background", "Lifestyle", "Campaign"][index],
      platformId: platformId(index),
      language: index % 2 === 0 ? "English" : "Chinese",
      model: modelNames[index % modelNames.length],
      systemPrompt: "You are an assistant for e-commerce product image generation.",
      userPrompt: "Create a polished product visual for {{productName}} on {{platform}}.",
      negativePrompt: "Avoid distorted products, unreadable text, and incorrect packaging.",
      variables: ["productName", "platform", "sourceMedia"],
      tags: ["seed", "prompt", platforms[index % 5].name],
      version: `v1.${index}`,
      status: ["Draft", "Ready", "Review", "Archived"][index % 4],
      favorite: index % 3 === 0,
    })),
  });

  await prisma.task.createMany({
    data: Array.from({ length: 20 }, (_, index) => ({
      id: taskId(index),
      projectId: projectId(index),
      productId: productId(index),
      workflowId: workflowId(index),
      promptTemplateId: promptTemplateId(index),
      taskType: ["Generate Image", "Compare Outputs", "Prepare Export", "Prompt Review"][index % 4],
      model: modelNames[index % modelNames.length],
      status: ["Waiting", "Running", "Completed", "Failed", "Canceled"][index % 5],
      progress: [0, 35, 100, 64, 20][index % 5],
      startedAt: index % 5 === 0 ? null : new Date(`2026-06-${String((index % 20) + 1).padStart(2, "0")}T09:10:00.000Z`),
      finishedAt: index % 5 === 2 || index % 5 === 3 ? new Date(`2026-06-${String((index % 20) + 1).padStart(2, "0")}T09:24:00.000Z`) : null,
      duration: index % 5 === 0 ? null : 180 + index * 12,
      errorMessage: index % 5 === 3 ? "Seed failure message." : null,
      resultCount: index % 5 === 2 ? (index % 4) + 1 : 0,
    })),
  });

  await prisma.generationHistory.createMany({
    data: Array.from({ length: 20 }, (_, index) => ({
      id: `generation-history-${String(index + 1).padStart(3, "0")}`,
      projectId: projectId(index),
      productId: productId(index),
      workflowId: workflowId(index),
      promptTemplateId: promptTemplateId(index),
      taskId: taskId(index),
      model: modelNames[index % modelNames.length],
      prompt: "Create a seed e-commerce product visual.",
      negativePrompt: "Avoid incorrect product details.",
      size: ["1024x1024", "1200x1200", "1920x1080"][index % 3],
      quality: ["Draft", "Standard", "High"][index % 3],
      seed: 42000 + index,
      temperature: 0.4 + (index % 4) * 0.1,
      steps: 20 + (index % 5),
      cost: Number((0.02 + index * 0.005).toFixed(3)),
      duration: 120 + index * 8,
      status: ["Waiting", "Running", "Completed", "Failed"][index % 4],
      resultCount: (index % 4) + 1,
      outputMediaIds: [`media-${String((index % 40) + 1).padStart(3, "0")}`],
      errorMessage: index % 4 === 3 ? "Seed generation warning." : null,
    })),
  });
}

seed()
  .then(async () => {
    const counts = {
      brands: await prisma.brand.count(),
      platforms: await prisma.platform.count(),
      projects: await prisma.project.count(),
      products: await prisma.product.count(),
      media: await prisma.media.count(),
      workflows: await prisma.workflow.count(),
      promptTemplates: await prisma.promptTemplate.count(),
      tasks: await prisma.task.count(),
      generationHistories: await prisma.generationHistory.count(),
    };

    console.log("Seed completed", counts);
  })
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
