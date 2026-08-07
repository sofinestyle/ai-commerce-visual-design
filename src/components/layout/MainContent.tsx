import { readdir } from "fs/promises";
import Image from "next/image";
import Link from "next/link";
import path from "path";

import { AIWorkspaceCard } from "@/components/layout/AIWorkspaceCard";
import { getCurrentUserFromCookies } from "@/lib/auth/requestAuth";
import { getDashboardMediaPreviewState } from "@/lib/dashboardMediaPreview";
import { prisma } from "@/lib/prisma";

const numberFormatter = new Intl.NumberFormat("zh-CN");
const rawExtensions = new Set([".arw", ".raw", ".tif", ".tiff"]);

const workflowEntries = [
  {
    description: "选择 SKU、参考图和平台规则，生成可发布的商品视觉。",
    href: "/design",
    label: "开始",
    title: "图片设计",
    type: "design",
  },
  {
    description: "维护产品名称、品牌、类目和核心事实，保证生成准确。",
    href: "/products",
    label: "管理",
    title: "产品管理",
    type: "products",
  },
  {
    description: "整理拍摄图、参考图、品牌素材和 AI 生成图。",
    href: "/media",
    label: "查看",
    title: "媒体资产",
    type: "media",
  },
  {
    description: "转换 RAW / TIFF 原图，准备可用于设计的产品素材。",
    href: "/material-convert",
    label: "处理",
    title: "素材处理",
    type: "material",
  },
] as const;

const dailyNotes = [
  "把复杂的素材整理清楚，灵感就更容易出现。",
  "先让流程顺起来，漂亮的结果会跟着到来。",
  "每一次确认分类，都是在为下一张好图铺路。",
  "稳定的素材库，是高质量生成的底气。",
  "今天多理顺一点，明天就少返工一点。",
  "好设计不只靠灵感，也靠清楚的规则。",
  "把产品事实写准确，AI 才能更懂你的商品。",
  "小步优化，长期会变成很大的效率。",
  "素材越清晰，创意越自由。",
  "先建立秩序，再释放想象。",
  "每一张好图，都从一次认真选择开始。",
  "让规则替你守住标准，让创意负责发光。",
  "今天的整理，是明天批量生成的速度。",
  "产品信息越扎实，视觉表达越稳定。",
  "不用急，清楚比快更接近好结果。",
  "把参考图选准，生成就成功了一半。",
  "好的工作台，应该让判断变轻松。",
  "让素材回到正确的位置，设计自然会变顺。",
  "每一次保存，都是资产沉淀。",
  "清晰的分类，是视觉系统的第一层美感。",
  "让重复工作变少，让判断时间变多。",
  "好的视觉不是碰运气，是把条件准备好。",
  "今天先解决一个小卡点，系统就更顺一点。",
  "规则不是限制，是稳定出图的轨道。",
  "把 SKU 事实维护好，就是在保护品牌表达。",
  "漂亮的图，常常来自朴素而准确的准备。",
  "少一点混乱，多一点确定。",
  "先把素材看清楚，再让模型去创造。",
  "每个细节归位，整体效率就会抬升。",
  "好流程会让好想法更容易落地。",
  "让数据和素材说清楚，设计就不必猜。",
  "稳稳推进，也是一种速度。",
  "今天的清单越清楚，明天的生成越从容。",
  "让系统承担记忆，让你专注判断。",
  "好资产会复用，好规则会放大价值。",
  "不追求一步到位，先让下一步更明确。",
  "把可发布作为目标，把每一步做实。",
  "清楚的命名，会在关键时候帮你省时间。",
  "素材库越干净，选择就越轻松。",
  "每一次优化，都会让下一次更接近标准。",
  "先把基础打稳，再谈风格变化。",
  "好的生成链路，会让创意更可靠。",
  "把今天的素材整理好，就是给未来留余地。",
  "让平台规则成为你的第二双眼睛。",
  "越是批量工作，越需要清楚的入口。",
  "好设计需要审美，也需要可追溯。",
  "把不确定变成可选择，工作就轻了。",
  "每张图都有来源，每次生成都有依据。",
  "让流程安静下来，结果会更有质感。",
  "今天也做一点让系统更好用的事。",
] as const;

function getDailyNote(seed: string) {
  const todayKey = new Date().toLocaleDateString("zh-CN", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric",
  });
  const source = `${todayKey}:${seed}`;
  const index = Array.from(source).reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  ) % dailyNotes.length;

  return dailyNotes[index];
}

async function countRawFiles(directory: string): Promise<number> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const counts = await Promise.all(
      entries.map(async (entry) => {
        const nextPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          return countRawFiles(nextPath);
        }

        if (!entry.isFile() || entry.name.startsWith(".")) {
          return 0;
        }

        const isOriginalFolder = path.basename(path.dirname(nextPath)) === "原图";
        const isRaw = rawExtensions.has(path.extname(entry.name).toLowerCase());

        if (!isOriginalFolder || !isRaw) {
          return 0;
        }

        const originalStem = path.basename(entry.name, path.extname(entry.name));
        const convertedDirectory = path.join(path.dirname(path.dirname(nextPath)), "转换图");
        const hasConvertedOutput = await readdir(convertedDirectory)
          .then((filenames) =>
            filenames.some((filename) => {
              const extension = path.extname(filename).toLowerCase();
              const convertedStem = path.basename(filename, extension);

              return (
                [".jpg", ".jpeg", ".png", ".webp"].includes(extension) &&
                (convertedStem === originalStem ||
                  /^\d+$/.test(convertedStem.slice(originalStem.length + 1)) &&
                    convertedStem.startsWith(`${originalStem}-`))
              );
            }),
          )
          .catch(() => false);

        return hasConvertedOutput ? 0 : 1;
      }),
    );

    return counts.reduce((sum, count) => sum + count, 0);
  } catch {
    return 0;
  }
}

async function getTodayStart() {
  const now = new Date();
  const chinaTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }),
  );

  chinaTime.setHours(0, 0, 0, 0);

  return chinaTime;
}

async function getWorkspaceStats() {
  const todayStart = await getTodayStart();
  const [
    finalAssetCount,
    skuAssetCount,
    brandAssetCount,
    productPhotoCount,
    aiGeneratedCount,
    todayFinalAssetCount,
    todaySkuAssetCount,
    todayBrandAssetCount,
    todayProductPhotoCount,
    todayAiGeneratedCount,
  ] = await Promise.all([
    prisma.media.count({
      where: {
        deletedAt: null,
        status: "final",
      },
    }),
    prisma.product.count({
      where: {
        deletedAt: null,
      },
    }),
    prisma.media.count({
      where: {
        deletedAt: null,
        source: "brand_asset",
      },
    }),
    prisma.media.count({
      where: {
        deletedAt: null,
        source: "product_photography",
      },
    }),
    prisma.media.count({
      where: {
        deletedAt: null,
        OR: [{ source: "AI" }, { imageType: "ai_generated" }],
      },
    }),
    prisma.media.count({
      where: {
        createdAt: { gte: todayStart },
        deletedAt: null,
        status: "final",
      },
    }),
    prisma.product.count({
      where: {
        createdAt: { gte: todayStart },
        deletedAt: null,
      },
    }),
    prisma.media.count({
      where: {
        createdAt: { gte: todayStart },
        deletedAt: null,
        source: "brand_asset",
      },
    }),
    prisma.media.count({
      where: {
        createdAt: { gte: todayStart },
        deletedAt: null,
        source: "product_photography",
      },
    }),
    prisma.media.count({
      where: {
        createdAt: { gte: todayStart },
        deletedAt: null,
        OR: [{ source: "AI" }, { imageType: "ai_generated" }],
      },
    }),
  ]);

  return [
    {
      accent: "blue",
      description: "可发布素材库",
      href: "/media",
      icon: "ZC",
      label: "正式资产",
      today: todayFinalAssetCount,
      value: finalAssetCount,
    },
    {
      accent: "violet",
      description: "产品 SKU 管理",
      href: "/products",
      icon: "SKU",
      label: "SKU资产",
      today: todaySkuAssetCount,
      value: skuAssetCount,
    },
    {
      accent: "emerald",
      description: "品牌视觉资产",
      href: "/media",
      icon: "PP",
      label: "品牌资产",
      today: todayBrandAssetCount,
      value: brandAssetCount,
    },
    {
      accent: "orange",
      description: "实拍素材图库",
      href: "/media",
      icon: "PT",
      label: "产品拍摄图",
      today: todayProductPhotoCount,
      value: productPhotoCount,
    },
    {
      accent: "sky",
      description: "AI 生成素材",
      href: "/media",
      icon: "AI",
      label: "AI生成图",
      today: todayAiGeneratedCount,
      value: aiGeneratedCount,
    },
  ] as const;
}

async function getDashboardWorkItems() {
  const [pendingRawCount, pendingDraftCount, latestMedia] = await Promise.all([
    countRawFiles(path.join(process.cwd(), "public", "media")),
    prisma.media.count({
      where: {
        deletedAt: null,
        status: "draft",
      },
    }),
    prisma.media.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        filename: true,
        id: true,
        name: true,
        previewImage: true,
        storagePath: true,
        thumbnail: true,
        type: true,
      },
      take: 4,
      where: {
        deletedAt: null,
      },
    }),
  ]);

  const latestMediaWithPreview = await Promise.all(
    latestMedia.map(async (item) => ({
      ...item,
      previewState: await getDashboardMediaPreviewState(item),
    })),
  );

  return {
    latestMedia: latestMediaWithPreview,
    pendingDraftCount,
    pendingRawCount,
  };
}

function metricAccentClasses(accent: string) {
  const classes: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    sky: "bg-sky-50 text-sky-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return classes[accent] || classes.blue;
}

function WorkflowVisual({ type }: { type: (typeof workflowEntries)[number]["type"] }) {
  if (type === "design") {
    return (
      <div className="relative h-36 overflow-hidden rounded-lg bg-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(37,99,235,0.24),transparent_48%),radial-gradient(circle_at_82%_18%,rgba(250,204,21,0.25),transparent_28%)]" />
        <div className="absolute left-6 top-6 h-8 w-32 rounded bg-white/90" />
        <div className="absolute left-6 top-[4.5rem] h-2 w-20 rounded bg-white/45" />
        <div className="absolute bottom-5 left-6 h-14 w-16 rounded-t-full bg-amber-500 shadow-lg shadow-amber-950/30" />
        <div className="absolute bottom-5 left-16 h-24 w-5 rounded-full bg-amber-700" />
        <div className="absolute bottom-5 right-7 h-24 w-12 rounded-full bg-slate-800 ring-1 ring-white/15" />
        <div className="absolute bottom-5 left-4 right-4 h-px bg-white/30" />
      </div>
    );
  }

  if (type === "products") {
    return (
      <div className="relative h-36 overflow-hidden rounded-lg bg-white ring-1 ring-slate-200">
        <div className="absolute inset-x-0 top-0 h-11 bg-slate-100" />
        <div className="absolute left-5 top-5 h-4 w-28 rounded bg-slate-900" />
        <div className="absolute left-5 top-[4.25rem] grid w-[calc(100%-40px)] grid-cols-2 gap-3">
          <div className="h-8 rounded bg-blue-50 ring-1 ring-blue-100" />
          <div className="h-8 rounded bg-slate-50 ring-1 ring-slate-200" />
          <div className="h-8 rounded bg-slate-50 ring-1 ring-slate-200" />
          <div className="h-8 rounded bg-emerald-50 ring-1 ring-emerald-100" />
        </div>
        <div className="absolute bottom-5 left-5 h-2 w-40 rounded bg-slate-200" />
      </div>
    );
  }

  if (type === "media") {
    return (
      <div className="relative h-36 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
        <div className="absolute left-5 top-5 h-24 w-20 rounded bg-white shadow-sm ring-1 ring-slate-200" />
        <div className="absolute left-9 top-11 h-10 w-10 rounded-full bg-blue-100" />
        <div className="absolute bottom-9 left-10 h-3 w-10 rounded bg-blue-500/80" />
        <div className="absolute left-[7.5rem] top-5 h-24 w-20 rounded bg-white shadow-sm ring-1 ring-slate-200" />
        <div className="absolute left-36 top-11 h-12 w-12 rounded bg-amber-200" />
        <div className="absolute bottom-9 left-[8.75rem] h-3 w-12 rounded bg-amber-600/80" />
        <div className="absolute right-5 top-5 h-24 w-20 rounded bg-white shadow-sm ring-1 ring-slate-200" />
        <div className="absolute right-9 top-12 h-12 w-12 rounded bg-emerald-100" />
        <div className="absolute bottom-9 right-10 h-3 w-10 rounded bg-emerald-500/80" />
      </div>
    );
  }

  return (
    <div className="relative h-36 overflow-hidden rounded-lg bg-zinc-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.2),transparent_30%),linear-gradient(135deg,transparent,rgba(59,130,246,0.2))]" />
      <div className="absolute left-5 top-5 flex h-24 w-24 items-center justify-center rounded bg-white/10 ring-1 ring-white/15">
        <span className="text-xl font-semibold text-white">RAW</span>
      </div>
      <div className="absolute left-[8.5rem] top-16 h-px w-20 bg-white/40" />
      <div className="absolute left-[13rem] top-10 flex h-14 w-20 items-center justify-center rounded bg-white text-sm font-semibold text-zinc-950">
        JPG
      </div>
      <div className="absolute bottom-6 right-5 h-2 w-28 rounded bg-white/30" />
    </div>
  );
}

export async function MainContent() {
  const [workspaceStats, workItems, currentUser] = await Promise.all([
    getWorkspaceStats(),
    getDashboardWorkItems(),
    getCurrentUserFromCookies(),
  ]);
  const displayName = currentUser?.displayName || currentUser?.username || "admin";
  const dailyNote = getDailyNote(displayName);
  const workspacePreviewImageUrl =
    workItems.latestMedia.find((item) => item.previewState.status === "available")
      ?.previewState.url ?? null;

  return (
    <main className="min-w-0 flex-1 overflow-auto bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 p-6">
        <section className="grid gap-4 lg:grid-cols-5">
          {workspaceStats.map((item) => (
            <div
              className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/60"
              key={item.label}
            >
              <div className="flex items-start gap-4">
                <span
                  className={[
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                    metricAccentClasses(item.accent),
                  ].join(" ")}
                >
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                  <p className="mt-1 text-3xl font-semibold leading-none text-blue-600">
                    {numberFormatter.format(item.value)}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">{item.description}</p>
                  <p className="mt-2 text-xs font-semibold text-emerald-600">
                    今日新增 +{numberFormatter.format(item.today)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="grid min-h-[242px] items-stretch gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.8fr)_minmax(320px,0.8fr)]">
          <AIWorkspaceCard
            dailyNote={dailyNote}
            displayName={displayName}
            previewImageUrl={workspacePreviewImageUrl}
          />

          <div className="flex flex-col rounded-lg border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/60">
            <h2 className="text-base font-semibold text-slate-950">今日视觉工作</h2>
            <div className="mt-5 divide-y divide-blue-50">
              <Link
                className="flex items-center justify-between gap-4 py-3 text-sm transition-colors hover:text-blue-600"
                href="/material-convert"
              >
                <span className="font-medium text-slate-700">待处理 RAW</span>
                <span className="font-semibold text-slate-950">
                  {numberFormatter.format(workItems.pendingRawCount)}
                </span>
              </Link>
              <Link
                className="flex items-center justify-between gap-4 py-3 text-sm transition-colors hover:text-blue-600"
                href="/media"
              >
                <span className="font-medium text-slate-700">待确认草稿</span>
                <span className="font-semibold text-slate-950">
                  {numberFormatter.format(workItems.pendingDraftCount)}
                </span>
              </Link>
              <div className="py-3">
                <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-slate-700">最近记录</span>
                  <Link className="font-semibold text-blue-600 hover:text-blue-700" href="/history">
                    查看
                  </Link>
                </div>
                <div className="space-y-1">
                  {workItems.latestMedia.length > 0 ? (
                    workItems.latestMedia.map((item) => (
                      <Link
                        className="flex h-12 items-center gap-3 rounded-md bg-slate-50 px-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-blue-50 hover:text-blue-700"
                        href="/history"
                        key={item.id}
                      >
                        <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-md bg-white ring-1 ring-blue-100">
                          {item.previewState.status === "missing" ? (
                            <span className="flex h-full w-full items-center justify-center bg-amber-50 px-1 text-center text-[10px] font-semibold leading-3 text-amber-700">
                              文件缺失
                            </span>
                          ) : (
                            <Image
                              alt={item.name}
                              className="object-cover"
                              fill
                              sizes="36px"
                              src={item.previewState.url}
                            />
                          )}
                        </span>
                        <span className="min-w-0 truncate">{item.filename}</span>
                      </Link>
                    ))
                  ) : (
                    <p className="rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">
                      暂无记录
                    </p>
                  )}
                </div>
              </div>
            </div>
            <Link
              className="mt-auto translate-y-[3px] inline-flex h-10 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-colors hover:bg-blue-700"
              href="/history"
            >
              查看历史记录
            </Link>
          </div>

          <div className="flex flex-col rounded-lg border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/60">
            <h2 className="text-base font-semibold text-slate-950">品牌资产中心</h2>
            <div className="mt-4 space-y-3">
              <div className="flex h-[76px] items-center justify-center rounded-lg bg-white">
                <Image
                  alt="YorRay"
                  className="h-auto w-44 object-contain"
                  height={188}
                  src="/brand/yorray-logo.png"
                  width={520}
                />
              </div>
              <div className="flex h-[76px] items-center justify-center rounded-lg bg-white">
                <Image
                  alt="Sylvata"
                  className="h-auto w-48 object-contain"
                  height={196}
                  src="/brand/sylvata-logo-brown.png"
                  width={520}
                />
              </div>
            </div>
            <Link
              className="mt-auto translate-y-[3px] inline-flex h-10 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-colors hover:bg-blue-700"
              href="/media/brand"
            >
              管理品牌资产
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workflowEntries.map((entry) => (
            <Link
              className="group overflow-hidden rounded-lg border border-blue-100 bg-white p-4 shadow-sm shadow-blue-100/60 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md hover:shadow-blue-100"
              href={entry.href}
              key={entry.title}
            >
              <WorkflowVisual type={entry.type} />
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">{entry.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{entry.description}</p>
                </div>
                <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 ring-1 ring-blue-100 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  {entry.label}
                </span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
