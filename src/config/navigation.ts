export type NavigationItem = {
  id: string;
  title: string;
  icon: string;
  path: string;
  description: string;
  enabled: boolean;
};

export const primaryNavigation: NavigationItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: "DB",
    path: "/dashboard",
    description: "Overview of projects, products, tasks, and workspace activity.",
    enabled: true,
  },
  {
    id: "projects",
    title: "Projects",
    icon: "PR",
    path: "/projects",
    description: "Manage visual design projects and campaign workspaces.",
    enabled: true,
  },
  {
    id: "products",
    title: "Products",
    icon: "PD",
    path: "/products",
    description: "Organize product information for visual generation workflows.",
    enabled: true,
  },
  {
    id: "media-library",
    title: "Media Library",
    icon: "ML",
    path: "/media",
    description: "Store product images, source assets, and generated media.",
    enabled: true,
  },
  {
    id: "ai-generate",
    title: "AI Generate",
    icon: "AI",
    path: "/ai",
    description: "Prepare AI-assisted image generation and editing workflows.",
    enabled: true,
  },
  {
    id: "history",
    title: "History",
    icon: "HI",
    path: "/history",
    description: "Review previous generation activity and project updates.",
    enabled: true,
  },
  {
    id: "settings",
    title: "Settings",
    icon: "ST",
    path: "/settings",
    description: "Configure workspace preferences and platform defaults.",
    enabled: true,
  },
];
