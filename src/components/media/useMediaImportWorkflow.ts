"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  type ImportedMediaCandidate,
  type ImportReviewFilter,
  canUseImportCandidate,
  lowConfidenceThreshold,
} from "@/components/media/MediaImportReviewPanel";
import {
  type ImportedMediaUsageType,
  isBrandUsageType,
} from "@/components/media/mediaAssetUtils";
import {
  applyBatchImportUsageType,
  getCanConfirmImport,
  getClassifiableImportCandidates,
  getReadySelectedImportCandidates,
  getSelectedImportCandidates,
  getValidImportCandidates,
  markDuplicateImportCandidates,
  markImportCandidatesReviewed,
  removeDuplicateImportSelections,
  selectedImportNeedsReview as getSelectedImportNeedsReview,
  sortImportCandidatesForReview,
  updateImportCandidateUsageType,
} from "./mediaImportCandidateState";
import {
  checkImportDuplicates as checkImportDuplicateRecords,
  classifyImportImages,
  createCustomModel,
  importMediaFolder,
  uploadBrandImportFile,
} from "./mediaApi";
import {
  brandCategoryName,
  getImportProductCategories,
  getImportRelativePath,
  getImportFileExtension,
  isSupportedBrandImportFile,
  isSupportedImportImage,
  maxImportImages,
  parseImportPath,
} from "./mediaImportWorkflowUtils";
import { defaultModelConfig, fallbackVisionModels } from "@/lib/modelDefaults";

const classificationBatchSize = 4;
export const defaultVisionModel = defaultModelConfig.visionModel;
type ImportMode = "product" | "brand";

function groupImportCandidatesBySku(candidates: ImportedMediaCandidate[]) {
  const groupedCandidates = new Map<string, ImportedMediaCandidate[]>();

  candidates.forEach((candidate) => {
    const key = `${candidate.category || "未识别类目"} / ${candidate.sku || "未识别SKU"}`;
    const currentCandidates = groupedCandidates.get(key) ?? [];

    groupedCandidates.set(key, [...currentCandidates, candidate]);
  });

  return Array.from(groupedCandidates.entries()).map(([id, items]) => ({
    id,
    items: sortImportCandidatesForReview(items),
  }));
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function computeFileContentHash(file: File) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getImportFileMimeType(file: File) {
  if (file.type) {
    return file.type;
  }

  const extension = getImportFileExtension(file.name);

  if (extension === "pdf") {
    return "application/pdf";
  }

  if (extension === "jpg" || extension === "jpeg") {
    return "image/jpeg";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  return "image/png";
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片预览加载失败。"));
    image.src = src;
  });
}

async function compressImageForVision(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const maxSide = 1024;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("浏览器不支持图片压缩。");
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", 0.75);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function useMediaImportWorkflow({
  reloadMediaAssets,
  setSuccessMessage,
  skuCategoryMap,
}: {
  reloadMediaAssets: () => Promise<void>;
  setSuccessMessage: (message: string) => void;
  skuCategoryMap: Map<string, string>;
}) {
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const brandFileInputRef = useRef<HTMLInputElement | null>(null);
  const importCandidatesRef = useRef<ImportedMediaCandidate[]>([]);
  const pendingImportModeRef = useRef<ImportMode>("product");
  const [importCandidates, setImportCandidates] = useState<ImportedMediaCandidate[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [brandImportName, setBrandImportName] = useState("YorRay");
  const [importMode, setImportMode] = useState<ImportMode>("product");
  const [isImporting, setIsImporting] = useState(false);
  const [importCompletedCount, setImportCompletedCount] = useState(0);
  const [isClassifying, setIsClassifying] = useState(false);
  const [importReviewFilter, setImportReviewFilter] = useState<ImportReviewFilter>("all");
  const [batchUsageType, setBatchUsageType] = useState<ImportedMediaUsageType>("");
  const [selectedVisionModel, setSelectedVisionModel] =
    useState<string>(defaultVisionModel);
  const [visionModelOptions, setVisionModelOptions] = useState<string[]>([
    ...fallbackVisionModels,
  ]);
  const [selectedImportIds, setSelectedImportIds] = useState<string[]>([]);

  useEffect(() => {
    importCandidatesRef.current = importCandidates;
  }, [importCandidates]);

  useEffect(() => {
    let isMounted = true;

    async function loadVisionModels() {
      try {
        const response = await fetch("/api/ai/models");
        const payload = (await response.json()) as {
          data?: {
            visionModels?: string[];
          };
          success?: boolean;
        };
        const nextVisionModels = payload.data?.visionModels;

        if (isMounted && payload.success && nextVisionModels?.length) {
          setVisionModelOptions(nextVisionModels);
          setSelectedVisionModel((currentModel) =>
            nextVisionModels.includes(currentModel)
              ? currentModel
              : nextVisionModels.includes(defaultVisionModel)
                ? defaultVisionModel
                : nextVisionModels[0],
          );
        }
      } catch {
        if (isMounted) {
          setVisionModelOptions([...fallbackVisionModels]);
        }
      }
    }

    void loadVisionModels();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      importCandidatesRef.current.forEach((candidate) =>
        URL.revokeObjectURL(candidate.previewUrl),
      );
    };
  }, []);

  const importGroups = useMemo(
    () =>
      groupImportCandidatesBySku(
        importCandidates.filter((candidate) => {
          if (importReviewFilter === "unreviewed") {
            return candidate.reviewStatus !== "reviewed";
          }

          if (importReviewFilter === "lowConfidence") {
            return (
              canUseImportCandidate(candidate) &&
              candidate.classificationStatus === "classified" &&
              candidate.confidence < lowConfidenceThreshold
            );
          }

          return true;
        }),
      ),
    [importCandidates, importReviewFilter],
  );

  const validImportCandidates = getValidImportCandidates(importCandidates);
  const selectedImportCandidates = getSelectedImportCandidates(
    importCandidates,
    selectedImportIds,
  );
  const readySelectedImportCandidates =
    getReadySelectedImportCandidates(selectedImportCandidates);
  const selectedImportNeedsReview = getSelectedImportNeedsReview(selectedImportCandidates);
  const canConfirmImport = getCanConfirmImport({
    isClassifying,
    isImporting,
    readySelectedCandidates: readySelectedImportCandidates,
    selectedCandidates: selectedImportCandidates,
  });
  const lowConfidenceCount = validImportCandidates.filter(
    (candidate) =>
      candidate.classificationStatus === "classified" &&
      candidate.confidence < lowConfidenceThreshold,
  ).length;
  const importSkuCount = new Set(
    validImportCandidates.map((candidate) => candidate.sku).filter(Boolean),
  ).size;
  const importErrorCount = importCandidates.filter(
    (candidate) => candidate.status === "error",
  ).length;
  const importDuplicateCount = importCandidates.filter(
    (candidate) => candidate.status === "duplicate",
  ).length;

  function clearImportCandidates() {
    importCandidates.forEach((candidate) => {
      if (candidate.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(candidate.previewUrl);
      }
    });
    setImportCandidates([]);
    setImportError(null);
    setSelectedImportIds([]);
    setBatchUsageType("");
    setImportCompletedCount(0);
    setImportMode("product");
    pendingImportModeRef.current = "product";

    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }
    if (brandFileInputRef.current) {
      brandFileInputRef.current.value = "";
    }
  }

  function openProductFolderPicker() {
    pendingImportModeRef.current = "product";
    setImportMode("product");
    setImportError(null);
    folderInputRef.current?.click();
  }

  function openBrandFolderPicker() {
    if (!brandImportName.trim()) {
      setImportError("请先填写品牌名称，再导入品牌资产。");
      return;
    }

    pendingImportModeRef.current = "brand";
    setImportMode("brand");
    setImportError(null);
    folderInputRef.current?.click();
  }

  function openBrandFilePicker() {
    if (!brandImportName.trim()) {
      setImportError("请先填写品牌名称，再导入品牌资产。");
      return;
    }

    pendingImportModeRef.current = "brand";
    setImportMode("brand");
    setImportError(null);
    brandFileInputRef.current?.click();
  }

  async function addVisionModel(modelId: string, label?: string) {
    const result = await createCustomModel({
      id: modelId,
      label,
      type: "vision",
    });
    const nextModelId = result?.model.id || modelId;

    setVisionModelOptions((currentOptions) =>
      Array.from(new Set([...currentOptions, nextModelId])).sort((first, second) =>
        first.localeCompare(second),
      ),
    );
    setSelectedVisionModel(nextModelId);
  }

  async function checkImportDuplicates(candidates: ImportedMediaCandidate[]) {
    const candidatesToCheck = candidates.filter(canUseImportCandidate);

    if (candidatesToCheck.length === 0) {
      return;
    }

    try {
      const result = await checkImportDuplicateRecords(
        candidatesToCheck.map((candidate) => ({
          category: candidate.category,
          contentHash: candidate.contentHash,
          fileSize: candidate.fileSize,
          id: candidate.id,
          relativePath: candidate.relativePath,
          sku: candidate.sku,
        })),
      );
      const duplicateIds = new Set(
        result.results
          .filter((duplicateResult) => duplicateResult.duplicate)
          .map((duplicateResult) => duplicateResult.id),
      );

      if (duplicateIds.size === 0) {
        return;
      }

      setImportCandidates((currentCandidates) =>
        markDuplicateImportCandidates(currentCandidates, duplicateIds),
      );
      setSelectedImportIds((currentIds) =>
        removeDuplicateImportSelections(currentIds, duplicateIds),
      );
      setImportError(`检测到 ${duplicateIds.size} 个已导入文件，确认导入时会自动跳过。`);
    } catch (requestError) {
      setImportError(
        requestError instanceof Error
          ? requestError.message
          : "重复检查失败，可继续手动确认导入。",
      );
    }
  }

  async function scanImportFolder(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const activeImportMode = pendingImportModeRef.current;
    const importFiles =
      activeImportMode === "brand"
        ? files.filter(isSupportedBrandImportFile)
        : files.filter(isSupportedImportImage);

    importCandidates.forEach((candidate) => {
      if (candidate.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(candidate.previewUrl);
      }
    });

    if (importFiles.length === 0) {
      setImportCandidates([]);
      setSelectedImportIds([]);
      setImportMode(activeImportMode);
      setImportError(
        activeImportMode === "brand"
          ? "未扫描到 jpg、jpeg、png、webp 或 pdf 文件。"
          : "未扫描到 jpg、jpeg、png 或 webp 图片。",
      );
      return;
    }

    if (activeImportMode === "brand") {
      const selectedBrandName = brandImportName.trim();
      const nextCandidates = await Promise.all(
        importFiles.map<Promise<ImportedMediaCandidate>>(async (file, index) => {
          const relativePath = getImportRelativePath(file);
          const filename = relativePath.split("/").filter(Boolean).pop() || file.name;
          const contentHash = await computeFileContentHash(file);
          const errors = [
            index >= maxImportImages ? `单次最多导入 ${maxImportImages} 个文件。` : "",
            !selectedBrandName ? "品牌名称不能为空。" : "",
          ].filter(Boolean);

          return {
            id: `${contentHash}-${relativePath}`,
            file,
            filename,
            relativePath,
            sourceInStandardSkuFolder: false,
            storageFolder: "",
            contentHash,
            fileSize: file.size,
            mimeType: getImportFileMimeType(file),
            category: brandCategoryName,
            sku: selectedBrandName,
            previewUrl: URL.createObjectURL(file),
            usageType: "brand_other",
            suggestedUsageType: "brand_other",
            confidence: 1,
            classificationReason: `通过“导入品牌资产”按钮导入，默认保存到 public/media/品牌/${selectedBrandName}/。`,
            classificationSource: "manual",
            classificationStatus: "classified",
            qualityDimensions: null,
            qualityFlags: [],
            qualityScore: null,
            qualityScoreReason: "",
            reviewStatus: "pending",
            status: errors.length > 0 ? "error" : "ready",
            error: errors.join(" "),
          };
        }),
      );

      setImportMode("brand");
      setImportCandidates(nextCandidates);
      setImportCompletedCount(0);
      setSelectedImportIds([]);
      setImportError(
        nextCandidates.some((candidate) => candidate.status === "error")
          ? "部分品牌资产存在错误，请检查后再确认导入。"
          : null,
      );
      void checkImportDuplicates(nextCandidates);
      return;
    }

    const nextCandidates = await Promise.all(
      importFiles.map<Promise<ImportedMediaCandidate>>(async (file, index) => {
        const parsedPath = parseImportPath(file, skuCategoryMap);
        const errors = [
          index >= maxImportImages ? `单次最多导入 ${maxImportImages} 张图片。` : "",
          !parsedPath.category || !parsedPath.sku
            ? "文件夹结构需为：类目 / SKU / 图片文件，类目 / SKU / 原图|转换图|参考图 / 图片文件，或直接选择已建档 SKU 文件夹。"
            : "",
        ].filter(Boolean);
        const initialUsageType = parsedPath.initialUsageType as ImportedMediaUsageType;
        const isPresetUsageType =
          initialUsageType === "reference" || isBrandUsageType(initialUsageType);
        const contentHash = await computeFileContentHash(file);

        return {
          id: `${contentHash}-${parsedPath.relativePath}`,
          file,
          filename: parsedPath.filename,
          relativePath: parsedPath.relativePath,
          sourceInStandardSkuFolder: parsedPath.sourceInStandardSkuFolder,
          storageFolder: parsedPath.storageFolder,
          contentHash,
          fileSize: file.size,
          mimeType: getImportFileMimeType(file),
          category: parsedPath.category,
          sku: parsedPath.sku,
          previewUrl: URL.createObjectURL(file),
          usageType: initialUsageType,
          suggestedUsageType: initialUsageType,
          confidence: isPresetUsageType ? 1 : 0,
          classificationReason:
            initialUsageType === "reference"
              ? "根据 SKU 下“参考图”文件夹自动归类。"
              : isBrandUsageType(initialUsageType)
                ? `根据“品牌 / ${parsedPath.sku}”文件夹识别为品牌资产。`
                : "",
          classificationSource: isPresetUsageType ? "manual" : "unknown",
          classificationStatus: isPresetUsageType ? "classified" : "unclassified",
          qualityDimensions: null,
          qualityFlags: [],
          qualityScore: null,
          qualityScoreReason: "",
          reviewStatus: "pending",
          status: errors.length > 0 ? "error" : initialUsageType ? "ready" : "pending",
          error: errors.join(" "),
        };
      }),
    );
    const productCategories = getImportProductCategories(nextCandidates);

    if (productCategories.length > 1) {
      nextCandidates.forEach((candidate) => URL.revokeObjectURL(candidate.previewUrl));
      setImportCandidates([]);
      setSelectedImportIds([]);
      setImportError(
        `当前仅支持单类目导入，请选择单个类目文件夹或单个 SKU 文件夹。已识别到：${productCategories.join("、")}。`,
      );
      event.target.value = "";
      return;
    }

    setImportCandidates(nextCandidates);
    setImportCompletedCount(0);
    setImportMode("product");
    setSelectedImportIds([]);
    setImportError(
      nextCandidates.some((candidate) => candidate.status === "error")
        ? "部分图片存在错误，请检查后再确认导入。"
        : null,
    );
    void checkImportDuplicates(nextCandidates);
  }

  function updateImportUsageType(id: string, usageType: ImportedMediaUsageType) {
    setImportCandidates((currentCandidates) =>
      updateImportCandidateUsageType(currentCandidates, id, usageType),
    );
  }

  function toggleImportSelection(id: string) {
    setSelectedImportIds((currentIds) =>
      currentIds.includes(id)
        ? currentIds.filter((currentId) => currentId !== id)
        : [...currentIds, id],
    );
  }

  function setAllVisibleImportSelection(checked: boolean, candidateIds?: string[]) {
    const visibleIds = (candidateIds ?? importGroups.flatMap((group) => group.items.map(
      (candidate) => candidate.id,
    ))).filter(
      (candidateId) =>
        importCandidates.some(
          (candidate) => candidate.id === candidateId && canUseImportCandidate(candidate),
        ),
    );

    setSelectedImportIds((currentIds) =>
      checked
        ? Array.from(new Set([...currentIds, ...visibleIds]))
        : currentIds.filter((id) => !visibleIds.includes(id)),
    );
  }

  function toggleImportGroupSelection(items: ImportedMediaCandidate[]) {
    const selectableIds = items.filter(canUseImportCandidate).map((candidate) => candidate.id);
    const shouldClearGroup =
      selectableIds.length > 0 &&
      selectableIds.every((candidateId) => selectedImportIds.includes(candidateId));

    setSelectedImportIds((currentIds) =>
      shouldClearGroup
        ? currentIds.filter((candidateId) => !selectableIds.includes(candidateId))
        : Array.from(new Set([...currentIds, ...selectableIds])),
    );
  }

  function getBatchTargets() {
    return selectedImportCandidates;
  }

  function applyBatchUsageType() {
    if (!batchUsageType) {
      return;
    }

    const targetIds = new Set(getBatchTargets().map((candidate) => candidate.id));

    setImportCandidates((currentCandidates) =>
      applyBatchImportUsageType(currentCandidates, targetIds, batchUsageType),
    );
  }

  function markBatchReviewed() {
    const targetIds = new Set(getBatchTargets().map((candidate) => candidate.id));

    setImportCandidates((currentCandidates) =>
      markImportCandidatesReviewed(currentCandidates, targetIds),
    );
  }

  function markCandidateReviewed(id: string) {
    setImportCandidates((currentCandidates) =>
      markImportCandidatesReviewed(currentCandidates, new Set([id])),
    );
  }

  async function classifyCandidates(candidates: ImportedMediaCandidate[]) {
    const classifiableCandidates = getClassifiableImportCandidates(candidates);

    if (classifiableCandidates.length === 0) {
      setImportError("没有可识别的图片。");
      return;
    }

    try {
      setIsClassifying(true);
      setImportError(null);
      const classifiableIds = new Set(classifiableCandidates.map((candidate) => candidate.id));

      setImportCandidates((currentCandidates) =>
        currentCandidates.map((candidate) =>
          classifiableIds.has(candidate.id)
            ? {
                ...candidate,
                classificationStatus: "classifying",
                reviewStatus: "pending",
              }
            : candidate,
        ),
      );

      for (const batch of chunkItems(classifiableCandidates, classificationBatchSize)) {
        const items = await Promise.all(
          batch.map(async (candidate) => ({
            category: candidate.category,
            contentHash: candidate.contentHash,
            filename: candidate.filename,
            id: candidate.id,
            imageDataUrl: await compressImageForVision(candidate.file as File),
            relativePath: candidate.relativePath,
            sku: candidate.sku,
          })),
        );
        try {
          const result = await classifyImportImages({
            items,
            model: selectedVisionModel,
          });
          const resultsById = new Map(
            result.results.map((classificationResult) => [
              classificationResult.id,
              classificationResult,
            ]),
          );

          setImportCandidates((currentCandidates) =>
            currentCandidates.map((candidate) => {
              const classificationResult = resultsById.get(candidate.id);

              if (!classificationResult) {
                return candidate;
              }

              return {
                ...candidate,
                classificationReason: classificationResult.reason,
                classificationSource: "vision",
                classificationStatus: "classified",
                confidence: classificationResult.confidence,
                qualityDimensions: classificationResult.qualityDimensions,
                qualityFlags: classificationResult.qualityFlags,
                qualityScore: classificationResult.qualityScore,
                qualityScoreReason: classificationResult.qualityScoreReason,
                reviewStatus: "pending",
                status: "ready",
                suggestedUsageType: classificationResult.suggestedUsageType,
                usageType: classificationResult.suggestedUsageType,
              };
            }),
          );
        } catch (batchError) {
          const failedIds = new Set(batch.map((candidate) => candidate.id));

          setImportCandidates((currentCandidates) =>
            currentCandidates.map((candidate) =>
              failedIds.has(candidate.id)
                ? {
                    ...candidate,
                    classificationReason:
                      batchError instanceof Error
                        ? batchError.message
                        : "AI 分类失败，可手动分类。",
                    classificationStatus: "failed",
                    classificationSource: "unknown",
                  }
                : candidate,
            ),
          );
          continue;
        }
      }
    } catch (requestError) {
      setImportError(
        requestError instanceof Error ? requestError.message : "AI 分类失败，可手动分类。",
      );
      setImportCandidates((currentCandidates) =>
        currentCandidates.map((candidate) =>
          candidate.classificationStatus === "classifying"
            ? {
                ...candidate,
                classificationStatus: "failed",
                classificationSource: "unknown",
              }
            : candidate,
        ),
      );
    } finally {
      setIsClassifying(false);
    }
  }

  async function confirmFolderImport() {
    if (!canConfirmImport) {
      setImportError(
        selectedImportCandidates.length === 0
          ? "请先勾选需要导入的文件。"
          : "请先完成所选文件的分类和人工确认后再导入。",
      );
      return;
    }

    try {
      setIsImporting(true);
      setImportError(null);

      const items = [];

      for (const candidate of readySelectedImportCandidates) {
        const isBrandAsset = candidate.category === "品牌";
        const uploadResult = isBrandAsset
          ? candidate.file
            ? await uploadBrandImportFile(candidate.file)
            : undefined
          : undefined;
        const temporaryFileId = uploadResult?.temporaryFileId;

        if (isBrandAsset && !temporaryFileId) {
          throw new Error("品牌资产上传未返回临时文件编号，请重新选择文件后再试。");
        }

        if (!isBrandAsset && !candidate.sourceInStandardSkuFolder) {
          throw new Error(
            `产品素材必须位于已建档 SKU 文件夹或其子文件夹中：${candidate.relativePath}`,
          );
        }

        items.push({
          sku: candidate.sku,
          category: candidate.category,
          contentHash: candidate.contentHash,
          fileDataUrl: null,
          ...(temporaryFileId ? { temporaryFileId } : {}),
          filename: candidate.filename,
          relativePath: candidate.relativePath,
          sourceInStandardSkuFolder: candidate.sourceInStandardSkuFolder,
          storageFolder: candidate.storageFolder,
          usageType: candidate.usageType,
          suggestedUsageType: candidate.suggestedUsageType || null,
          classificationSource: candidate.classificationSource,
          confidence: candidate.confidence,
          classificationReason: candidate.classificationReason,
          reviewStatus: candidate.reviewStatus,
          mimeType: candidate.mimeType,
          fileSize: candidate.fileSize,
          qualityDimensions: candidate.qualityDimensions,
          qualityFlags: candidate.qualityFlags,
          qualityScore: candidate.qualityScore,
          qualityScoreReason: candidate.qualityScoreReason,
        });
      }
      await importMediaFolder(items);

      const importedCandidateIds = new Set(
        readySelectedImportCandidates.map((candidate) => candidate.id),
      );
      setImportCandidates((currentCandidates) => {
        currentCandidates
          .filter((candidate) => importedCandidateIds.has(candidate.id))
          .forEach((candidate) => {
            if (candidate.previewUrl.startsWith("blob:")) {
              URL.revokeObjectURL(candidate.previewUrl);
            }
          });

        return currentCandidates.filter((candidate) => !importedCandidateIds.has(candidate.id));
      });
      setSelectedImportIds((currentIds) =>
        currentIds.filter((candidateId) => !importedCandidateIds.has(candidateId)),
      );
      setImportCompletedCount((count) => count + importedCandidateIds.size);
      await reloadMediaAssets();
      setSuccessMessage(`本页已导入 ${importedCandidateIds.size} 个文件，可继续处理剩余图片。`);
    } catch (requestError) {
      setImportError(requestError instanceof Error ? requestError.message : "导入失败。");
    } finally {
      setIsImporting(false);
    }
  }

  return {
    applyBatchUsageType,
    batchUsageType,
    brandImportName,
    brandFileInputRef,
    canConfirmImport,
    classifyCandidates,
    clearImportCandidates,
    confirmFolderImport,
    folderInputRef,
    importMode,
    importCandidates,
    importCompletedCount,
    importDuplicateCount,
    importError,
    importErrorCount,
    importGroups,
    importReviewFilter,
    importSkuCount,
    isClassifying,
    isImporting,
    lowConfidenceCount,
    markBatchReviewed,
    markCandidateReviewed,
    openBrandFolderPicker,
    openBrandFilePicker,
    openProductFolderPicker,
    readySelectedImportCandidates,
    scanImportFolder,
    selectedImportCandidates,
    selectedImportIds,
    selectedImportNeedsReview,
    selectedVisionModel,
    setAllVisibleImportSelection,
    setBatchUsageType,
    setBrandImportName,
    setImportReviewFilter,
    setSelectedVisionModel,
    addVisionModel,
    toggleImportGroupSelection,
    toggleImportSelection,
    updateImportUsageType,
    validImportCandidates,
    visionModelOptions,
  };
}
