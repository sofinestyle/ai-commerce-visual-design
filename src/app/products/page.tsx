"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import {
  AppBadge,
  AppButton,
  AppCard,
  EmptyState,
  AppInput,
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

type ApiProject = {
  id: string;
  name: string;
};

type ApiBrand = {
  id: string;
  name: string;
};

type ApiPlatform = {
  id: string;
  name: string;
};

type ProjectsResponse = {
  success: boolean;
  data?: ApiProject[];
  error?: string;
};

type BrandsResponse = {
  success: boolean;
  data?: ApiBrand[];
  error?: string;
};

type PlatformsResponse = {
  success: boolean;
  data?: ApiPlatform[];
  error?: string;
};

type CreateProductResponse = {
  success: boolean;
  data?: ApiProduct;
  error?: string;
};

type CreateProductForm = {
  projectId: string;
  brandId: string;
  platformId: string;
  name: string;
  sku: string;
  category: string;
  language: string;
  description: string;
  status: ProductStatus;
  tags: string;
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

const initialCreateForm: CreateProductForm = {
  projectId: "",
  brandId: "",
  platformId: "",
  name: "",
  sku: "",
  category: "",
  language: "en",
  description: "",
  status: "Draft",
  tags: "",
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
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [brands, setBrands] = useState<ApiBrand[]>([]);
  const [platforms, setPlatforms] = useState<ApiPlatform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateProductForm>(initialCreateForm);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/products");
      const result = (await response.json()) as ProductsResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to load products.");
      }

      setProducts(result.data ?? []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load products.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchReferences = useCallback(async () => {
    try {
      setReferenceError(null);

      const [projectsResponse, brandsResponse, platformsResponse] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/brands"),
        fetch("/api/platforms"),
      ]);

      const projectsResult = (await projectsResponse.json()) as ProjectsResponse;
      const brandsResult = (await brandsResponse.json()) as BrandsResponse;
      const platformsResult = (await platformsResponse.json()) as PlatformsResponse;

      if (!projectsResponse.ok || !projectsResult.success) {
        throw new Error(projectsResult.error ?? "Failed to load projects.");
      }

      if (!brandsResponse.ok || !brandsResult.success) {
        throw new Error(brandsResult.error ?? "Failed to load brands.");
      }

      if (!platformsResponse.ok || !platformsResult.success) {
        throw new Error(platformsResult.error ?? "Failed to load platforms.");
      }

      setProjects(projectsResult.data ?? []);
      setBrands(brandsResult.data ?? []);
      setPlatforms(platformsResult.data ?? []);
    } catch (requestError) {
      setReferenceError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load product references.",
      );
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchProducts();
      fetchReferences();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchProducts, fetchReferences]);

  function getPlatformName(platformId: string) {
    return (
      platforms.find((platform) => platform.id === platformId)?.name ??
      platformNameById[platformId] ??
      "Unknown"
    );
  }

  function getBrandName(brandId: string) {
    return (
      brands.find((brand) => brand.id === brandId)?.name ??
      brandNameById[brandId] ??
      "Unknown Brand"
    );
  }

  function openCreateDialog() {
    setCreateForm({
      ...initialCreateForm,
      projectId: projects[0]?.id ?? "",
      brandId: brands[0]?.id ?? "",
      platformId: platforms[0]?.id ?? "",
    });
    setCreateError(null);
    setIsCreateOpen(true);
  }

  function closeCreateDialog() {
    if (!isSubmitting) {
      setIsCreateOpen(false);
      setCreateError(null);
    }
  }

  function updateCreateForm(field: keyof CreateProductForm, value: string) {
    setCreateForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function updateCreateStatus(value: string) {
    const nextStatus = statusOptions.includes(value as ProductStatus)
      ? (value as ProductStatus)
      : "Draft";

    updateCreateForm("status", nextStatus);
  }

  function parseTags(value: string) {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const projectId = createForm.projectId.trim();
    const brandId = createForm.brandId.trim();
    const platformId = createForm.platformId.trim();
    const name = createForm.name.trim();
    const sku = createForm.sku.trim();

    if (!projectId) {
      setCreateError("Project is required.");
      return;
    }

    if (!brandId) {
      setCreateError("Brand is required.");
      return;
    }

    if (!platformId) {
      setCreateError("Platform is required.");
      return;
    }

    if (!name) {
      setCreateError("Product name is required.");
      return;
    }

    if (!sku) {
      setCreateError("SKU is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setCreateError(null);

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          brandId,
          platformId,
          name,
          sku,
          category: createForm.category.trim(),
          language: createForm.language.trim() || "en",
          description: createForm.description.trim(),
          status: createForm.status || "Draft",
          tags: parseTags(createForm.tags),
        }),
      });
      const result = (await response.json()) as CreateProductResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to create product.");
      }

      setIsCreateOpen(false);
      setCreateForm(initialCreateForm);
      await fetchProducts();
    } catch (requestError) {
      setCreateError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to create product.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const tableRows = products.slice(0, 8).map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    platform: getPlatformName(product.platformId),
    status: product.status,
    images: "-",
    updatedAt: formatDate(product.updatedAt),
  }));

  const createStatusOptions = statusOptions.filter(
    (status): status is ProductStatus => status !== "All Status",
  );

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
                  <AppButton onClick={openCreateDialog} size="sm">
                    New Product
                  </AppButton>
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
                const platformName = getPlatformName(product.platformId);
                const brandName = getBrandName(product.brandId);
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

          {isCreateOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-6">
              <AppCard className="max-h-[90vh] w-full max-w-3xl overflow-auto p-6">
                <div className="flex items-start justify-between gap-4">
                  <PageTitle
                    title="New Product"
                    subtitle="Create a database-backed product record."
                  />
                  <AppButton
                    disabled={isSubmitting}
                    onClick={closeCreateDialog}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Close
                  </AppButton>
                </div>

                <form className="mt-5 space-y-4" onSubmit={handleCreateProduct}>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Project
                      </span>
                      <select
                        className="h-10 w-full rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateCreateForm("projectId", event.target.value)
                        }
                        required
                        value={createForm.projectId}
                      >
                        <option value="">Select project</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Brand
                      </span>
                      <select
                        className="h-10 w-full rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateCreateForm("brandId", event.target.value)
                        }
                        required
                        value={createForm.brandId}
                      >
                        <option value="">Select brand</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Platform
                      </span>
                      <select
                        className="h-10 w-full rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateCreateForm("platformId", event.target.value)
                        }
                        required
                        value={createForm.platformId}
                      >
                        <option value="">Select platform</option>
                        {platforms.map((platform) => (
                          <option key={platform.id} value={platform.id}>
                            {platform.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <AppInput
                      label="Product Name"
                      onChange={(event) => updateCreateForm("name", event.target.value)}
                      placeholder="Enter product name"
                      required
                      value={createForm.name}
                    />
                    <AppInput
                      label="SKU"
                      onChange={(event) => updateCreateForm("sku", event.target.value)}
                      placeholder="Enter SKU"
                      required
                      value={createForm.sku}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <AppInput
                      label="Category"
                      onChange={(event) =>
                        updateCreateForm("category", event.target.value)
                      }
                      placeholder="Optional category"
                      value={createForm.category}
                    />
                    <AppInput
                      label="Language"
                      onChange={(event) =>
                        updateCreateForm("language", event.target.value)
                      }
                      value={createForm.language}
                    />
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Status
                      </span>
                      <select
                        className="h-10 w-full rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) => updateCreateStatus(event.target.value)}
                        value={createForm.status}
                      >
                        {createStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Description
                    </span>
                    <textarea
                      className="min-h-24 w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      onChange={(event) =>
                        updateCreateForm("description", event.target.value)
                      }
                      placeholder="Optional product description"
                      value={createForm.description}
                    />
                  </label>

                  <AppInput
                    label="Tags"
                    onChange={(event) => updateCreateForm("tags", event.target.value)}
                    placeholder="api, hero, amazon"
                    value={createForm.tags}
                  />

                  {referenceError ? (
                    <p className="rounded-lg border border-yellow-100 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
                      {referenceError}
                    </p>
                  ) : null}

                  {createError ? (
                    <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {createError}
                    </p>
                  ) : null}

                  <div className="flex items-center justify-end gap-3 border-t border-blue-50 pt-4">
                    <AppButton
                      disabled={isSubmitting}
                      onClick={closeCreateDialog}
                      type="button"
                      variant="secondary"
                    >
                      Cancel
                    </AppButton>
                    <AppButton disabled={isSubmitting} type="submit">
                      {isSubmitting ? "Creating..." : "Create Product"}
                    </AppButton>
                  </div>
                </form>
              </AppCard>
            </div>
          ) : null}
        </div>
      </main>
    </AppShell>
  );
}
