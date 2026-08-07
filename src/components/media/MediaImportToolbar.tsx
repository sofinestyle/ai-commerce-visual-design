"use client";

import { type ChangeEvent, type RefObject } from "react";

import { type BrandSummary } from "@/components/media/mediaApi";
import { AppButton } from "@/components/ui";

import { defaultVisionModel } from "./useMediaImportWorkflow";

export function MediaImportToolbar({
  brandFileInputRef,
  folderInputRef,
  brandImportName,
  brandOnly = false,
  brands,
  importMode,
  isClassifying,
  isImporting,
  onClassifySelected,
  onCreateBrand,
  onCreateVisionModel,
  onScanFolder,
  onSelectBrandFile,
  onSelectBrandFolder,
  onSelectProductFolder,
  onSelectProductFolderFallback,
  selectedImportCandidateCount,
  selectedVisionModel,
  setBrandImportName,
  setSelectedVisionModel,
  visionModelOptions,
}: {
  brandImportName: string;
  brandOnly?: boolean;
  brands: BrandSummary[];
  brandFileInputRef: RefObject<HTMLInputElement | null>;
  folderInputRef: RefObject<HTMLInputElement | null>;
  importMode: "product" | "brand";
  isClassifying: boolean;
  isImporting: boolean;
  onClassifySelected: () => void;
  onCreateBrand: (name: string) => Promise<BrandSummary>;
  onCreateVisionModel: (modelId: string, label?: string) => Promise<void>;
  onScanFolder: (event: ChangeEvent<HTMLInputElement>) => void;
  onSelectBrandFile: () => void;
  onSelectBrandFolder: () => void;
  onSelectProductFolder: () => void;
  onSelectProductFolderFallback: () => void;
  selectedImportCandidateCount: number;
  selectedVisionModel: string;
  setBrandImportName: (name: string) => void;
  setSelectedVisionModel: (model: string) => void;
  visionModelOptions: string[];
}) {
  async function createAndSelectBrand() {
    const name = window.prompt("请输入新品牌名称：")?.trim();

    if (!name) {
      return;
    }

    const nextBrand = await onCreateBrand(name);

    setBrandImportName(nextBrand.name);
  }

  async function createAndSelectVisionModel() {
    const modelId = window.prompt("请输入 DMXAPI 中的 AI识别/打分模型 ID：")?.trim();

    if (!modelId) {
      return;
    }

    const label = window.prompt("显示名称（可选，留空则使用模型 ID）：")?.trim();

    try {
      await onCreateVisionModel(modelId, label || undefined);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "模型验证或保存失败，请确认模型 ID 是否存在于 DMXAPI。",
      );
    }
  }

  return (
    <>
      <input
        {...{ webkitdirectory: "", directory: "" }}
        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        multiple
        onChange={onScanFolder}
        ref={folderInputRef}
        type="file"
      />
      <input
        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        multiple
        onChange={onScanFolder}
        ref={brandFileInputRef}
        type="file"
      />

      {brandOnly ? (
      <div className="grid gap-3 rounded-lg border border-blue-100 bg-white p-3 text-sm lg:grid-cols-[auto_1fr] lg:items-center">
        <div>
          <p className="font-semibold text-slate-950">品牌资产</p>
          <p className="mt-1 text-xs text-slate-500">Logo、品牌色、包装规范、证书和 PDF 资料。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <label className="flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-2 py-1 text-xs font-semibold text-slate-500">
            品牌
            <select
              className="h-8 w-40 rounded-md border border-blue-100 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              onChange={(event) => setBrandImportName(event.target.value)}
              value={brandImportName}
            >
              <option value="">选择品牌</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.name}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
          <AppButton
            className="min-w-20 whitespace-nowrap"
            onClick={() => void createAndSelectBrand()}
            size="sm"
            title="新增品牌并用于品牌资产导入"
            type="button"
            variant="secondary"
          >
            新增品牌
          </AppButton>
          <AppButton
            className="min-w-24 whitespace-nowrap"
            disabled={!brandImportName.trim()}
            onClick={onSelectBrandFolder}
            size="sm"
            title="选择品牌资料文件夹，支持图片和 PDF"
            type="button"
            variant="secondary"
          >
            导入文件夹
          </AppButton>
          <AppButton
            className="min-w-24 whitespace-nowrap"
            disabled={!brandImportName.trim()}
            onClick={onSelectBrandFile}
            size="sm"
            title="选择单个或多个品牌资料文件，支持图片和 PDF"
            type="button"
            variant="secondary"
          >
            导入文件
          </AppButton>
        </div>
      </div>
      ) : null}

      {!brandOnly ? (
      <div className="mt-3 grid gap-3 rounded-lg border border-blue-100 bg-white p-3 text-sm lg:grid-cols-[auto_1fr] lg:items-center">
        <div>
          <p className="font-semibold text-slate-950">产品素材</p>
          <p className="mt-1 text-xs text-slate-500">产品拍摄图、原图、转换图和参考图。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <AppButton
            className="min-w-24 whitespace-nowrap"
            onClick={onSelectProductFolder}
            size="sm"
            title="默认扫描 public/media 文件夹"
            type="button"
          >
            导入产品素材
          </AppButton>
          <AppButton
            className="min-w-24 whitespace-nowrap"
            onClick={onSelectProductFolderFallback}
            size="sm"
            title="手动选择其他产品素材文件夹"
            type="button"
            variant="secondary"
          >
            选择其他文件夹
          </AppButton>
        </div>
      </div>
      ) : null}

      {!brandOnly ? (
      <div className="mt-3 grid gap-3 rounded-lg border border-blue-100 bg-white p-3 text-sm lg:grid-cols-[auto_1fr] lg:items-center">
        <div>
          <p className="font-semibold text-slate-950">AI处理</p>
          <p className="mt-1 text-xs text-slate-500">仅产品图片参与 AI 分类和质量评分。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <label className="flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-2 py-1 text-xs font-semibold text-slate-500">
            模型
            <select
              className="h-8 w-48 rounded-md border border-blue-100 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              disabled={isClassifying}
              onChange={(event) => setSelectedVisionModel(event.target.value)}
              value={selectedVisionModel}
            >
              {visionModelOptions.map((model) => (
                <option key={model} value={model}>
                  {model === defaultVisionModel ? `${model}（默认）` : model}
                </option>
              ))}
            </select>
          </label>
          <AppButton
            className="min-w-20 whitespace-nowrap"
            onClick={() => void createAndSelectVisionModel()}
            size="sm"
            title="验证并新增 DMXAPI AI识别/打分模型"
            type="button"
            variant="secondary"
          >
            新增模型
          </AppButton>
          <AppButton
            className="min-w-20 whitespace-nowrap"
            disabled={
              importMode === "brand" ||
              selectedImportCandidateCount === 0 ||
              isClassifying ||
              isImporting
            }
            onClick={onClassifySelected}
            size="sm"
            title={
              importMode === "brand"
                ? "品牌资产不参与 AI 图片分类和质量评分"
                : "AI自动分类勾选的图片并生成AI质量评分"
            }
            type="button"
            variant="secondary"
          >
            {isClassifying ? "识别中" : "AI分类"}
          </AppButton>
        </div>
      </div>
      ) : null}

      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-slate-600">
        {brandOnly || importMode === "brand"
          ? "品牌资产模式：请选择品牌资料文件夹，或选择单个/多个 JPG、PNG、WEBP、PDF 文件；导入后会复制到 public/media/品牌/{品牌名}/，PDF 不参与 AI 分类和质量评分。"
          : "产品素材模式：点击“导入产品素材”会默认扫描 public/media；也可手动选择单个类目文件夹或单个 SKU 文件夹。支持 SKU 下的原图、转换图、参考图等子文件夹，已导入图片会自动标记并跳过。"}
      </div>

      <div className={`mt-4 grid gap-3 ${brandOnly ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        <div className="rounded-lg border border-blue-100 bg-white p-3">
          <p className="text-sm font-semibold text-slate-950">
            {brandOnly ? "1. 选择文件夹或文件" : "1. 选择文件夹"}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {brandOnly ? "选择包含品牌图片/PDF 资料的文件夹，或直接选择单个/多个资料文件。" : "默认扫描 public/media；如需导入其他来源，可手动选择单个类目或单个 SKU 文件夹。"}
          </p>
        </div>
        {!brandOnly ? (
        <div className="rounded-lg border border-blue-100 bg-white p-3">
          <p className="text-sm font-semibold text-slate-950">
            2. 分类确认
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            产品图片可 AI 分类；品牌资产默认归入品牌其他资料，可人工调整和确认。
          </p>
        </div>
        ) : null}
        <div className="rounded-lg border border-blue-100 bg-white p-3">
          <p className="text-sm font-semibold text-slate-950">3. 导入媒体库</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            已确认文件写入媒体库并成为正式资产。
          </p>
        </div>
      </div>
    </>
  );
}
