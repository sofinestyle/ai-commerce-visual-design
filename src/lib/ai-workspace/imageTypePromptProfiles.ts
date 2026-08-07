import type { GenerationContext } from "@/lib/ai-workspace/types";

function normalizedTheme(context: GenerationContext) {
  return `${context.imageType} ${context.theme} ${context.visualRule.theme}`.toLowerCase();
}

function isSetImage(context: GenerationContext) {
  return /套装|配件|全套|set|bundle|contents|accessories/.test(
    `${normalizedTheme(context)} ${context.designIntent}`,
  );
}

function isDetailImage(context: GenerationContext) {
  return context.imageType === "详情页" || /细节|detail|macro|close/.test(normalizedTheme(context));
}

function isLifestyleImage(context: GenerationContext) {
  return /使用场景|场景|lifestyle|scene|real use/.test(normalizedTheme(context));
}

function isProductImage(context: GenerationContext) {
  return /产品图|product/.test(normalizedTheme(context));
}

function isHeroImage(context: GenerationContext) {
  return /首图|主图|hero|main/.test(normalizedTheme(context)) && !isSetImage(context);
}

function splitList(value?: string) {
  return (value ?? "")
    .split(/[；;、,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildAccessoryChecklist(accessories?: string) {
  const items = splitList(accessories);

  return items.length > 0
    ? items.map((item, index) => `${index + 1}. ${item}`).join("; ")
    : "";
}

export function getImageTypePromptProfile(context: GenerationContext) {
  if (isSetImage(context)) {
    const accessoryChecklist = buildAccessoryChecklist(context.productFacts.accessories);

    return {
      avoid: ["Do not add unverified accessories."],
      required: [
        "Create a clear product image based on the design intent.",
        accessoryChecklist
          ? `When showing set contents, show only the verified items and preserve quantities: ${accessoryChecklist}.`
          : "If no verified accessories are listed, do not invent set contents.",
        "Keep the main product readable while arranging accessories clearly and separately.",
      ],
      theme: "product image",
    };
  }

  if (isDetailImage(context)) {
    return {
      avoid: ["Do not change verified product facts."],
      required: [
        context.imageType === "详情页"
          ? "Create detail-page content driven by the design intent."
          : "Create a true macro/detail image when the design intent asks for detail display.",
        "Preserve product material and structure accuracy.",
      ],
      theme: context.imageType === "详情页" ? "detail-page content image" : "macro detail image",
    };
  }

  if (isLifestyleImage(context)) {
    return {
      avoid: [
        "Do not degrade into a plain studio gradient if a real-use scene is requested.",
        "Do not let people, props, or backgrounds obscure the key product structure.",
      ],
      required: [
        "Create a real-use lifestyle image with a specific environment.",
        "Define a natural placement, use, or human-product relationship when the scene asks for one.",
        "Keep the product scale believable within the environment.",
      ],
      theme: "real-use lifestyle image",
    };
  }

  if (isProductImage(context)) {
    return {
      avoid: [
        "Do not add unverified scenes, accessories, or props.",
        "Do not distort the product outline or material finish.",
      ],
      required: [
        "Create a clean product image with the full product clearly visible.",
        "Preserve outline, color, material finish, and key structure.",
        "Use clear commercial lighting and product-first framing.",
      ],
      theme: "product image",
    };
  }

  if (isHeroImage(context)) {
    return {
      avoid: [
        "Do not create multiple views, comparison panels, or contact sheets.",
        "Do not overload the image with text or decorative props.",
      ],
      required: [
        "Create a high-clarity main hero image with one dominant product composition.",
        "Use the correct primary product view and mobile-readable product scale.",
        "Follow the effective copy and logo policy exactly.",
      ],
      theme: "main hero image",
    };
  }

  return {
    avoid: ["Do not create collages, multi-view canvases, or unsupported product claims."],
    required: [
      "Create a product-first ecommerce image.",
      "Follow the selected theme while preserving product facts and reference-image accuracy.",
    ],
    theme: "ecommerce product image",
  };
}
