"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";

import { AppBadge, AppButton } from "@/components/ui";

import {
  type ImportedMediaUsageType,
  isBrandUsageType,
  translateUsageType,
  usageTypeOptions,
} from "./mediaAssetUtils";

export type ImportedMediaStatus = "duplicate" | "pending" | "ready" | "error";
export type ClassificationStatus = "unclassified" | "classifying" | "classified" | "failed";
export type ClassificationSource = "manual" | "unknown" | "vision";
export type ReviewStatus = "pending" | "reviewed";
export type ImportReviewFilter = "all" | "unreviewed" | "lowConfidence";

export type ImportedMediaCandidate = {
  id: string;
  file?: File;
  fileSize: number;
  filename: string;
  mimeType: string;
  relativePath: string;
  sourceInStandardSkuFolder: boolean;
  storageFolder: string;
  contentHash: string;
  category: string;
  sku: string;
  previewUrl: string;
  usageType: ImportedMediaUsageType;
  suggestedUsageType: ImportedMediaUsageType;
  confidence: number;
  classificationReason: string;
  classificationSource: ClassificationSource;
  classificationStatus: ClassificationStatus;
  qualityDimensions: {
    aiReferenceValue: number;
    backgroundCleanliness: number;
    lightingColor: number;
    sharpness: number;
    subjectCompleteness: number;
  } | null;
  qualityFlags: string[];
  qualityScore: number | null;
  qualityScoreReason: string;
  reviewStatus: ReviewStatus;
  status: ImportedMediaStatus;
  error?: string;
};

export function canUseImportCandidate(candidate: ImportedMediaCandidate) {
  return candidate.status !== "error" && candidate.status !== "duplicate";
}

function isPdfCandidate(candidate: ImportedMediaCandidate) {
  return (
    candidate.mimeType === "application/pdf" ||
    candidate.file?.type === "application/pdf" ||
    candidate.filename.toLowerCase().endsWith(".pdf")
  );
}

function getClassificationStatusLabel(candidate: ImportedMediaCandidate) {
  if (candidate.status === "error") {
    return "错误";
  }

  if (candidate.status === "duplicate") {
    return "已导入";
  }

  if (candidate.classificationStatus === "classifying") {
    return "识别中";
  }

  if (candidate.classificationStatus === "failed") {
    return "识别失败";
  }

  if (candidate.classificationStatus === "classified") {
    return candidate.confidence < lowConfidenceThreshold ? "低置信度" : "已识别";
  }

  return "待识别";
}

function getReviewStatusLabel(status: ReviewStatus) {
  return status === "reviewed" ? "已确认" : "待确认";
}

export const lowConfidenceThreshold = 0.7;
const importPageSize = 12;

export function MediaImportReviewPanel({
  batchUsageType,
  canConfirmImport,
  importCandidatesCount,
  importCompletedCount,
  importDuplicateCount,
  importErrorCount,
  importGroups,
  importReviewFilter,
  importSkuCount,
  isClassifying,
  lowConfidenceCount,
  onApplyBatchUsageType,
  onMarkBatchReviewed,
  onMarkCandidateReviewed,
  onSetAllVisibleImportSelection,
  onSetBatchUsageType,
  onSetImportReviewFilter,
  onToggleGroupSelection,
  onToggleImportSelection,
  onUpdateImportUsageType,
  readySelectedImportCandidatesCount,
  selectedImportCandidatesCount,
  selectedImportIds,
  selectedImportNeedsReview,
}: {
  batchUsageType: ImportedMediaUsageType;
  canConfirmImport: boolean;
  importCandidatesCount: number;
  importCompletedCount: number;
  importDuplicateCount: number;
  importErrorCount: number;
  importGroups: Array<{ id: string; items: ImportedMediaCandidate[] }>;
  importReviewFilter: ImportReviewFilter;
  importSkuCount: number;
  isClassifying: boolean;
  lowConfidenceCount: number;
  onApplyBatchUsageType: () => void;
  onMarkBatchReviewed: () => void;
  onMarkCandidateReviewed: (id: string) => void;
  onSetAllVisibleImportSelection: (checked: boolean, candidateIds?: string[]) => void;
  onSetBatchUsageType: (usageType: ImportedMediaUsageType) => void;
  onSetImportReviewFilter: (filter: ImportReviewFilter) => void;
  onToggleGroupSelection: (items: ImportedMediaCandidate[]) => void;
  onToggleImportSelection: (id: string) => void;
  onUpdateImportUsageType: (id: string, usageType: ImportedMediaUsageType) => void;
  readySelectedImportCandidatesCount: number;
  selectedImportCandidatesCount: number;
  selectedImportIds: string[];
  selectedImportNeedsReview: boolean;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const allVisibleCandidates = importGroups.flatMap((group) => group.items);
  const pageCount = Math.max(1, Math.ceil(allVisibleCandidates.length / importPageSize));
  const activePage = Math.min(currentPage, pageCount);
  const pageCandidateIds = useMemo(
    () =>
      new Set(
        allVisibleCandidates
          .slice((activePage - 1) * importPageSize, activePage * importPageSize)
          .map((candidate) => candidate.id),
      ),
    [activePage, allVisibleCandidates],
  );
  const pageGroups = useMemo(
    () =>
      importGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((candidate) => pageCandidateIds.has(candidate.id)),
        }))
        .filter((group) => group.items.length > 0),
    [importGroups, pageCandidateIds],
  );
  const allVisibleSelectableCandidates = pageGroups
    .flatMap((group) => group.items)
    .filter(canUseImportCandidate);
  const areAllVisibleSelected =
    allVisibleSelectableCandidates.length > 0 &&
    allVisibleSelectableCandidates.every((candidate) => selectedImportIds.includes(candidate.id));
  const hasBatchTargets = selectedImportCandidatesCount > 0;

  function areAllGroupItemsSelected(items: ImportedMediaCandidate[]) {
    const selectableIds = items.filter(canUseImportCandidate).map((candidate) => candidate.id);

    return (
      selectableIds.length > 0 &&
      selectableIds.every((candidateId) => selectedImportIds.includes(candidateId))
    );
  }

  return (
    <div className="mt-5 space-y-5">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-lg border border-blue-100 bg-white p-3">
          <p className="text-xs text-slate-500">SKU/品牌数量</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {importSkuCount}
          </p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-white p-3">
          <p className="text-xs text-slate-500">文件总数</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {importCandidatesCount}
          </p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-white p-3">
          <p className="text-xs text-slate-500">错误文件</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {importErrorCount}
          </p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-white p-3">
          <p className="text-xs text-slate-500">已完成</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {importCompletedCount + importDuplicateCount}
          </p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-white p-3">
          <p className="text-xs text-slate-500">低置信度</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {lowConfidenceCount}
          </p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-white p-3">
          <p className="text-xs text-slate-500">状态</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {isClassifying
              ? `AI识别中：${readySelectedImportCandidatesCount}/${selectedImportCandidatesCount}`
              : selectedImportCandidatesCount === 0
                ? "请选择图片"
                : selectedImportNeedsReview
                  ? "待确认"
                  : canConfirmImport
                    ? "可导入"
                    : "请检查错误"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-blue-100 bg-white p-3 lg:grid-cols-[auto_180px_auto_auto_160px] lg:items-end">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            checked={areAllVisibleSelected}
            onChange={(event) =>
              onSetAllVisibleImportSelection(
                event.target.checked,
                Array.from(pageCandidateIds),
              )
            }
            type="checkbox"
          />
          全选本页
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            批量分类
          </span>
          <select
            className="h-9 w-full rounded-lg border border-blue-100 bg-white px-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => onSetBatchUsageType(event.target.value as ImportedMediaUsageType)}
            value={batchUsageType}
          >
            <option value="">选择分类</option>
            {usageTypeOptions.map((usageType) => (
              <option key={usageType.value} value={usageType.value}>
                {usageType.label}
              </option>
            ))}
          </select>
        </label>
        <AppButton
          disabled={!batchUsageType}
          onClick={onApplyBatchUsageType}
          size="sm"
          type="button"
          variant="secondary"
        >
          批量设置分类
        </AppButton>
        <AppButton
          disabled={!hasBatchTargets}
          onClick={onMarkBatchReviewed}
          size="sm"
          type="button"
          variant="secondary"
        >
          批量标记已确认
        </AppButton>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            确认筛选
          </span>
          <select
            className="h-9 w-full rounded-lg border border-blue-100 bg-white px-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => {
              setCurrentPage(1);
              onSetImportReviewFilter(event.target.value as ImportReviewFilter);
            }}
            value={importReviewFilter}
          >
            <option value="all">全部</option>
            <option value="unreviewed">仅显示未确认</option>
            <option value="lowConfidence">仅显示低置信度</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-slate-600">
        <span>
          每页 {importPageSize} 张，当前第 {activePage} / {pageCount} 页
        </span>
        <div className="flex items-center gap-2">
          <AppButton
            disabled={activePage <= 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            size="sm"
            type="button"
            variant="secondary"
          >
            上一页
          </AppButton>
          <AppButton
            disabled={activePage >= pageCount}
            onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
            size="sm"
            type="button"
            variant="secondary"
          >
            下一页
          </AppButton>
        </div>
      </div>

      {pageGroups.map((group) => (
        <div
          className="rounded-lg border border-blue-100 bg-white p-4"
          key={group.id}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">{group.id}</p>
              <p className="mt-1 text-xs text-slate-500">
                {group.items.length} 个文件
              </p>
            </div>
            <AppButton
              disabled={!group.items.some(canUseImportCandidate)}
              onClick={() => onToggleGroupSelection(group.items)}
              size="sm"
              type="button"
              variant="secondary"
            >
              {areAllGroupItemsSelected(group.items) ? "取消全选" : "全选"}
            </AppButton>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {group.items.map((candidate) => (
              <div
                className={[
                  "overflow-hidden rounded-lg border bg-white",
                  candidate.status === "error"
                    ? "border-red-100"
                    : candidate.status === "duplicate"
                      ? "border-slate-200 bg-slate-50 opacity-80"
                      : selectedImportIds.includes(candidate.id)
                        ? "border-blue-500"
                        : "border-blue-100",
                ].join(" ")}
                key={candidate.id}
              >
                <div className="relative aspect-square bg-blue-50">
                  <label className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                    <input
                      checked={selectedImportIds.includes(candidate.id)}
                      disabled={!canUseImportCandidate(candidate)}
                      onChange={() => onToggleImportSelection(candidate.id)}
                      type="checkbox"
                    />
                    选择
                  </label>
                  {isPdfCandidate(candidate) ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-100 bg-white text-lg font-bold text-red-600 shadow-sm">
                        PDF
                      </span>
                      <span className="line-clamp-2 text-xs font-semibold text-slate-600">
                        {candidate.filename}
                      </span>
                    </div>
                  ) : (
                    <img
                      alt={candidate.filename}
                      className="h-full w-full object-contain"
                      src={candidate.previewUrl}
                    />
                  )}
                </div>
                <div className="space-y-3 p-3">
                  <div>
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {candidate.filename}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {candidate.category} / {candidate.sku}
                    </p>
                  </div>
                  <div className="rounded-lg border border-blue-50 bg-blue-50 px-2 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-slate-500">
                        AI建议
                      </p>
                      <span className="text-xs font-semibold text-slate-700">
                        {candidate.confidence
                          ? `${Math.round(candidate.confidence * 100)}%`
                          : "-"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {translateUsageType(candidate.suggestedUsageType)}
                    </p>
                    {candidate.classificationReason ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {candidate.classificationReason}
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-lg border border-blue-50 bg-white px-2 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-slate-500">
                        AI质量评分
                      </p>
                      <span className="text-xs font-semibold text-slate-700">
                        {candidate.qualityScore !== null
                          ? `${candidate.qualityScore}/100`
                          : isBrandUsageType(candidate.usageType)
                            ? "不参与"
                            : "-"}
                      </span>
                    </div>
                    {candidate.qualityScoreReason ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {candidate.qualityScoreReason}
                      </p>
                    ) : null}
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-500">
                      分类
                    </span>
                    <select
                      className="h-9 w-full rounded-lg border border-blue-100 bg-white px-2 text-sm text-slate-700 outline-none disabled:bg-slate-50 disabled:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      disabled={!canUseImportCandidate(candidate)}
                      onChange={(event) =>
                        onUpdateImportUsageType(
                          candidate.id,
                          event.target.value as ImportedMediaUsageType,
                        )
                      }
                      value={candidate.usageType}
                    >
                      <option value="">选择分类</option>
                      {usageTypeOptions.map((usageType) => (
                        <option key={usageType.value} value={usageType.value}>
                          {usageType.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <AppBadge
                      variant={
                        candidate.status === "error"
                          ? "danger"
                          : candidate.status === "duplicate"
                            ? "default"
                            : candidate.classificationStatus === "failed"
                              ? "danger"
                              : candidate.classificationStatus === "classified" &&
                                  candidate.confidence < lowConfidenceThreshold
                                ? "warning"
                                : candidate.status === "ready"
                                  ? "success"
                                  : "warning"
                      }
                    >
                      {getClassificationStatusLabel(candidate)}
                    </AppBadge>
                    <AppBadge
                      variant={
                        candidate.reviewStatus === "reviewed"
                          ? "success"
                          : "warning"
                      }
                    >
                      {getReviewStatusLabel(candidate.reviewStatus)}
                    </AppBadge>
                    <span className="text-xs text-slate-500">
                      {(candidate.fileSize / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">
                      来源：{candidate.classificationSource}
                    </span>
                    <AppButton
                      disabled={
                        !canUseImportCandidate(candidate) || !candidate.usageType
                      }
                      onClick={() => onMarkCandidateReviewed(candidate.id)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      标记已确认
                    </AppButton>
                  </div>
                  {candidate.error ? (
                    <p className="text-xs leading-5 text-red-600">
                      {candidate.error}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
