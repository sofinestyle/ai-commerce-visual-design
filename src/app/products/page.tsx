"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import {
  AppBadge,
  AppButton,
  AppCard,
  EmptyState,
  AppSearchBar,
  AppTable,
  AppToolbar,
  LoadingState,
  PageTitle,
} from "@/components/ui";

const platformOptions = ["All Platforms", "Amazon", "Temu", "Tmall", "TikTok", "Shopify"];
const statusOptions = ["All Status", "Draft", "Ready", "Generating", "Completed"];

type ProductStatus = "Draft" | "Ready" | "Generating" | "Completed";

type ApiProduct = {
  id: string;
  projectId: string;
  brandId: string;
  platformId: string;
  name: string;
  sku: string;
  category: string;
  language: string;
  description: string | null;
  coverMediaId: string | null;
  status: ProductStatus;
  tags: unknown;
  createdAt: string;
  updatedAt: string;
};

type ProductsResponse = {
  success: boolean;
  data?: ApiProduct[];
  error?: string;
};

const statusBadgeVariant: Record<ProductStatus, "default" | "success" | "warning" | "danger"> = {
  Draft: "default",
  Ready: "success",
  Generating: "warning",
  Completed: "success",
};

const platformNameById: Record<string, string> = {
  "platform-amazon": "Amazon",
  "platform-temu": "Temu",
  "platform-tmall": "Tmall",
  "platform-tiktok": "TikTok",
  "platform-shopify": "Shopify",
  "platform-unknown": "Unknown",
};

const brandNameById: Record<string, string> = {
  "brand-yorray": "YorRay",
  "brand-sylvata": "sylvata",
};

const tableColumns = [
  { key: "name", title: "Product" },
  { key: "sku", title: "SKU" },
  { key: "platform", title: "Platform" },
  { key: "status", title: "Status" },
  { key: "images", title: "Images" },
  { key: "updatedAt", title: "Updated" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getTags(tags: unknown) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.filter((tag): tag is string => typeof tag === "string");
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchProducts() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/products");
        const result = (await response.json()) as ProductsResponse;

        if (!response.ok || !result.success) {
          throw new Error(result.error ?? "Failed to load products.");
        }

        if (isMounted) {
          setProducts(result.data ?? []);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Failed to load products.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const tableRows = products.slice(0, 8).map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    platform: platformNameById[product.platformId] ?? "Unknown",
    status: product.status,
    images: "-",
    updatedAt: formatDate(product.updatedAt),
  }));

  return (
    <AppShell>
      <main className="min-w-0 flex-1 overflow-auto bg-white p-6 text-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <PageTitle
              title="Products"
              subtitle="Manage product information, assets, and AI-ready image references."
            />
            <div className="flex rounded-lg border border-blue-100 bg-white p-1 shadow-sm shadow-blue-100/70">
              <AppButton size="sm">Grid</AppButton>
              <AppButton size="sm" variant="ghost">
                List
              </AppButton>
            </div>
          </div>

          <AppCard className="p-5">
            <AppToolbar
              title="Product Management"
              subtitle="High-fidelity placeholder workspace for product records."
              actions={
                <>
                  <AppButton size="sm">New Product</AppButton>
                  <AppButton size="sm" variant="secondary">
                    Import Product
                  </AppButton>
                  <AppButton size="sm" variant="secondary">
                    Batch Import
                  </AppButton>
                </>
              }
            />
            <div className="mt-5 grid grid-cols-[1fr_180px_160px_auto] gap-3">
              <AppSearchBar placeholder="Search products" />
              <select className="h-10 rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
                {platformOptions.map((platform) => (
                  <option key={platform}>{platform}</option>
                ))}
              </select>
              <select className="h-10 rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
                {statusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
              <AppButton variant="ghost">View Switch</AppButton>
            </div>
          </AppCard>

          {isLoading ? (
            <section className="grid grid-cols-4 gap-5">
              {Array.from({ length: 4 }, (_, index) => (
                <LoadingState key={index} />
              ))}
            </section>
          ) : null}

          {!isLoading && error ? (
            <AppCard className="border-red-100 bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-700">Unable to load products</p>
              <p className="mt-2 text-sm text-red-600">{error}</p>
            </AppCard>
          ) : null}

          {!isLoading && !error && products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Products from the database will appear here after seed data is available."
            />
          ) : null}

          {!isLoading && !error && products.length > 0 ? (
            <section className="grid grid-cols-4 gap-5">
              {products.map((product) => {
                const platformName = platformNameById[product.platformId] ?? "Unknown";
                const brandName = brandNameById[product.brandId] ?? "Unknown Brand";
                const tags = getTags(product.tags);

                return (
                  <AppCard
                    key={product.id}
                    className="group cursor-pointer overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md hover:shadow-blue-100"
                  >
                    <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100">
                      <div className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-blue-700 shadow-sm">
                        {product.coverMediaId ?? product.id}
                      </div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-white text-base font-semibold text-blue-600 shadow-sm">
                        {platformName.slice(0, 2).toUpperCase()}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-slate-950">
                            {product.name}
                          </h3>
                          <p className="mt-1 text-xs font-medium text-slate-500">
                            SKU {product.sku}
                          </p>
                        </div>
                        <AppBadge>{platformName}</AppBadge>
                      </div>

                      <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                        {product.description ?? "No description provided."}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {tags.slice(0, 3).map((tag) => (
                          <AppBadge key={tag} variant="default">
                            {tag}
                          </AppBadge>
                        ))}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 border-y border-blue-50 py-3">
                        <div>
                          <p className="text-xs text-slate-500">Images</p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">-</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Updated</p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">
                            {formatDate(product.updatedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="truncate text-xs font-medium text-slate-500">
                          {brandName} / {product.category}
                        </p>
                        <AppBadge variant={statusBadgeVariant[product.status]}>
                          {product.status}
                        </AppBadge>
                      </div>
                    </div>
                  </AppCard>
                );
              })}
            </section>
          ) : null}

          {!isLoading && !error && products.length > 0 ? (
            <AppCard className="p-5">
              <AppToolbar
                title="Table View"
                subtitle="Static list-mode preview using the current product records."
              />
              <div className="mt-4">
                <AppTable columns={tableColumns} rows={tableRows} />
              </div>
            </AppCard>
          ) : null}

          <AppCard className="flex items-center justify-between p-4">
            <AppButton variant="secondary">Previous</AppButton>
            <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              Page 1 of 3
            </div>
            <AppButton variant="secondary">Next</AppButton>
          </AppCard>
        </div>
      </main>
    </AppShell>
  );
}
