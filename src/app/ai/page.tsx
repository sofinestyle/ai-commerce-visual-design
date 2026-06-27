"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import {
  AppBadge,
  AppButton,
  AppCard,
  AppInput,
  AppToolbar,
  EmptyState,
  LoadingState,
  PageTitle,
} from "@/components/ui";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type Project = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  projectId: string;
  name: string;
  platform?: {
    name: string;
    code: string;
  } | null;
};

type MediaAsset = {
  id: string;
  projectId: string;
  productId?: string | null;
  name: string;
  filename: string;
  thumbnail?: string | null;
  storagePath?: string | null;
};

type AnalysisResult = {
  productType: string;
  material: string;
  color: string;
  background: string;
  platform: string;
  suggestedPrompt: string;
};

type GeneratedImage = {
  id: string;
  url: string;
  prompt: string;
  model: string;
};

type GenerationResult = {
  taskId: string;
  status: string;
  images: GeneratedImage[];
};

const variables = ["productName", "platform", "sellingPoint", "sourceMedia"];
const promptTemplates = [
  "White background marketplace image",
  "Premium lifestyle scene",
  "Detail closeup with feature callouts",
];
const queueItems = [
  { label: "Waiting", count: 8, variant: "default" as const },
  { label: "Generating", count: 3, variant: "warning" as const },
  { label: "Completed", count: 24, variant: "success" as const },
  { label: "Failed", count: 2, variant: "danger" as const },
];

async function fetchApiData<T>(url: string) {
  const response = await fetch(url);
  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.error || `Failed to load ${url}.`);
  }

  return result.data;
}

export default function AIPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedMediaId, setSelectedMediaId] = useState("");
  const [prompt, setPrompt] = useState(
    "Create a clean premium marketplace image for {{productName}} using {{sourceMedia}}. Highlight {{sellingPoint}} and optimize the composition for {{platform}}.",
  );
  const [negativePrompt, setNegativePrompt] = useState(
    "Avoid distorted product details, unreadable text, extra objects, incorrect packaging, and low-quality lighting.",
  );
  const [model, setModel] = useState("gpt-image-2");
  const [platform, setPlatform] = useState("amazon");
  const [size, setSize] = useState("1024x1024");
  const [quality, setQuality] = useState("high");
  const [count, setCount] = useState(1);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [generationResult, setGenerationResult] =
    useState<GenerationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const loadWorkspaceData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const [projectResult, productResult, mediaResult] = await Promise.allSettled([
      fetchApiData<Project[]>("/api/projects"),
      fetchApiData<Product[]>("/api/products"),
      fetchApiData<MediaAsset[]>("/api/media"),
    ]);

    const loadErrors: string[] = [];

    if (projectResult.status === "fulfilled") {
      setProjects(projectResult.value);
      setSelectedProjectId((current) => current || projectResult.value[0]?.id || "");
    } else {
      setProjects([]);
      loadErrors.push(
        projectResult.reason instanceof Error
          ? projectResult.reason.message
          : "Failed to load projects.",
      );
    }

    if (productResult.status === "fulfilled") {
      setProducts(productResult.value);
    } else {
      setProducts([]);
      loadErrors.push(
        productResult.reason instanceof Error
          ? productResult.reason.message
          : "Failed to load products.",
      );
    }

    if (mediaResult.status === "fulfilled") {
      setMediaAssets(mediaResult.value);
    } else {
      setMediaAssets([]);
      loadErrors.push(
        mediaResult.reason instanceof Error
          ? mediaResult.reason.message
          : "Failed to load media.",
      );
    }

    setError(loadErrors.join(" "));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadWorkspaceData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadWorkspaceData]);

  const filteredProducts = useMemo(
    () => products.filter((product) => product.projectId === selectedProjectId),
    [products, selectedProjectId],
  );

  const activeProductId = useMemo(() => {
    if (filteredProducts.some((product) => product.id === selectedProductId)) {
      return selectedProductId;
    }

    return filteredProducts[0]?.id || "";
  }, [filteredProducts, selectedProductId]);

  const filteredMedia = useMemo(() => {
    const projectMedia = mediaAssets.filter(
      (media) => media.projectId === selectedProjectId,
    );

    if (!activeProductId) {
      return projectMedia;
    }

    const productMedia = projectMedia.filter(
      (media) => media.productId === activeProductId,
    );

    return productMedia.length > 0 ? productMedia : projectMedia;
  }, [activeProductId, mediaAssets, selectedProjectId]);

  const activeMediaId = useMemo(() => {
    if (filteredMedia.some((media) => media.id === selectedMediaId)) {
      return selectedMediaId;
    }

    return filteredMedia[0]?.id || "";
  }, [filteredMedia, selectedMediaId]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const selectedProduct = products.find((product) => product.id === activeProductId);
  const selectedMedia = mediaAssets.find((media) => media.id === activeMediaId);

  const handleAnalyze = async () => {
    if (!activeMediaId) {
      setError("Please select a media asset before analysis.");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const response = await fetch("/api/media/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mediaId: activeMediaId }),
      });
      const result = (await response.json()) as ApiResponse<AnalysisResult>;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || "Image analysis failed.");
      }

      setAnalysisResult(result.data);
      setPrompt(result.data.suggestedPrompt);
      setPlatform(result.data.platform);
    } catch (analyzeError) {
      setError(
        analyzeError instanceof Error
          ? analyzeError.message
          : "Image analysis failed.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedProjectId || !activeProductId || !prompt.trim()) {
      setError("Project, product, and prompt are required before generation.");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          productId: activeProductId,
          mediaId: activeMediaId,
          prompt,
          model,
          platform,
          size,
          quality,
          count,
        }),
      });
      const result = (await response.json()) as ApiResponse<GenerationResult>;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || "Mock generation failed.");
      }

      setGenerationResult(result.data);
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Mock generation failed.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AppShell>
      <main className="min-w-0 flex-1 overflow-auto bg-white p-6 text-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <PageTitle
            title="AI Workspace"
            subtitle="Control center for AI product image production workflows."
          />

          <AppCard className="p-5">
            <AppToolbar
              title="Generation Control"
              subtitle="AI workflow for image analysis, prompt preparation, and generation."
              actions={
                <>
                  <AppButton
                    disabled={isGenerating || isLoading}
                    onClick={handleGenerate}
                    size="sm"
                  >
                    {isGenerating ? "Generating..." : "Generate"}
                  </AppButton>
                  <AppButton disabled size="sm" variant="secondary">
                    Batch Generate
                  </AppButton>
                  <AppButton disabled size="sm" variant="secondary">
                    Save Prompt
                  </AppButton>
                  <AppButton disabled size="sm" variant="ghost">
                    History
                  </AppButton>
                  <AppButton
                    disabled={isLoading}
                    onClick={loadWorkspaceData}
                    size="sm"
                    variant="ghost"
                  >
                    Refresh
                  </AppButton>
                </>
              }
            />
          </AppCard>

          {error ? (
            <AppCard className="border-red-200 bg-red-50 p-4" withShadow={false}>
              <p className="text-sm font-medium text-red-700">{error}</p>
            </AppCard>
          ) : null}

          {isLoading ? (
            <AppCard className="p-5" withShadow={false}>
              <LoadingState />
            </AppCard>
          ) : null}

          <section className="grid min-h-[640px] grid-cols-[240px_1fr_300px] gap-5">
              <div className="flex flex-col gap-4">
                <AppCard className="overflow-hidden">
                  <div className="border-b border-blue-100 p-4">
                    <h2 className="text-base font-semibold text-slate-950">
                      Project
                    </h2>
                  </div>
                  <div className="space-y-2 p-3">
                    <select
                      className="h-10 w-full rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      disabled={isLoading || projects.length === 0}
                      onChange={(event) => {
                        setSelectedProjectId(event.target.value);
                        setGenerationResult(null);
                        setAnalysisResult(null);
                      }}
                      value={selectedProjectId}
                    >
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    {!isLoading && projects.length === 0 ? (
                      <EmptyState
                        title="No projects"
                        description="Create or seed projects before generating AI images."
                      />
                    ) : null}
                  </div>
                </AppCard>

                <AppCard className="overflow-hidden">
                  <div className="border-b border-blue-100 p-4">
                    <h2 className="text-base font-semibold text-slate-950">
                      Product
                    </h2>
                  </div>
                  <div className="space-y-2 p-3">
                    <select
                      className="h-10 w-full rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      disabled={isLoading || filteredProducts.length === 0}
                      onChange={(event) => {
                        setSelectedProductId(event.target.value);
                        setGenerationResult(null);
                      }}
                      value={activeProductId}
                    >
                      {filteredProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    {!isLoading && filteredProducts.length === 0 ? (
                      <EmptyState
                        title="No products"
                        description="No products are linked to the selected project."
                      />
                    ) : null}
                  </div>
                </AppCard>

                <AppCard className="overflow-hidden">
                  <div className="border-b border-blue-100 p-4">
                    <h2 className="text-base font-semibold text-slate-950">Media</h2>
                  </div>
                  <div className="space-y-3 p-3">
                    <select
                      className="h-10 w-full rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      disabled={isLoading || filteredMedia.length === 0}
                      onChange={(event) => {
                        setSelectedMediaId(event.target.value);
                        setAnalysisResult(null);
                        setGenerationResult(null);
                      }}
                      value={activeMediaId}
                    >
                      {filteredMedia.map((media) => (
                        <option key={media.id} value={media.id}>
                          {media.name || media.filename}
                        </option>
                      ))}
                    </select>
                    <AppButton
                      className="w-full"
                      disabled={isAnalyzing || !activeMediaId}
                      onClick={handleAnalyze}
                      size="sm"
                      variant="secondary"
                    >
                      {isAnalyzing ? "Analyzing..." : "Analyze Image"}
                    </AppButton>
                    {!isLoading && filteredMedia.length === 0 ? (
                      <EmptyState
                        title="No media"
                        description="No media assets are linked to the selected project or product."
                      />
                    ) : null}
                  </div>
                </AppCard>
              </div>

              <AppCard className="overflow-hidden">
                <div className="border-b border-blue-100 p-5">
                  <AppToolbar
                    title="Prompt Editor"
                    subtitle="Analyze a selected image to populate the prompt."
                    actions={<AppBadge>{analysisResult ? "Analyzed" : "Draft"}</AppBadge>}
                  />
                </div>
                <div className="space-y-5 p-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Prompt
                    </span>
                    <textarea
                      className="min-h-40 w-full resize-none rounded-lg border border-blue-100 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      onChange={(event) => setPrompt(event.target.value)}
                      placeholder="Describe the desired e-commerce product image..."
                      value={prompt}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Negative Prompt
                    </span>
                    <textarea
                      className="min-h-24 w-full resize-none rounded-lg border border-blue-100 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      onChange={(event) => setNegativePrompt(event.target.value)}
                      placeholder="Describe what should be avoided..."
                      value={negativePrompt}
                    />
                  </label>

                  {analysisResult ? (
                    <AppCard className="bg-blue-50 p-4" withShadow={false}>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <p className="text-slate-600">
                          Product Type:{" "}
                          <span className="font-semibold text-slate-950">
                            {analysisResult.productType}
                          </span>
                        </p>
                        <p className="text-slate-600">
                          Material:{" "}
                          <span className="font-semibold text-slate-950">
                            {analysisResult.material}
                          </span>
                        </p>
                        <p className="text-slate-600">
                          Color:{" "}
                          <span className="font-semibold text-slate-950">
                            {analysisResult.color}
                          </span>
                        </p>
                        <p className="text-slate-600">
                          Background:{" "}
                          <span className="font-semibold text-slate-950">
                            {analysisResult.background}
                          </span>
                        </p>
                      </div>
                    </AppCard>
                  ) : null}

                  <div className="grid grid-cols-2 gap-4">
                    <AppCard className="p-4" withShadow={false}>
                      <p className="text-sm font-semibold text-slate-950">
                        Variables
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {variables.map((variable) => (
                          <AppBadge key={variable}>{`{{${variable}}}`}</AppBadge>
                        ))}
                      </div>
                    </AppCard>

                    <AppCard className="p-4" withShadow={false}>
                      <p className="text-sm font-semibold text-slate-950">
                        Prompt Templates
                      </p>
                      <div className="mt-3 space-y-2">
                        {promptTemplates.map((template) => (
                          <div
                            key={template}
                            className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-slate-600"
                          >
                            {template}
                          </div>
                        ))}
                      </div>
                    </AppCard>
                  </div>
                </div>
              </AppCard>

              <AppCard className="overflow-hidden">
                <div className="border-b border-blue-100 p-5">
                  <AppToolbar title="AI Parameters" subtitle="AI generation settings." />
                </div>
                <div className="space-y-4 p-5">
                  <AppInput
                    label="Model"
                    onChange={(event) => setModel(event.target.value)}
                    value={model}
                  />
                  <AppInput
                    label="Platform"
                    onChange={(event) => setPlatform(event.target.value)}
                    value={platform}
                  />
                  <AppInput
                    label="Size"
                    onChange={(event) => setSize(event.target.value)}
                    value={size}
                  />
                  <AppInput
                    label="Quality"
                    onChange={(event) => setQuality(event.target.value)}
                    value={quality}
                  />
                  <AppInput
                    label="Count"
                    min={1}
                    onChange={(event) =>
                      setCount(Math.max(1, Number(event.target.value) || 1))
                    }
                    type="number"
                    value={count}
                  />
                  <AppInput label="Seed" readOnly value="42817" />
                  <AppInput label="Style" readOnly value="Premium SaaS Commerce" />
                  <AppCard className="bg-blue-50 p-4" withShadow={false}>
                    <p className="text-sm leading-6 text-slate-600">
                      Selected: {selectedProject?.name || "No project"} /{" "}
                      {selectedProduct?.name || "No product"} /{" "}
                      {selectedMedia?.name || selectedMedia?.filename || "No media"}
                    </p>
                  </AppCard>
                </div>
              </AppCard>
            </section>

          <AppCard className="overflow-hidden">
            <div className="border-b border-blue-100 p-5">
              <AppToolbar
                title="Generate Queue"
                subtitle="Generation result appears after Generate."
              />
            </div>
            <div className="grid grid-cols-4 gap-4 p-5">
              {queueItems.map((item) => (
                <AppCard key={item.label} className="p-4" withShadow={false}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">{item.label}</p>
                    <AppBadge variant={item.variant}>{item.label}</AppBadge>
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {item.count}
                  </p>
                </AppCard>
              ))}
            </div>

            {generationResult ? (
              <div className="border-t border-blue-100 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Generation Result
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Task: {generationResult.taskId}
                    </p>
                  </div>
                  <AppBadge variant="success">{generationResult.status}</AppBadge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {generationResult.images.map((image) => (
                    <AppCard key={image.id} className="p-4" withShadow={false}>
                      <div
                        aria-label={image.prompt}
                        className="h-48 rounded-lg border border-blue-100 bg-blue-50 bg-cover bg-center"
                        role="img"
                        style={{ backgroundImage: `url(${image.url})` }}
                      />
                      <p className="mt-3 text-sm font-semibold text-slate-950">
                        {image.id}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{image.url}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                        {image.prompt}
                      </p>
                      <AppBadge className="mt-3">{image.model}</AppBadge>
                    </AppCard>
                  ))}
                </div>
              </div>
            ) : null}
          </AppCard>
        </div>
      </main>
    </AppShell>
  );
}
