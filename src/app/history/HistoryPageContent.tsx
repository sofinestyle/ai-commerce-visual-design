"use client";

import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import {
  AppBadge,
  AppButton,
  AppCard,
  AppSearchBar,
  AppToolbar,
  EmptyState,
  LoadingState,
  PageTitle,
} from "@/components/ui";
import type { GenerationChainGroup } from "@/lib/ai-workspace/generation-chain-read-model";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

function getGroupUpdatedAt(group: GenerationChainGroup) {
  return group.images[group.images.length - 1]?.updatedAt || "";
}

function getGroupMetadata(group: GenerationChainGroup) {
  return group.images[0]?.metadataSummary;
}

function formatTime(value: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatOptional(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function formatReferenceCount(value: number | null | undefined) {
  return value === null || value === undefined ? "参考图 -" : `参考图 ${value} 张`;
}

function formatPromptSource(value: string | null | undefined) {
  if (value === "llm") {
    return "AI 文案/Prompt";
  }

  if (value === "builder") {
    return "规则生成 Prompt";
  }

  return "Prompt 来源 -";
}

function formatQualityStatus(value: string | null | undefined) {
  if (value === "usable") {
    return "QA 可用";
  }

  if (value === "needs_review") {
    return "QA 需复核";
  }

  if (value === "not_recommended") {
    return "QA 不建议";
  }

  return "QA -";
}

function formatConsistencyStatus(status: GenerationChainGroup["consistency"]["status"]) {
  if (status === "consistent") {
    return "链路一致";
  }

  if (status === "needs_review") {
    return "需复核";
  }

  return "链路断裂";
}

function matchesSearch(group: GenerationChainGroup, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [
    group.generationGroupId,
    group.consistency.status,
    group.consistency.summary,
    ...group.images.flatMap((image) => [
      image.editIntent,
      image.id,
      image.imageFileStatus,
      image.metadataSummary.actualImageModel ?? "",
      image.metadataSummary.imageType ?? "",
      image.metadataSummary.platform ?? "",
      image.metadataSummary.promptActualModel ?? "",
      image.metadataSummary.promptRequestedModel ?? "",
      image.metadataSummary.promptSource ?? "",
      image.metadataSummary.qualityStatus ?? "",
      image.metadataSummary.requestedImageModel ?? "",
      image.metadataSummary.sku ?? "",
      image.metadataSummary.theme ?? "",
      image.metadataSummary.visualRuleId ?? "",
      image.parentImageId ?? "",
      image.prompt,
      image.status,
      image.version,
    ]),
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
}

function HistoryImageThumbnail({
  image,
}: {
  image: GenerationChainGroup["images"][number];
}) {
  const [loadFailed, setLoadFailed] = useState(false);
  const isMissing = image.imageFileStatus === "missing" || loadFailed;

  if (isMissing) {
    return (
      <div className="flex aspect-square w-24 items-center justify-center rounded-md border border-amber-200 bg-amber-50 px-2 text-center text-xs font-semibold leading-5 text-amber-700">
        文件缺失
      </div>
    );
  }

  return (
    <a href={image.imageUrl} rel="noreferrer" target="_blank">
      {/* eslint-disable-next-line @next/next/no-img-element -- History thumbnails can be generated media URLs. */}
      <img
        alt={image.version || image.id}
        className="aspect-square w-24 rounded-md border border-blue-100 bg-white object-cover"
        onError={() => setLoadFailed(true)}
        src={image.imageUrl}
      />
    </a>
  );
}

export function HistoryPageContent() {
  const [chains, setChains] = useState<GenerationChainGroup[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  async function loadChains() {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/generation-chains");
      const payload = (await response.json()) as ApiResponse<GenerationChainGroup[]>;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "生成历史加载失败。");
      }

      setChains(payload.data ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "生成历史加载失败。");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadChains();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const filteredChains = useMemo(
    () => chains.filter((group) => matchesSearch(group, searchTerm)),
    [chains, searchTerm],
  );

  return (
    <AppShell>
      <main className="min-w-0 flex-1 overflow-auto bg-white p-6 text-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <PageTitle
            title="生成历史"
            subtitle="按生成组查看 AI 图片版本、继续设计父子关系和保存状态。"
          />

          <AppToolbar
            title="版本链记录"
            subtitle="当前读取现有 Media 数据，不依赖旧 GenerationHistory 表。"
            actions={
              <div className="flex items-center gap-2">
                <AppSearchBar
                  className="w-80"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="搜索生成组、版本、Prompt、修改要求"
                  value={searchTerm}
                />
                <AppButton onClick={() => void loadChains()} size="sm" variant="secondary">
                  刷新
                </AppButton>
              </div>
            }
          />

          {isLoading ? <LoadingState /> : null}

          {!isLoading && error ? (
            <AppCard className="border-red-100 bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-700">生成历史加载失败</p>
              <p className="mt-2 text-sm text-red-600">{error}</p>
            </AppCard>
          ) : null}

          {!isLoading && !error && filteredChains.length === 0 ? (
            <AppCard className="p-6">
              <EmptyState
                title={searchTerm ? "没有匹配的生成历史" : "暂无生成历史"}
                description="完成一次图片生成后，版本链会在这里显示。"
              />
            </AppCard>
          ) : null}

          {!isLoading && !error && filteredChains.length > 0 ? (
            <section className="grid gap-4">
              {filteredChains.map((group) => (
                <AppCard className="p-5" key={group.generationGroupId}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-slate-950">
                          {group.generationGroupId}
                        </h2>
                        <AppBadge>{group.images.length} 个版本</AppBadge>
                        <AppBadge>
                          {formatConsistencyStatus(group.consistency.status)} {group.consistency.score}
                          分
                        </AppBadge>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        最近更新：{formatTime(getGroupUpdatedAt(group))}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        {(() => {
                          const metadata = getGroupMetadata(group);

                          return [
                            `SKU ${formatOptional(metadata?.sku)}`,
                            formatOptional(metadata?.platform),
                            formatOptional(metadata?.imageType),
                            formatOptional(metadata?.theme),
                            `模型 ${formatOptional(
                              metadata?.actualImageModel || metadata?.requestedImageModel,
                            )}`,
                            formatReferenceCount(metadata?.referenceImageCount),
                          ].map((label, index) => (
                            <span
                              className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 font-medium"
                              key={`${label}-${index}`}
                            >
                              {label}
                            </span>
                          ));
                        })()}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 lg:text-right">
                      <p>初始图 {group.rootImages.length} 张</p>
                      <p className="mt-1">{group.consistency.summary}</p>
                      {group.consistency.issues[0] ? (
                        <p className="mt-1 text-amber-700">
                          {group.consistency.issues[0].message}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {group.images.map((image) => (
                      <div
                        className="grid gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 md:grid-cols-[96px_96px_minmax(0,1fr)_auto]"
                        key={image.id}
                      >
                        <div>
                          <p className="text-xs text-slate-500">版本</p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">
                            {image.version || "未编号"}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-blue-700">
                            {image.status}
                          </p>
                        </div>
                        <HistoryImageThumbnail image={image} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {image.parentImageId
                              ? `继续设计自 ${image.parentImageId}`
                              : "初始生成"}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                            {image.editIntent || image.prompt || "未记录 Prompt"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatTime(image.createdAt)}
                          </p>
                          {image.imageFileStatus === "missing" ? (
                            <p className="mt-1 text-xs font-semibold text-amber-700">
                              本地图片文件缺失：{image.imageFileCheckedPath || image.imageUrl}
                            </p>
                          ) : null}
                          <div className="mt-3 grid gap-1 text-xs text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
                            <span>
                              平台：{formatOptional(image.metadataSummary.platform)}
                            </span>
                            <span>
                              类型：{formatOptional(image.metadataSummary.imageType)}
                            </span>
                            <span>
                              生图：{formatOptional(
                                image.metadataSummary.actualImageModel ||
                                  image.metadataSummary.requestedImageModel,
                              )}
                            </span>
                            <span>
                              文字：{formatOptional(
                                image.metadataSummary.promptActualModel ||
                                  image.metadataSummary.promptRequestedModel,
                              )}
                            </span>
                            <span>
                              {formatReferenceCount(image.metadataSummary.referenceImageCount)}
                            </span>
                            <span>{formatPromptSource(image.metadataSummary.promptSource)}</span>
                            <span>
                              {formatQualityStatus(image.metadataSummary.qualityStatus)}
                              {image.metadataSummary.qualityScore === null
                                ? ""
                                : ` ${image.metadataSummary.qualityScore}分`}
                            </span>
                            <span>
                              规则：{formatOptional(image.metadataSummary.visualRuleId)}
                            </span>
                          </div>
                        </div>
                        {image.imageFileStatus === "missing" ? (
                          <span className="self-start text-sm font-semibold text-amber-700">
                            文件缺失
                          </span>
                        ) : (
                          <a
                            className="self-start text-sm font-semibold text-blue-700 hover:text-blue-800"
                            href={image.imageUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            查看图片
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </AppCard>
              ))}
            </section>
          ) : null}
        </div>
      </main>
    </AppShell>
  );
}
