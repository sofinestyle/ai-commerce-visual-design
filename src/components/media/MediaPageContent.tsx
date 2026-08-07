"use client";

import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { MediaAssetModals } from "@/components/media/MediaAssetModals";
import {
  MediaLibraryToolbar,
} from "@/components/media/MediaLibraryToolbar";
import {
  MediaImportReviewPanel,
} from "@/components/media/MediaImportReviewPanel";
import { MediaImportToolbar } from "@/components/media/MediaImportToolbar";
import { MediaLibraryViews } from "@/components/media/MediaLibraryViews";
import { MediaStatsSummary } from "@/components/media/MediaStatsSummary";
import {
  type ApiMediaAsset,
} from "@/components/media/mediaAssetUtils";
import { useMediaLibraryState } from "@/components/media/useMediaLibraryState";
import { useMediaImportWorkflow } from "@/components/media/useMediaImportWorkflow";
import { useMediaAssetActions } from "@/components/media/useMediaAssetActions";
import { useMediaStats } from "@/components/media/useMediaStats";
import {
  createBrand,
  fetchBrands,
  fetchMediaAssets,
  fetchProducts,
  type BrandSummary,
  type ProductSummary,
} from "@/components/media/mediaApi";
import {
  AppButton,
  AppCard,
  EmptyState,
  LoadingState,
  PageTitle,
} from "@/components/ui";
import { t } from "@/i18n";
import type { MediaSection } from "@/config/mediaNavigation";

export default function MediaPage() {
  return <MediaPageContent section="library" />;
}

export function MediaPageContent({ section = "library" }: { section?: MediaSection }) {
  const isBrandSection = section === "brand";
  const isImportSection = section === "import" || isBrandSection;
  const isRecycleBinSection = section === "recycle-bin";
  const isLibrarySection = section === "library";
  const isAssetManagementSection = !isImportSection || isBrandSection;
  const [mediaAssets, setMediaAssets] = useState<ApiMediaAsset[]>([]);
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isRecycleBinOpen] = useState(isRecycleBinSection);
  const [assetToPreview, setAssetToPreview] = useState<ApiMediaAsset | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchInitialData() {
      try {
        setIsLoading(true);
        setError(null);

        const [nextMediaAssets, nextProducts, nextBrands] = await Promise.all([
          fetchMediaAssets({ deletedOnly: isRecycleBinSection }),
          fetchProducts().catch(() => []),
          fetchBrands().catch(() => []),
        ]);

        if (isMounted) {
          setMediaAssets(nextMediaAssets);
          setProducts(nextProducts);
          setBrands(nextBrands);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : t("media.loadErrorTitle"),
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [isRecycleBinSection]);
  const skuCategoryMap = useMemo(
    () =>
      new Map(
        products
          .filter((product) => product.sku && product.category)
          .map((product) => [product.sku, product.category]),
      ),
    [products],
  );
  const {
    activeView,
    areAllGroupAssetsSelected,
    assetGroups,
    filteredAssets,
    isMissingFileListOpen,
    listViewAssets,
    listViewEnd,
    listViewStart,
    listViewTotalCount,
    missingFileAssetIds,
    missingFileTotalPages,
    currentMissingFilePage,
    resetFilters,
    searchAssets,
    searchInput,
    selectedAssetIds,
    selectedAssets,
    selectedSkuGroup,
    selectedSkuVisibleGroup,
    setActiveLibraryView,
    setIsMissingFileListOpen,
    setMissingFilePage,
    setSearchInput,
    setSelectedAssetIds,
    setSelectedSkuGroupId,
    setSourceFilterWithReset,
    setStatusFilterWithReset,
    setUsageTypeFilterWithReset,
    sourceFilter,
    statusFilter,
    toggleAllFilteredAssets,
    toggleAssetSelection,
    toggleGroupAssets,
    toggleListViewAssets,
    usageTypeFilter,
    visibleAssetCount,
    selectMissingAssets,
  } = useMediaLibraryState({
    isRecycleBinSection,
    mediaAssets: isBrandSection
      ? mediaAssets.filter((asset) => asset.source === "brand_asset")
      : mediaAssets,
    setSuccessMessage,
  });
  const {
    applyBatchAssetUsageType,
    assetToDelete,
    assetToEdit,
    batchAssetUsageType,
    batchDeleteSelectedAssets,
    batchDownloadAssets,
    deleteMedia,
    downloadAsset,
    editAssetName,
    editAssetUsageType,
    isAssetActionRunning,
    openEditAsset,
    patchMedia,
    permanentlyDeleteSelectedAssets,
    saveAssetInfo,
    setAssetToDelete,
    setAssetToEdit,
    setBatchAssetUsageType,
    setEditAssetName,
    setEditAssetUsageType,
  } = useMediaAssetActions({
    reloadMediaAssets,
    selectedAssetIds,
    selectedAssets,
    setError,
    setSelectedAssetIds,
    setSuccessMessage,
  });
  const {
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
    openBrandFilePicker,
    addVisionModel,
    openBrandFolderPicker,
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
    toggleImportGroupSelection,
    toggleImportSelection,
    updateImportUsageType,
    visionModelOptions,
  } = useMediaImportWorkflow({
    reloadMediaAssets,
    setSuccessMessage,
    skuCategoryMap,
  });

  const {
    aiGeneratedCount,
    brandAssetCount,
    draftCount,
    finalCount,
    productPhotoCount,
    skuCount,
  } = useMediaStats(mediaAssets);
  async function reloadMediaAssets() {
    setMediaAssets(await fetchMediaAssets({ deletedOnly: isRecycleBinOpen }));
  }

  async function handleCreateBrand(name: string) {
    const nextBrand = await createBrand(name);

    if (!nextBrand) {
      throw new Error("品牌创建失败。");
    }

    setBrands((currentBrands) => {
      const withoutDuplicate = currentBrands.filter((brand) => brand.id !== nextBrand.id);

      return [...withoutDuplicate, nextBrand].sort((firstBrand, secondBrand) =>
        firstBrand.name.localeCompare(secondBrand.name),
      );
    });

    return nextBrand;
  }

  const pageTitle =
    section === "import"
      ? "本地文件导入"
      : isBrandSection
        ? "品牌资产"
        : section === "recycle-bin"
          ? "回收站"
          : "媒体库";
  const pageSubtitle =
    section === "import"
      ? "导入产品拍摄图和参考图，并进行 AI 分类与人工确认。"
      : isBrandSection
        ? "集中导入和管理 Logo、包装资料、证书及 PDF 品牌文件。"
      : section === "recycle-bin"
        ? "查看已删除的媒体记录，并按需恢复。"
        : t("media.subtitle");

  return (
    <AppShell>
      <main className="min-w-0 flex-1 overflow-auto bg-white p-6 text-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div
            className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
            style={{ order: -3 }}
          >
            <PageTitle
              title={pageTitle}
              subtitle={pageSubtitle}
            />
            {isImportSection ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
                <AppButton
                  className="min-w-16 whitespace-nowrap"
                  disabled={importCandidates.length === 0 || isImporting}
                  onClick={clearImportCandidates}
                  size="sm"
                  title="清空当前导入候选"
                  type="button"
                  variant="secondary"
                >
                  清空
                </AppButton>
                <AppButton
                  className="min-w-20 whitespace-nowrap"
                  disabled={!canConfirmImport}
                  onClick={confirmFolderImport}
                  size="sm"
                  title="导入已分类并人工确认的文件。"
                  type="button"
                >
                  {isImporting ? "导入中" : "导入"}
                </AppButton>
              </div>
            ) : null}
          </div>

          {isLibrarySection ? (
            <MediaStatsSummary
              aiGeneratedCount={aiGeneratedCount}
              brandAssetCount={brandAssetCount}
              draftCount={draftCount}
              finalCount={finalCount}
              productPhotoCount={productPhotoCount}
              skuCount={skuCount}
            />
          ) : null}

          {isAssetManagementSection ? (
            <MediaLibraryToolbar
              activeView={activeView}
              batchAssetUsageType={batchAssetUsageType}
              isAssetActionRunning={isAssetActionRunning}
              isLibrarySection={isLibrarySection || isBrandSection}
              isMissingFileListOpen={isMissingFileListOpen}
              isRecycleBinOpen={isRecycleBinOpen}
              listViewAssetCount={listViewAssets.length}
              onApplyBatchAssetUsageType={applyBatchAssetUsageType}
              onBatchDelete={batchDeleteSelectedAssets}
              onBatchDownload={batchDownloadAssets}
              onClearSelection={() => setSelectedAssetIds([])}
              onConfirmFinal={() => patchMedia("confirm-final", selectedAssetIds)}
              onPermanentDelete={permanentlyDeleteSelectedAssets}
              onResetFilters={resetFilters}
              onRestore={() => patchMedia("restore", selectedAssetIds)}
              onSearch={searchAssets}
              onSelectAllFiltered={() => toggleAllFilteredAssets(true)}
              onSelectListView={() => toggleListViewAssets(true)}
              onSetActiveView={setActiveLibraryView}
              searchInput={searchInput}
              selectedAssetCount={selectedAssetIds.length}
              setBatchAssetUsageType={setBatchAssetUsageType}
              setSearchInput={setSearchInput}
              setSourceFilter={setSourceFilterWithReset}
              setStatusFilter={setStatusFilterWithReset}
              setUsageTypeFilter={setUsageTypeFilterWithReset}
              sourceFilter={sourceFilter}
              statusFilter={statusFilter}
              usageTypeFilter={usageTypeFilter}
              visibleAssetCount={visibleAssetCount}
            />
          ) : null}

          {isImportSection ? (
          <AppCard className="p-5" style={{ order: -1 }}>
            <MediaImportToolbar
              brandFileInputRef={brandFileInputRef}
              folderInputRef={folderInputRef}
              brandOnly={isBrandSection}
              brandImportName={brandImportName}
              brands={brands}
              importMode={importMode}
              isClassifying={isClassifying}
              isImporting={isImporting}
              onClassifySelected={() => classifyCandidates(selectedImportCandidates)}
              onCreateVisionModel={addVisionModel}
              onScanFolder={scanImportFolder}
              onCreateBrand={handleCreateBrand}
              onSelectBrandFile={openBrandFilePicker}
              onSelectBrandFolder={openBrandFolderPicker}
              onSelectProductFolder={openProductFolderPicker}
              selectedImportCandidateCount={selectedImportCandidates.length}
              selectedVisionModel={selectedVisionModel}
              setBrandImportName={setBrandImportName}
              setSelectedVisionModel={setSelectedVisionModel}
              visionModelOptions={visionModelOptions}
            />

            {importError ? (
              <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {importError}
              </p>
            ) : null}

            {importCandidates.length > 0 ? (
              <MediaImportReviewPanel
                batchUsageType={batchUsageType}
                canConfirmImport={canConfirmImport}
                importCandidatesCount={importCandidates.length}
                importCompletedCount={importCompletedCount}
                importDuplicateCount={importDuplicateCount}
                importErrorCount={importErrorCount}
                importGroups={importGroups}
                importReviewFilter={importReviewFilter}
                importSkuCount={importSkuCount}
                isClassifying={isClassifying}
                lowConfidenceCount={lowConfidenceCount}
                onApplyBatchUsageType={applyBatchUsageType}
                onMarkBatchReviewed={markBatchReviewed}
                onMarkCandidateReviewed={markCandidateReviewed}
                onSetAllVisibleImportSelection={setAllVisibleImportSelection}
                onSetBatchUsageType={setBatchUsageType}
                onSetImportReviewFilter={setImportReviewFilter}
                onToggleGroupSelection={toggleImportGroupSelection}
                onToggleImportSelection={toggleImportSelection}
                onUpdateImportUsageType={updateImportUsageType}
                readySelectedImportCandidatesCount={readySelectedImportCandidates.length}
                selectedImportCandidatesCount={selectedImportCandidates.length}
                selectedImportIds={selectedImportIds}
                selectedImportNeedsReview={selectedImportNeedsReview}
              />
            ) : null}
          </AppCard>
          ) : null}

          {isAssetManagementSection && isLoading ? (
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <LoadingState key={index} />
              ))}
            </section>
          ) : null}

          {isAssetManagementSection && !isLoading && error ? (
            <AppCard className="border-red-100 bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-700">
                {t("media.loadErrorTitle")}
              </p>
              <p className="mt-2 text-sm text-red-600">{error}</p>
            </AppCard>
          ) : null}

          {successMessage ? (
            <AppCard className="border-green-100 bg-green-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-green-700">{successMessage}</p>
                <AppButton
                  onClick={() => setSuccessMessage("")}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  关闭
                </AppButton>
              </div>
            </AppCard>
          ) : null}

          {isAssetManagementSection && !isRecycleBinOpen && missingFileAssetIds.length > 0 ? (
            <AppCard className="border-red-100 bg-red-50 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-700">
                    检测到 {missingFileAssetIds.length} 个本地文件已删除或移动
                  </p>
                  <p className="mt-1 text-xs text-red-600">
                    请将图片放回 public/media 对应目录，或删除这些失效媒体记录后重新导入。
                  </p>
                </div>
                <AppButton
                  onClick={selectMissingAssets}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  选择缺失资产
                </AppButton>
              </div>
            </AppCard>
          ) : null}

          {isAssetManagementSection && !isLoading && !error && !selectedSkuGroup && filteredAssets.length === 0 ? (
            <EmptyState
              title={isBrandSection ? "暂无品牌资产" : t("media.emptyTitle")}
              description={isBrandSection ? "选择品牌并导入图片或 PDF 后，将在这里统一管理。" : t("media.emptyDescription")}
            />
          ) : null}

          {isAssetManagementSection && !isLoading && !error && (Boolean(selectedSkuGroup) || filteredAssets.length > 0) ? (
            <MediaLibraryViews
              activeView={activeView}
              areAllGroupAssetsSelected={areAllGroupAssetsSelected}
              assetGroups={assetGroups}
              currentMissingFilePage={currentMissingFilePage}
              isMissingFileListOpen={isMissingFileListOpen}
              listViewAssets={listViewAssets}
              listViewEnd={listViewEnd}
              listViewStart={listViewStart}
              listViewTotalCount={listViewTotalCount}
              missingFileAssetIds={missingFileAssetIds}
              missingFileTotalPages={missingFileTotalPages}
              onDeleteAsset={setAssetToDelete}
              onDownloadAsset={downloadAsset}
              onEditAsset={openEditAsset}
              onFinalizeAsset={(nextAsset) => void patchMedia("confirm-final", [nextAsset.id])}
              onPreviewAsset={setAssetToPreview}
              onReturnToAllList={() => {
                setIsMissingFileListOpen(false);
                setMissingFilePage(1);
              }}
              onSelectSkuGroup={setSelectedSkuGroupId}
              onSetMissingFilePage={setMissingFilePage}
              onToggleAssetSelection={toggleAssetSelection}
              onToggleGroupAssets={toggleGroupAssets}
              onToggleListViewAssets={toggleListViewAssets}
              selectedAssetIds={selectedAssetIds}
              selectedSkuGroup={selectedSkuGroup}
              selectedSkuVisibleGroup={selectedSkuVisibleGroup}
            />
          ) : null}

          <MediaAssetModals
            assetToDelete={assetToDelete}
            assetToEdit={assetToEdit}
            assetToPreview={assetToPreview}
            editAssetName={editAssetName}
            editAssetUsageType={editAssetUsageType}
            isAssetActionRunning={isAssetActionRunning}
            missingFileAssetIds={missingFileAssetIds}
            onCancelDelete={() => setAssetToDelete(null)}
            onCancelEdit={() => setAssetToEdit(null)}
            onClosePreview={() => setAssetToPreview(null)}
            onConfirmDelete={(asset) => void deleteMedia([asset.id])}
            onSaveEdit={saveAssetInfo}
            setEditAssetName={setEditAssetName}
            setEditAssetUsageType={setEditAssetUsageType}
          />
        </div>
      </main>
    </AppShell>
  );
}
