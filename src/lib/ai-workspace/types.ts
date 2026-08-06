export type Platform = "Amazon" | "TEMU" | "SHEIN" | "天猫" | "抖店" | "独立站";

export type PlatformRulePlatform = "跨境货架平台" | "内容与自营平台";

export type ImageType = "主图" | "详情页";

export type OutputLanguageCode = "zh-CN" | "en" | "ja" | "es" | "fr";

export type OutputLanguage = {
  code: OutputLanguageCode;
  label: "中文" | "英文" | "日文" | "西班牙语" | "法语";
  promptName: string;
  visibleTextInstruction: string;
};

export type ProductFacts = {
  id: string;
  sku: string;
  name: string;
  brand?: string;
  category?: string;
  material?: string;
  color?: string;
  size?: string;
  accessories?: string;
  packaging?: string;
  supplier?: string;
  costPrice?: string;
  sellingPoints?: string;
  description?: string | null;
  tags?: unknown;
};

export type ReferenceImage = {
  id: string;
  url: string;
  type?: string;
  status?: string;
  qualityScore?: number | null;
};

export type OutputSpecification = {
  platform: Platform;
  imageType: ImageType;
  theme: string;
  imageCount: number;
  outputSize?: string;
  aspectRatio?: string;
  language?: OutputLanguage;
};

export type VisualRule = {
  ruleId: string;
  theme: string;
  designObjective: string;
  visualSpecification: Record<string, string>;
  mediaGuidance: {
    primary: string[];
    secondary: string[];
  };
  promptGuidance: {
    focus: string[];
    avoid: string[];
  };
  mediaSelection?: {
    required: boolean;
    minCount: number;
    maxCount: number;
    primaryTypes: string[];
    secondaryTypes: string[];
    selectionStrategy: string;
    missingBehavior: string;
  };
  source?: "default" | "custom";
  status?: "enabled" | "disabled" | "draft";
  baselineComparison?: VisualRuleBaselineComparison;
};

export type VisualRuleBaselineComparison = {
  baselineSource: "sop";
  currentSource: "default" | "custom";
  differences: Array<{
    baselineValue: string;
    currentValue: string;
    effectiveValue: string;
    field: string;
    label: string;
  }>;
  hasDifferences: boolean;
  summary: string;
};

export type VisibleCopy = {
  enabled: boolean;
  headline?: string;
  subheadline?: string;
  sellingPoints?: string[];
  placementHint?: string;
  source?: "model" | "edited" | "manual";
  model?: string;
  candidateId?: string;
};

export type SemanticValue = {
  englishText?: string;
  sourceText: string;
  translationStatus: "not-needed" | "translated" | "unresolved";
};

export type PromptSemanticPlan = {
  compliance: {
    avoid: string[];
    background: "flexible" | "pure-white";
    copySpace: string;
    focus: string[];
    logo: "allowed" | "forbidden" | "limited";
    productRatio?: string;
  };
  imageTypeProfile: {
    avoid: string[];
    required: string[];
    theme: string;
  };
  product: {
    accessories: SemanticValue[];
    brand?: SemanticValue;
    category?: SemanticValue;
    color?: SemanticValue;
    materials: SemanticValue[];
    name: SemanticValue;
    packaging?: SemanticValue;
    size?: SemanticValue;
    visualSemantics: string[];
  };
  references: {
    count: number;
    roles: Array<{
      index: number;
      type: string;
      usage: "accessory" | "accuracy" | "logo" | "scene";
    }>;
  };
  scene: {
    englishText?: string;
    sourceText: string;
    translationStatus: SemanticValue["translationStatus"];
  };
  task: {
    aspectRatio?: string;
    outputSize?: string;
    singleStandaloneImage: true;
    visibleCopyLanguage: string;
  };
  visibleCopy?: VisibleCopy;
};

export type PromptValidationResult = {
  duplicateConstraints: string[];
  genericPlaceholders: string[];
  invalidVisibleCopy: string[];
  missingFacts: string[];
  missingSceneElements: string[];
  referenceRoleIssues: string[];
  score: number;
  valid: boolean;
};

export type MarketingInference = {
  statement: string;
  evidence: string[];
  confidence: "high" | "medium" | "low";
  reviewRequired: boolean;
};

export type CopyAngle = {
  id: string;
  label: string;
  reason: string;
};

export type ProductMarketingAnalysis = {
  productType: string;
  marketPositioning: string;
  targetAudiences: MarketingInference[];
  useCases: MarketingInference[];
  valuePillars: MarketingInference[];
  recommendedAngles: CopyAngle[];
  hardFactBoundaries: string[];
  highRiskClaims: string[];
  confidence: "high" | "medium" | "low";
  source: "model" | "fallback";
  model: string;
  fallbackReason?: string;
  userAdjusted?: boolean;
};

export type ImageCopyCandidate = {
  id: string;
  angle?: string;
  headline: string;
  subheadline?: string;
  sellingPoints?: string[];
  placementHint: string;
  styleHint?: string;
  rationale: string;
  positioning?: string;
  audience?: string;
  evidence?: string[];
  inferenceLevel?: "fact" | "supported" | "creative";
  confidence?: "high" | "medium" | "low";
  qualityScore?: number;
  warnings?: string[];
  model: string;
  modelLabel: string;
  generatedTime: string;
  source: "model";
};

export type ImageCopyGenerationResult = {
  analysis: ProductMarketingAnalysis;
  candidates: ImageCopyCandidate[];
};

export type DesignIntentCandidate = {
  id: string;
  title: string;
  content: string;
  rationale: string;
  model: string;
  modelLabel: string;
  generatedTime: string;
  source: "model";
};

export type GenerationContext = {
  productFacts: ProductFacts;
  referenceImages: ReferenceImage[];
  visualRule: VisualRule;
  platform: Platform;
  imageType: ImageType;
  theme: string;
  designIntent: string;
  visibleCopy?: VisibleCopy;
  language: OutputLanguage;
  outputSpecification: OutputSpecification;
};

export type PromptResult = {
  chinesePromptSummary: string;
  englishPrompt: string;
  generatedTime?: string;
  id?: string;
  apiModel?: string;
  promptModel?: string;
  promptModelLabel?: string;
  source?: "fallback" | "model";
  fallbackReason?: string;
  promptValidation?: PromptValidationResult;
};

export type GeneratedImage = {
  id: string;
  url: string;
  prompt: string;
  model: string;
  mediaId?: string;
  mediaStatus?: "temporary" | "draft" | "final";
  editSessionId?: string;
  parentImageId?: string;
  qualityReview?: GeneratedImageQualityReview;
};

export type GeneratedImageQualityReview = {
  checks: Array<{
    id: string;
    label: string;
    message: string;
    severity: "info" | "warning" | "critical";
    status: "pass" | "warning" | "fail";
  }>;
  generatedTime: string;
  reviewer: "local-heuristic-v1";
  score: number;
  status: "usable" | "needs_review" | "not_recommended";
  summary: string;
};

export type GenerationRecord = {
  actualImageModel?: string | null;
  archivedMediaIds?: string[];
  generatedTime: string;
  generationProtocol?: unknown;
  imageCount: number;
  imageModel?: string | null;
  outputSpecification: {
    aspectRatio?: string | null;
    outputSize?: string | null;
  };
  platform: string;
  prompt?: {
    actualModel?: string | null;
    fallbackReason?: string | null;
    requestedModel?: string | null;
    source?: "builder" | "llm";
    validation?: PromptValidationResult | null;
  };
  promptValidation?: PromptValidationResult | null;
  qualityReview?: GeneratedImageQualityReview;
  referenceImageCount?: number;
  referenceImagesUsed?: unknown[];
  requestedImageModel?: string | null;
  theme?: string | null;
  visualRuleId?: string | null;
};

export type GenerationResult = {
  taskId: string;
  status: string;
  images: GeneratedImage[];
  generationGroupId?: string;
  generationRecord?: GenerationRecord;
  historyConsistency?: {
    issues: Array<{
      id: string;
      message: string;
      severity: "warning" | "critical";
    }>;
    score: number;
    status: "consistent" | "needs_review" | "broken";
    summary: string;
  };
  generatedMediaIds?: string[];
  archivedMediaIds?: string[];
  editRecord?: {
    editIntent: string;
    editPrompt: string;
    editSessionId: string;
    generatedTime: string;
    parentImageId?: string | null;
  };
};
