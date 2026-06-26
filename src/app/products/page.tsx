import { AppShell } from "@/components/layout/AppShell";
import {
  AppBadge,
  AppButton,
  AppCard,
  AppSearchBar,
  AppTable,
  AppToolbar,
  PageTitle,
} from "@/components/ui";
import { mockProducts, type ProductStatus } from "@/lib/mockProducts";

const platformOptions = ["All Platforms", "Amazon", "Temu", "Tmall", "TikTok", "Shopify"];
const statusOptions = ["All Status", "Draft", "Ready", "Generating", "Completed"];

const statusBadgeVariant: Record<ProductStatus, "default" | "success" | "warning" | "danger"> = {
  Draft: "default",
  Ready: "success",
  Generating: "warning",
  Completed: "success",
};

const tableColumns = [
  { key: "name", title: "Product" },
  { key: "sku", title: "SKU" },
  { key: "platform", title: "Platform" },
  { key: "status", title: "Status" },
  { key: "images", title: "Images" },
  { key: "updatedAt", title: "Updated" },
];

const tableRows = mockProducts.slice(0, 8).map((product) => ({
  id: product.id,
  name: product.name,
  sku: product.sku,
  platform: product.platform,
  status: product.status,
  images: product.sourceImages.length + product.generatedImages.length,
  updatedAt: product.updatedAt,
}));

export default function ProductsPage() {
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

          <section className="grid grid-cols-4 gap-5">
            {mockProducts.slice(0, 24).map((product) => {
              const imageCount =
                product.gallery.length +
                product.sourceImages.length +
                product.generatedImages.length;

              return (
                <AppCard
                  key={product.id}
                  className="group cursor-pointer overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md hover:shadow-blue-100"
                >
                  <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100">
                    <div className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-blue-700 shadow-sm">
                      {product.thumbnail}
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-white text-base font-semibold text-blue-600 shadow-sm">
                      {product.platform.slice(0, 2).toUpperCase()}
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
                      <AppBadge>{product.platform}</AppBadge>
                    </div>

                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                      {product.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {product.tags.slice(0, 3).map((tag) => (
                        <AppBadge key={tag} variant="default">
                          {tag}
                        </AppBadge>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 border-y border-blue-50 py-3">
                      <div>
                        <p className="text-xs text-slate-500">Images</p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {imageCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Updated</p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {product.updatedAt}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="truncate text-xs font-medium text-slate-500">
                        {product.brand} / {product.category}
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

          <AppCard className="p-5">
            <AppToolbar
              title="Table View"
              subtitle="Static list-mode preview using the same placeholder products."
            />
            <div className="mt-4">
              <AppTable columns={tableColumns} rows={tableRows} />
            </div>
          </AppCard>

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
