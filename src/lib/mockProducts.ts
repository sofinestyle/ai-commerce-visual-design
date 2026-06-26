export type ProductPlatform = "Amazon" | "Temu" | "Tmall" | "TikTok" | "Shopify";

export type ProductStatus = "Draft" | "Ready" | "Generating" | "Completed";

export interface Product {
  id: string;
  projectId: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  platform: ProductPlatform;
  language: string;
  description: string;
  thumbnail: string;
  gallery: string[];
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  sourceImages: string[];
  generatedImages: string[];
  coverImage: string;
}

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
  "Silicone Food Bags",
  "Wireless Desk Charger",
  "Running Waist Pack",
  "Ceramic Dinner Plate",
  "Vitamin C Toner",
  "Cold Brew Bottle",
  "Ergonomic Mouse Pad",
  "Underbed Organizer",
  "Yoga Training Mat",
  "Stainless Pan Set",
  "LED Makeup Mirror",
  "Outdoor String Lights",
  "Cat Scratcher Board",
  "Pearl Earring Set",
  "Passport Wallet",
  "Baby Feeding Spoon",
  "Adjustable Dumbbell",
  "Cable Organizer Tray",
  "Reed Diffuser Kit",
  "Mini Food Processor",
  "Festival Snack Box",
  "Laundry Detergent Sheets",
  "MagSafe Wallet Case",
  "Jasmine Tea Tin",
  "Reusable Water Bottle",
  "Desktop Monitor Stand",
  "Compression Socks",
  "Marble Serving Tray",
  "Repair Hair Mask",
  "Espresso Cup Set",
];

const brands = ["Northline", "BluePeak", "MiraLab", "UrbanNest", "VelaWorks"];
const categories = ["Beauty", "Food", "Home", "Fashion", "Electronics", "Lifestyle"];
const platforms: ProductPlatform[] = ["Amazon", "Temu", "Tmall", "TikTok", "Shopify"];
const statuses: ProductStatus[] = ["Draft", "Ready", "Generating", "Completed"];
const languages = ["English", "Chinese", "English", "English", "Chinese"];
const projectIds = Array.from({ length: 20 }, (_, index) => {
  return `project-${String(index + 1).padStart(3, "0")}`;
});

function createImageList(prefix: string, count: number) {
  return Array.from({ length: count }, (_, index) => {
    return `${prefix}-${String(index + 1).padStart(2, "0")}`;
  });
}

export const mockProducts: Product[] = productNames.map((name, index) => {
  const productNumber = index + 1;
  const platform = platforms[index % platforms.length];
  const status = statuses[index % statuses.length];
  const imageCount = (index % 5) + 2;
  const generatedCount = index % 4;
  const slug = name.toLowerCase().replaceAll(" ", "-");

  return {
    id: `product-${String(productNumber).padStart(3, "0")}`,
    projectId: projectIds[index % projectIds.length],
    name,
    sku: `${platform.slice(0, 3).toUpperCase()}-${String(8400 + productNumber * 37)}`,
    brand: brands[index % brands.length],
    category: categories[index % categories.length],
    platform,
    language: languages[index % languages.length],
    description: `Placeholder product record for ${name}.`,
    thumbnail: `thumbnail-${slug}`,
    gallery: createImageList(`gallery-${slug}`, imageCount),
    status,
    createdAt: `2026-05-${String((index % 28) + 1).padStart(2, "0")}`,
    updatedAt: `2026-06-${String(26 - (index % 21)).padStart(2, "0")}`,
    tags: [categories[index % categories.length], platform, status],
    sourceImages: createImageList(`source-${slug}`, imageCount + 1),
    generatedImages: createImageList(`generated-${slug}`, generatedCount),
    coverImage: `cover-${slug}`,
  };
});
