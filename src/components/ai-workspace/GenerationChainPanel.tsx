"use client";

import { useEffect, useState } from "react";

import { AppBadge } from "@/components/ui";
import type { GenerationChainGroup } from "@/lib/ai-workspace/generation-chain-read-model";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type GenerationChainPanelProps = {
  generationGroupId?: string;
};

const RECENT_VERSION_LIMIT = 3;

function buildParentLabel(parentImageId: string | null) {
  return parentImageId ? `来自 ${parentImageId}` : "初始生成";
}

export function GenerationChainPanel({ generationGroupId }: GenerationChainPanelProps) {
  const [chain, setChain] = useState<GenerationChainGroup | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const visibleImages = chain?.images.slice(-RECENT_VERSION_LIMIT) ?? [];
  const hiddenImageCount = Math.max((chain?.images.length ?? 0) - visibleImages.length, 0);

  useEffect(() => {
    if (!generationGroupId) {
      return;
    }

    let isActive = true;
    const activeGenerationGroupId = generationGroupId;

    async function loadGenerationChain() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
          `/api/generation-chains?generationGroupId=${encodeURIComponent(activeGenerationGroupId)}`,
        );
        const payload = (await response.json()) as ApiResponse<GenerationChainGroup[]>;

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "版本链加载失败。");
        }

        if (isActive) {
          setChain(payload.data?.[0] ?? null);
        }
      } catch (requestError) {
        if (isActive) {
          setError(requestError instanceof Error ? requestError.message : "版本链加载失败。");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadGenerationChain();

    return () => {
      isActive = false;
    };
  }, [generationGroupId]);

  if (!generationGroupId) {
    return null;
  }

  return (
    <section className="mb-4 rounded-lg border border-blue-100 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">版本链</p>
          <p className="mt-1 text-xs text-slate-500">
            {chain?.images.length
              ? `共 ${chain.images.length} 个版本，当前仅显示最近 ${visibleImages.length} 条。`
              : "按生成组追踪初始生成和继续设计结果。"}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <a
            className="text-xs font-semibold text-blue-700 hover:text-blue-800"
            href="/history"
          >
            查看历史记录
          </a>
          <AppBadge>{generationGroupId}</AppBadge>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-slate-500">
          正在加载版本链...
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && hiddenImageCount > 0 ? (
        <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-slate-500">
          已隐藏较早的 {hiddenImageCount} 条版本，可在历史记录中查看完整版本链。
        </p>
      ) : null}

      {!isLoading && !error && visibleImages.length ? (
        <div className="mt-4 grid gap-2">
          {visibleImages.map((image) => (
            <div
              className="grid gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-slate-600 md:grid-cols-[88px_1fr_auto]"
              key={image.id}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-950">
                  {image.version || "未编号"}
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-blue-700">
                  {image.status}
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-700">
                  {buildParentLabel(image.parentImageId)}
                </p>
                {image.editIntent ? (
                  <p className="mt-1 line-clamp-2 text-slate-500">
                    修改要求：{image.editIntent}
                  </p>
                ) : (
                  <p className="mt-1 line-clamp-2 text-slate-500">
                    {image.prompt || "初始生成 Prompt"}
                  </p>
                )}
              </div>
              <a
                className="font-semibold text-blue-700 hover:text-blue-800"
                href={image.imageUrl}
                rel="noreferrer"
                target="_blank"
              >
                查看
              </a>
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && !error && !chain?.images.length ? (
        <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-slate-500">
          暂无可显示的版本链记录。
        </p>
      ) : null}
    </section>
  );
}
