import { type ImportedMediaCandidate } from "./MediaImportReviewPanel";
import { type ImportedMediaUsageType, isBrandUsageType } from "./mediaAssetUtils";

export function canUseImportCandidateState(candidate: ImportedMediaCandidate) {
  return candidate.status !== "error" && candidate.status !== "duplicate";
}

export function getValidImportCandidates(candidates: ImportedMediaCandidate[]) {
  return candidates.filter(canUseImportCandidateState);
}

/**
 * Keep already-imported files at the end of each SKU group without changing
 * the original order within either group.
 */
export function sortImportCandidatesForReview(candidates: ImportedMediaCandidate[]) {
  return [
    ...candidates.filter((candidate) => candidate.status !== "duplicate"),
    ...candidates.filter((candidate) => candidate.status === "duplicate"),
  ];
}

export function getSelectedImportCandidates(
  candidates: ImportedMediaCandidate[],
  selectedIds: string[],
) {
  return getValidImportCandidates(candidates).filter((candidate) =>
    selectedIds.includes(candidate.id),
  );
}

export function getReadySelectedImportCandidates(
  selectedCandidates: ImportedMediaCandidate[],
) {
  return selectedCandidates.filter(
    (candidate) =>
      candidate.status === "ready" &&
      candidate.reviewStatus === "reviewed" &&
      Boolean(candidate.usageType) &&
      (candidate.classificationStatus === "classified" ||
        candidate.classificationSource === "manual"),
  );
}

export function selectedImportNeedsReview(selectedCandidates: ImportedMediaCandidate[]) {
  return selectedCandidates.some(
    (candidate) =>
      !candidate.usageType ||
      candidate.reviewStatus !== "reviewed" ||
      (candidate.classificationStatus !== "classified" &&
        candidate.classificationSource !== "manual"),
  );
}

export function getCanConfirmImport({
  isClassifying,
  isImporting,
  readySelectedCandidates,
  selectedCandidates,
}: {
  isClassifying: boolean;
  isImporting: boolean;
  readySelectedCandidates: ImportedMediaCandidate[];
  selectedCandidates: ImportedMediaCandidate[];
}) {
  return (
    selectedCandidates.length > 0 &&
    readySelectedCandidates.length === selectedCandidates.length &&
    !isImporting &&
    !isClassifying
  );
}

export function markDuplicateImportCandidates(
  candidates: ImportedMediaCandidate[],
  duplicateIds: Set<string>,
) {
  return candidates.map((candidate) =>
    duplicateIds.has(candidate.id)
      ? {
          ...candidate,
          classificationReason: "该文件已导入媒体库，确认导入时会自动跳过。",
          classificationSource: "unknown" as const,
          classificationStatus: "classified" as const,
          confidence: 1,
          error: "该文件已导入媒体库，已跳过。",
          reviewStatus: "reviewed" as const,
          status: "duplicate" as const,
        }
      : candidate,
  );
}

export function removeDuplicateImportSelections(
  selectedIds: string[],
  duplicateIds: Set<string>,
) {
  return selectedIds.filter((id) => !duplicateIds.has(id));
}

export function updateImportCandidateUsageType(
  candidates: ImportedMediaCandidate[],
  id: string,
  usageType: ImportedMediaUsageType,
) {
  return candidates.map((candidate) =>
    candidate.id === id && canUseImportCandidateState(candidate)
      ? {
          ...candidate,
          classificationSource: usageType ? "manual" as const : candidate.classificationSource,
          reviewStatus: "pending" as const,
          status: usageType ? "ready" as const : "pending" as const,
          usageType,
        }
      : candidate,
  );
}

export function applyBatchImportUsageType(
  candidates: ImportedMediaCandidate[],
  targetIds: Set<string>,
  usageType: ImportedMediaUsageType,
) {
  if (!usageType) {
    return candidates;
  }

  return candidates.map((candidate) =>
    targetIds.has(candidate.id) && canUseImportCandidateState(candidate)
      ? {
          ...candidate,
          classificationSource: "manual" as const,
          reviewStatus: "pending" as const,
          status: "ready" as const,
          usageType,
        }
      : candidate,
  );
}

export function markImportCandidatesReviewed(
  candidates: ImportedMediaCandidate[],
  targetIds: Set<string>,
) {
  return candidates.map((candidate) =>
    targetIds.has(candidate.id) &&
    candidate.usageType &&
    canUseImportCandidateState(candidate)
      ? {
          ...candidate,
          reviewStatus: "reviewed" as const,
        }
      : candidate,
  );
}

export function getClassifiableImportCandidates(candidates: ImportedMediaCandidate[]) {
  return candidates.filter(
    (candidate) =>
      canUseImportCandidateState(candidate) &&
      Boolean(candidate.file) &&
      candidate.usageType !== "reference" &&
      !isBrandUsageType(candidate.usageType),
  );
}
