import type { RefObject } from "react";

import { AppBadge, AppButton } from "@/components/ui";
import type { ReferenceImageCandidate } from "@/lib/ai-workspace/referenceImageSelector";
import type { GenerationResult } from "@/lib/ai-workspace/types";
import { GenerationChainPanel } from "./GenerationChainPanel";

export function GeneratedResultPanel({
  continueImageId,
  continueIntent,
  continueReferenceImageIds,
  editReferenceFileInputRef,
  editReferenceSearch,
  filteredEditReferenceImages,
  isEditingImage,
  isEditReferencePickerOpen,
  isUploadingEditReference,
  notice,
  preserveExistingText,
  result,
  savedImageStatus,
  selectedContinueReferenceImages,
  onApplyEdit,
  onGenerateAgain,
  onSave,
  onSelectContinueImage,
  onSetContinueIntent,
  onSetEditReferencePickerOpen,
  onSetEditReferenceSearch,
  onSetPreserveExistingText,
  onToggleContinueReferenceImage,
  onUploadEditReferenceImage,
}: {
  continueImageId: string | null;
  continueIntent: string;
  continueReferenceImageIds: string[];
  editReferenceFileInputRef: RefObject<HTMLInputElement | null>;
  editReferenceSearch: string;
  filteredEditReferenceImages: ReferenceImageCandidate[];
  isEditingImage: boolean;
  isEditReferencePickerOpen: boolean;
  isUploadingEditReference: boolean;
  notice: string;
  preserveExistingText: boolean;
  result: GenerationResult | null;
  savedImageStatus: Record<string, { status: "success" | "error"; message: string }>;
  selectedContinueReferenceImages: ReferenceImageCandidate[];
  onApplyEdit: () => void;
  onGenerateAgain: () => void;
  onSave: (imageId: string, mediaId?: string) => void;
  onSelectContinueImage: (imageId: string) => void;
  onSetContinueIntent: (value: string) => void;
  onSetEditReferencePickerOpen: (updater: (current: boolean) => boolean) => void;
  onSetEditReferenceSearch: (value: string) => void;
  onSetPreserveExistingText: (value: boolean) => void;
  onToggleContinueReferenceImage: (imageId: string) => void;
  onUploadEditReferenceImage: (file?: File) => void;
}) {
  if (!result?.images.length) {
    return (
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-5 text-sm text-slate-500">
        当前任务还没有生成结果。
      </div>
    );
  }

  return (
    <div>
      {notice ? (
        <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
          {notice}
        </div>
      ) : null}
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-950">当前生成结果</p>
        <AppBadge>{result.generationGroupId || result.taskId}</AppBadge>
      </div>
      <GenerationChainPanel generationGroupId={result.generationGroupId} />
      {result.historyConsistency?.status && result.historyConsistency.status !== "consistent" ? (
        <div
          className={[
            "mb-4 rounded-lg border px-4 py-3 text-sm",
            result.historyConsistency.status === "broken"
              ? "border-red-100 bg-red-50 text-red-700"
              : "border-amber-100 bg-amber-50 text-amber-700",
          ].join(" ")}
        >
          <p className="font-semibold">
            {result.historyConsistency.status === "broken"
              ? "历史链路未完整写入"
              : "历史链路建议复核"}
          </p>
          <p className="mt-1 leading-6">{result.historyConsistency.summary}</p>
          {result.historyConsistency.issues[0] ? (
            <p className="mt-1 leading-6">{result.historyConsistency.issues[0].message}</p>
          ) : null}
        </div>
      ) : null}
      <div className="grid grid-cols-3 gap-4">
        {result.images.map((image) => (
          <div className="rounded-lg border border-blue-100 bg-white p-3" key={image.id}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Generated image URLs can be remote, data URL, or provider temporary previews. */}
            <img
              alt="Generated result"
              className="aspect-square w-full rounded-md object-cover"
              src={image.url}
            />
            <div className="mt-3 grid grid-cols-3 gap-2">
              <AppButton
                onClick={() => onSave(image.id, image.mediaId)}
                size="sm"
                variant="secondary"
              >
                保存
              </AppButton>
              <AppButton
                onClick={() => onSelectContinueImage(image.id)}
                size="sm"
                variant="secondary"
              >
                继续设计
              </AppButton>
              <AppButton onClick={onGenerateAgain} size="sm" variant="secondary">
                重新生成
              </AppButton>
            </div>
            {savedImageStatus[image.id] ? (
              <div
                className={[
                  "mt-2 rounded-lg border px-3 py-2 text-xs font-medium",
                  savedImageStatus[image.id].status === "success"
                    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                    : "border-red-100 bg-red-50 text-red-700",
                ].join(" ")}
              >
                {savedImageStatus[image.id].message}
              </div>
            ) : null}
            {continueImageId === image.id ? (
              <div className="mt-3 space-y-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
                <textarea
                  className="min-h-20 w-full resize-y rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  onChange={(event) => onSetContinueIntent(event.target.value)}
                  placeholder="请输入修改要求，例如：产品再放大一点、背景更干净、配件摆放更整齐"
                  value={continueIntent}
                />
                <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs leading-5 text-slate-600">
                  <input
                    checked={preserveExistingText}
                    className="mt-1 h-4 w-4 rounded border-blue-200 text-blue-600 focus:ring-blue-200"
                    onChange={(event) => onSetPreserveExistingText(event.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    <span className="block font-semibold text-slate-800">
                      保留原图文字 / Logo / 标签
                    </span>
                    <span>
                      默认保留已有标题、卖点文案、图标说明和版式；如需删除或重排文字，可取消勾选或在修改要求中说明。
                    </span>
                  </span>
                </label>
                <div className="rounded-lg border border-blue-100 bg-white p-2">
                  <input
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => onUploadEditReferenceImage(event.target.files?.[0])}
                    ref={editReferenceFileInputRef}
                    type="file"
                  />
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-600">本轮参考图</p>
                    <span className="text-xs text-slate-400">
                      {continueReferenceImageIds.length} 张
                    </span>
                  </div>
                  {selectedContinueReferenceImages.length > 0 ? (
                    <div className="mb-2 grid grid-cols-4 gap-2">
                      {selectedContinueReferenceImages.map((referenceImage) => (
                        <button
                          className="relative overflow-hidden rounded-md border border-blue-500 bg-white text-left ring-2 ring-blue-100"
                          key={referenceImage.id}
                          onClick={() => onToggleContinueReferenceImage(referenceImage.id)}
                          type="button"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- Edit reference images can be media URLs, uploads, or data URL previews. */}
                          <img
                            alt={referenceImage.type || "编辑参考图"}
                            className="aspect-square w-full object-cover"
                            src={referenceImage.url}
                          />
                          <span className="absolute bottom-1 left-1 right-1 truncate rounded bg-white/90 px-1 py-0.5 text-[10px] font-medium text-slate-600">
                            {referenceImage.type || "参考"}
                          </span>
                          <span className="absolute right-1 top-1 rounded bg-blue-600 px-1 py-0.5 text-[10px] font-semibold text-white">
                            移除
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-2 rounded-md border border-dashed border-blue-100 bg-blue-50 px-3 py-3 text-xs text-slate-500">
                      可从媒体库选择，或上传一张本轮参考图。
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <AppButton
                      onClick={() => onSetEditReferencePickerOpen((current) => !current)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      选择媒体库图片
                    </AppButton>
                    <AppButton
                      disabled={isUploadingEditReference}
                      onClick={() => editReferenceFileInputRef.current?.click()}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      {isUploadingEditReference ? "上传中..." : "上传图片"}
                    </AppButton>
                  </div>
                  {isEditReferencePickerOpen ? (
                    <div className="mt-3 rounded-lg border border-blue-100 bg-slate-50 p-2">
                      <input
                        className="mb-2 h-9 w-full rounded-lg border border-blue-100 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) => onSetEditReferenceSearch(event.target.value)}
                        placeholder="搜索素材类型、状态或 ID"
                        value={editReferenceSearch}
                      />
                      {filteredEditReferenceImages.length > 0 ? (
                        <div className="max-h-72 space-y-2 overflow-auto pr-1">
                          {filteredEditReferenceImages.map((referenceImage) => {
                            const checked = continueReferenceImageIds.includes(referenceImage.id);

                            return (
                              <button
                                className={[
                                  "flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors",
                                  checked
                                    ? "border-blue-300 bg-blue-50"
                                    : "border-blue-100 bg-white hover:bg-blue-50",
                                ].join(" ")}
                                key={referenceImage.id}
                                onClick={() => onToggleContinueReferenceImage(referenceImage.id)}
                                type="button"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element -- Picker thumbnails can point to dynamic media URLs or temporary uploaded previews. */}
                                <img
                                  alt={referenceImage.type || "编辑参考图"}
                                  className="h-12 w-12 rounded-md object-cover"
                                  src={referenceImage.url}
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-xs font-semibold text-slate-800">
                                    {referenceImage.type || "素材"}
                                  </span>
                                  <span className="mt-1 block truncate text-xs text-slate-500">
                                    {referenceImage.status || "draft"} ·{" "}
                                    {referenceImage.qualityScore ?? "-"} 分
                                  </span>
                                </span>
                                {checked ? <AppBadge>已选</AppBadge> : null}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="rounded-md border border-blue-100 bg-white px-3 py-3 text-xs text-slate-500">
                          没有匹配的媒体库图片。
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
                <AppButton
                  className="w-full"
                  disabled={isEditingImage}
                  onClick={onApplyEdit}
                  size="sm"
                >
                  {isEditingImage ? "修改中..." : "应用修改"}
                </AppButton>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
