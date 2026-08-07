"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

type AIWorkspaceCardProps = {
  dailyNote: string;
  displayName: string;
  previewImageUrl?: string | null;
};

const aiStatus = {
  status: "processing",
  subText: "预计完成：3-6秒",
  text: "AI正在优化商品视觉层级...",
} as const;

export function AIWorkspaceCard({
  dailyNote,
  displayName,
  previewImageUrl,
}: AIWorkspaceCardProps) {
  const [status, setStatus] = useState<"processing" | "idle">(aiStatus.status);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStatus("idle");
    }, 3600);

    return () => window.clearTimeout(timer);
  }, []);

  const isProcessing = status === "processing";

  return (
    <div className="h-full min-h-[420px] overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm shadow-blue-100/60">
      <div className="relative h-full p-5 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_14%,rgba(139,92,246,0.15),transparent_28%),radial-gradient(circle_at_18%_82%,rgba(37,99,235,0.12),transparent_34%),linear-gradient(135deg,rgba(239,246,255,0.88),rgba(255,255,255,0.48)_46%,rgba(238,242,255,0.72))]" />
        <div className="absolute inset-0 opacity-55 [background-image:linear-gradient(135deg,rgba(37,99,235,0.08)_0,rgba(37,99,235,0.08)_1px,transparent_1px,transparent_16px)]" />

        <div className="relative flex h-full flex-col justify-between gap-4">
          <div className="relative z-20">
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
              您好，{displayName}
            </h1>
            <p className="mt-3 whitespace-nowrap text-sm font-semibold leading-6 text-blue-700">
              {dailyNote}
            </p>
          </div>

          <div className="relative flex min-h-0 flex-1 items-end">
            {isProcessing ? (
              <div className="ai-status-float absolute right-0 top-0 z-30 w-[210px] rounded-xl border border-white/80 bg-[rgba(255,255,255,0.7)] px-4 py-3 text-slate-900 shadow-[0_18px_38px_rgba(37,99,235,0.18)] backdrop-blur-[10px]">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="ai-status-dot h-2.5 w-2.5 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 shadow-[0_0_14px_rgba(79,70,229,0.45)]" />
                  <span>AI正在工作中</span>
                </div>
                <p className="mt-1.5 text-xs font-medium text-blue-700">
                  {aiStatus.text.replace(/^AI正在/, "正在")}
                </p>
                <p className="mt-1 text-xs text-slate-500">{aiStatus.subText}</p>
              </div>
            ) : null}

            <div className="mx-auto grid w-full max-w-[400px] grid-cols-[48px_minmax(0,1fr)_96px] items-end gap-3 pb-1 pt-6">
              <div className="flex h-28 flex-col items-center justify-around rounded-2xl border border-white/80 bg-white/62 py-2 shadow-[0_16px_30px_rgba(37,99,235,0.08)] backdrop-blur-md">
                {["↖", "T", "□", "◇", "⌗"].map((tool) => (
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-sm font-semibold text-blue-500"
                    key={tool}
                  >
                    {tool}
                  </span>
                ))}
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/76 p-3 shadow-[0_22px_48px_rgba(37,99,235,0.16)] backdrop-blur-md">
                <div className="mb-3 flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-300" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-white ring-1 ring-blue-100">
                  {previewImageUrl ? (
                    <Image
                      alt="最近素材预览"
                      className="object-cover"
                      fill
                      priority
                      sizes="(min-width: 1280px) 220px, 30vw"
                      src={previewImageUrl}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-blue-50">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-600 shadow-sm">
                        素材预览
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="hidden rounded-2xl border border-white/80 bg-white/72 p-3 shadow-[0_18px_34px_rgba(37,99,235,0.1)] backdrop-blur-md sm:block">
                <p className="text-sm font-semibold text-slate-700">SKU-001</p>
                <div className="mt-3 space-y-2">
                  <span className="block h-3 rounded-full bg-slate-200" />
                  <span className="block h-3 w-4/5 rounded-full bg-slate-100" />
                  <span className="block h-3 w-3/5 rounded-full bg-slate-100" />
                </div>
                <div className="mt-4 flex gap-2">
                  {["bg-blue-200", "bg-orange-300", "bg-amber-500", "bg-slate-500"].map(
                    (color) => (
                      <span className={`h-4 w-4 rounded-full ${color}`} key={color} />
                    ),
                  )}
                </div>
                <div className="mt-4 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-blue-50" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-colors hover:bg-blue-700"
              href="/design"
            >
              开始图片设计
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-lg border border-blue-200 bg-white/86 px-5 text-sm font-semibold text-blue-700 shadow-sm shadow-blue-100/70 backdrop-blur-sm transition-colors hover:bg-blue-50"
              href="/media/import"
            >
              导入本地素材
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes ai-status-pulse {
          0%,
          100% {
            opacity: 0.42;
            transform: scale(0.82);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes ai-status-fade-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes ai-status-float {
          0%,
          100% {
            translate: 0 0;
          }
          50% {
            translate: 0 -2px;
          }
        }

        .ai-status-dot {
          animation: ai-status-pulse 1.2s ease-in-out infinite;
        }

        .ai-status-fade {
          animation: ai-status-fade-in 420ms ease-out both;
        }

        .ai-status-float {
          animation:
            ai-status-fade-in 420ms ease-out both,
            ai-status-float 2.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
