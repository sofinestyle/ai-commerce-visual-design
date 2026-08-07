import type {
  GeneratedImage,
  GeneratedImageQualityReview,
  PromptValidationResult,
  ReferenceImage,
  VisualRule,
} from "@/lib/ai-workspace/types";

type ReviewProductFacts = {
  accessories?: string;
  brand?: string;
  category?: string;
  color?: string;
  description?: string | null;
  material?: string;
  name?: string;
  packaging?: string;
  size?: string;
  tags?: unknown;
};

type ReviewInput = {
  actualImageModel?: string | null;
  attempt?: number;
  imageType?: string;
  images: GeneratedImage[];
  maxAttempts?: number;
  promptValidation?: PromptValidationResult | null;
  productFacts?: ReviewProductFacts;
  referenceImageCount: number;
  referenceImages?: Array<Partial<Pick<ReferenceImage, "id" | "type" | "url">>>;
  requestedImageCount: number;
  requestedImageModel?: string | null;
  theme?: string;
  visualRule?: VisualRule;
};

type ReviewCheck = GeneratedImageQualityReview["checks"][number];
type QualityDecision = Pick<
  GeneratedImageQualityReview,
  "attempt" | "decision" | "decisionReasons" | "failureTypes" | "maxAttempts" | "retryRecommended"
>;

function makeCheck(input: ReviewCheck): ReviewCheck {
  return input;
}

function getOverallStatus(
  checks: ReviewCheck[],
): GeneratedImageQualityReview["status"] {
  if (checks.some((check) => check.status === "fail" && check.severity === "critical")) {
    return "not_recommended";
  }

  if (checks.some((check) => check.status !== "pass")) {
    return "needs_review";
  }

  return "usable";
}

function scoreChecks(checks: ReviewCheck[]) {
  const score = checks.reduce((currentScore, check) => {
    if (check.status === "pass") {
      return currentScore;
    }

    if (check.severity === "critical") {
      return currentScore - 30;
    }

    if (check.severity === "warning") {
      return currentScore - 12;
    }

    return currentScore - 4;
  }, 100);

  return Math.max(0, Math.min(100, score));
}

function summarizeStatus(status: GeneratedImageQualityReview["status"]) {
  if (status === "usable") {
    return "本地基础检查通过，仍建议人工确认画面细节。";
  }

  if (status === "needs_review") {
    return "本地基础检查发现风险，建议人工复核后再使用。";
  }

  return "本地基础检查发现关键风险，不建议直接使用。";
}

function readAttempt(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.floor(value))
    : 1;
}

function failureTypeForCheck(check: ReviewCheck) {
  const map: Record<string, string> = {
    "accessory-boundary": "ACCESSORY_BOUNDARY_RISK",
    "brand-logo-reference": "LOGO_REFERENCE_MISSING",
    "candidate-count": "CANDIDATE_COUNT_MISMATCH",
    "image-returned": "IMAGE_PROVIDER_EMPTY_RESULT",
    "image-url": "IMAGE_URL_MISSING",
    "instrument-scale-positioning": "PRODUCT_SCALE_ERROR",
    "instrument-violin-structure": "PRODUCT_STRUCTURE_ERROR",
    "prompt-present": "PROMPT_MISSING",
    "prompt-validation": "PROMPT_FACT_ERROR",
    "reference-images": "REFERENCE_SELECTION_ERROR",
    "single-output-constraint": "PROMPT_CONSTRAINT_MISSING",
  };

  return map[check.id] || check.id.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function isNeedsInputFailure(check: ReviewCheck) {
  return check.id === "brand-logo-reference" && check.status === "fail";
}

function isRetryableCriticalFailure(check: ReviewCheck) {
  if (isNeedsInputFailure(check)) {
    return false;
  }

  return check.status === "fail" && check.severity === "critical";
}

function resolveMaxAttempts(input: {
  checks: ReviewCheck[];
  maxAttempts?: number;
  score: number;
}) {
  if (typeof input.maxAttempts === "number" && Number.isFinite(input.maxAttempts)) {
    return Math.max(1, Math.floor(input.maxAttempts));
  }

  if (input.checks.some(isNeedsInputFailure)) {
    return 1;
  }

  if (input.checks.some(isRetryableCriticalFailure)) {
    return 3;
  }

  if (input.score < 75) {
    return 2;
  }

  return 1;
}

function getDecisionReason(check: ReviewCheck) {
  return `${check.label}: ${check.message}`;
}

function decideQuality(input: {
  attempt?: number;
  checks: ReviewCheck[];
  maxAttempts?: number;
  score: number;
  status: GeneratedImageQualityReview["status"];
}): QualityDecision {
  const attempt = readAttempt(input.attempt);
  const maxAttempts = resolveMaxAttempts({
    checks: input.checks,
    maxAttempts: input.maxAttempts,
    score: input.score,
  });
  const failedOrWarningChecks = input.checks.filter((check) => check.status !== "pass");
  const failureTypes = uniqueStrings(failedOrWarningChecks.map(failureTypeForCheck));
  const needsInputChecks = input.checks.filter(isNeedsInputFailure);

  if (needsInputChecks.length > 0) {
    return {
      attempt,
      decision: "needs_input",
      decisionReasons: needsInputChecks.map(getDecisionReason),
      failureTypes,
      maxAttempts,
      retryRecommended: false,
    };
  }

  const retryableCriticalChecks = input.checks.filter(isRetryableCriticalFailure);
  const shouldRetry = retryableCriticalChecks.length > 0 || input.score < 75;

  if (shouldRetry) {
    const blockingChecks = retryableCriticalChecks.length > 0 ? retryableCriticalChecks : failedOrWarningChecks;

    if (attempt >= maxAttempts) {
      return {
        attempt,
        decision: "fail_stop",
        decisionReasons: blockingChecks.map(getDecisionReason),
        failureTypes,
        maxAttempts,
        retryRecommended: false,
      };
    }

    return {
      attempt,
      decision: "retry",
      decisionReasons: blockingChecks.map(getDecisionReason),
      failureTypes,
      maxAttempts,
      retryRecommended: true,
    };
  }

  if (input.status === "needs_review" || input.score < 85) {
    return {
      attempt,
      decision: "usable_with_caveats",
      decisionReasons: failedOrWarningChecks.map(getDecisionReason),
      failureTypes,
      maxAttempts,
      retryRecommended: false,
    };
  }

  return {
    attempt,
    decision: "pass",
    decisionReasons: [],
    failureTypes,
    maxAttempts,
    retryRecommended: false,
  };
}

function hasSingleImageConstraint(prompt: string) {
  return (
    /one standalone/i.test(prompt) &&
    /(no collage|do not create a collage|no split screen|single image)/i.test(prompt)
  );
}

function readPrompt(images: GeneratedImage[]) {
  return images[0]?.prompt || "";
}

function readProductText(facts?: ReviewProductFacts) {
  if (!facts) {
    return "";
  }

  return [
    facts.name,
    facts.category,
    facts.color,
    facts.size,
    facts.material,
    facts.accessories,
    facts.packaging,
    facts.description ?? "",
    typeof facts.tags === "string" ? facts.tags : JSON.stringify(facts.tags ?? ""),
  ]
    .filter(Boolean)
    .join(" ");
}

function isViolinProduct(facts?: ReviewProductFacts) {
  return /小提琴|violin/i.test(readProductText(facts));
}

function isMiniatureCraftProduct(facts?: ReviewProductFacts) {
  return /1\s*\/\s*64|64分之1|微缩|迷你|工艺|模型|摆件|陈列/i.test(
    readProductText(facts),
  );
}

function isFullSizeViolin(facts?: ReviewProductFacts) {
  const text = readProductText(facts);

  return /4\s*\/?\s*4|成人|全尺寸|44|full[-\s]?size/i.test(text) && !isMiniatureCraftProduct(facts);
}

function hasAccessoryFacts(facts?: ReviewProductFacts) {
  return Boolean(facts?.accessories?.trim());
}

function normalizedTaskText(input: ReviewInput) {
  return `${input.imageType ?? ""} ${input.theme ?? ""} ${input.visualRule?.theme ?? ""}`.toLowerCase();
}

function isSetContentTask(input: ReviewInput) {
  return /套装|配件|清单|set|bundle|contents|accessor/.test(normalizedTaskText(input));
}

function promptAllowsOrRequestsVisibleLogo(prompt: string) {
  if (
    /(?:use the logo reference|selected logo reference|provided logo reference|confirmed logo|must show.{0,24}logo|show.{0,24}visible logo|display.{0,24}logo|必须展示品牌 Logo|已加载品牌 Logo 原图)/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /(?:no verified logo reference|logo-free|unbranded|no added logo|no visible logo|不得生成 logo|不要展示 logo|无 logo|无Logo|无品牌字样|禁止新增 logo)/i.test(
      prompt,
    )
  ) {
    return false;
  }

  return /(?:must|use|show|display|include|visible|confirmed|selected|provided).{0,36}(?:logo|wordmark|brand mark|trademark|branded label)|(?:logo|wordmark|brand mark|trademark|branded label).{0,36}(?:reference|visible|allowed|provided|selected|source of truth)|(?:必须|展示|显示|使用|加载|可见).{0,16}(?:Logo|logo|品牌 Logo|品牌标识|品牌字样|商标)/i.test(
    prompt,
  );
}

function hasBrandLogoReference(input: ReviewInput) {
  return (input.referenceImages ?? []).some((image) =>
    /^(?:brand_logo|品牌 logo|品牌_logo)$/i.test(image.type || ""),
  );
}

function createBrandLogoReferenceCheck(input: ReviewInput): ReviewCheck {
  const prompt = readPrompt(input.images);
  const logoRequested = promptAllowsOrRequestsVisibleLogo(prompt);
  const logoReferencePresent = hasBrandLogoReference(input);

  if (!logoRequested) {
    return makeCheck({
      id: "brand-logo-reference",
      label: "Logo 真实资产",
      message: "Prompt 未要求展示可见 Logo，或已明确无 Logo/无品牌字样。",
      severity: "info",
      status: "pass",
    });
  }

  if (logoReferencePresent) {
    return makeCheck({
      id: "brand-logo-reference",
      label: "Logo 真实资产",
      message: "Prompt 要求可见 Logo，且已记录 brand_logo 真实参考图。",
      severity: "info",
      status: "pass",
    });
  }

  return makeCheck({
    id: "brand-logo-reference",
    label: "Logo 真实资产",
    message: "Prompt 要求或允许展示可见 Logo，但本次参考图未包含 brand_logo，存在模型自行生成伪 Logo/品牌字样风险。",
    severity: "critical",
    status: "fail",
  });
}

function createViolinStructureCheck(input: ReviewInput): ReviewCheck | null {
  if (!isViolinProduct(input.productFacts)) {
    return null;
  }

  const prompt = readPrompt(input.images).toLowerCase();
  const requiredParts = [
    { label: "琴头/弦轴", pattern: /scroll|peg|pegs|琴头|弦轴/ },
    { label: "指板", pattern: /fingerboard|指板/ },
    { label: "琴桥", pattern: /bridge|琴桥|马桥/ },
    { label: "四根连续琴弦", pattern: /four continuous strings|four strings|strings|琴弦/ },
    { label: "f 孔", pattern: /f[-\s]?holes|sound holes|f 孔|音孔/ },
    { label: "拉弦板", pattern: /tailpiece|拉弦板/ },
    { label: "琴身曲线/比例", pattern: /body curves|proportions|silhouette|琴身|比例|轮廓/ },
  ];
  const matched = requiredParts.filter((part) => part.pattern.test(prompt));

  if (matched.length >= 5) {
    return makeCheck({
      id: "instrument-violin-structure",
      label: "小提琴结构要求",
      message: `Prompt 已覆盖 ${matched.length}/${requiredParts.length} 项小提琴关键结构。`,
      severity: "info",
      status: "pass",
    });
  }

  return makeCheck({
    id: "instrument-violin-structure",
    label: "小提琴结构要求",
    message: `Prompt 仅覆盖 ${matched.length}/${requiredParts.length} 项小提琴关键结构，建议补充琴头/弦轴、指板、琴桥、四根琴弦、f 孔、拉弦板、琴身比例等准确性要求。`,
    severity: matched.length <= 2 ? "critical" : "warning",
    status: matched.length <= 2 ? "fail" : "warning",
  });
}

function createViolinScaleCheck(input: ReviewInput): ReviewCheck | null {
  if (!isViolinProduct(input.productFacts)) {
    return null;
  }

  const prompt = readPrompt(input.images).toLowerCase();

  if (isMiniatureCraftProduct(input.productFacts)) {
    if (/miniature|1\/64|not a full-size|display craft|scale model|微缩|工艺品|非全尺寸/.test(prompt)) {
      return makeCheck({
        id: "instrument-scale-positioning",
        label: "乐器尺寸定位",
        message: "Prompt 已明确 1/64 或微缩工艺品定位，降低误画成演奏乐器的风险。",
        severity: "info",
        status: "pass",
      });
    }

    return makeCheck({
      id: "instrument-scale-positioning",
      label: "乐器尺寸定位",
      message: "产品疑似 1/64 或微缩工艺品，但 Prompt 未明确非全尺寸演奏乐器，存在尺寸和使用场景误导风险。",
      severity: "critical",
      status: "fail",
    });
  }

  if (isFullSizeViolin(input.productFacts)) {
    if (/4\/4|full[-\s]?size|adult full-size|全尺寸|标准尺寸/.test(prompt)) {
      return makeCheck({
        id: "instrument-scale-positioning",
        label: "乐器尺寸定位",
        message: "Prompt 已明确 4/4 或全尺寸小提琴定位。",
        severity: "info",
        status: "pass",
      });
    }

    return makeCheck({
      id: "instrument-scale-positioning",
      label: "乐器尺寸定位",
      message: "产品事实包含 4/4 或全尺寸信号，但 Prompt 未明确尺寸定位，建议人工复核成图比例。",
      severity: "warning",
      status: "warning",
    });
  }

  return null;
}

function createAccessoryBoundaryCheck(input: ReviewInput): ReviewCheck | null {
  if (!hasAccessoryFacts(input.productFacts)) {
    return null;
  }

  const prompt = readPrompt(input.images).toLowerCase();
  const setTask = isSetContentTask(input);

  if (setTask) {
    if (/verified set contents|all and only|preserve quantities|accessory checklist|verified accessories/.test(prompt)) {
      return makeCheck({
        id: "accessory-boundary",
        label: "配件展示边界",
        message: "当前为套装/配件相关任务，Prompt 已要求按已验证配件清单展示。",
        severity: "info",
        status: "pass",
      });
    }

    return makeCheck({
      id: "accessory-boundary",
      label: "配件展示边界",
      message: "当前为套装/配件相关任务，但 Prompt 未明确“只展示已验证配件及数量”，存在漏画或新增配件风险。",
      severity: "warning",
      status: "warning",
    });
  }

  if (/show them only for set-content images|only when explicitly requested|do not show accessories|do not add unverified accessories|accessories are factual boundaries/.test(prompt)) {
    return makeCheck({
      id: "accessory-boundary",
      label: "配件展示边界",
      message: "当前非套装图，Prompt 已把配件作为事实边界并限制无依据展示。",
      severity: "info",
      status: "pass",
    });
  }

  return makeCheck({
    id: "accessory-boundary",
    label: "配件展示边界",
    message: "产品包含配件事实，但当前非套装图 Prompt 未明确配件展示边界，建议复核是否会无依据添加配件。",
    severity: "warning",
    status: "warning",
  });
}

function createInstrumentChecks(input: ReviewInput) {
  return [
    createViolinStructureCheck(input),
    createViolinScaleCheck(input),
    createAccessoryBoundaryCheck(input),
  ].filter((check): check is ReviewCheck => Boolean(check));
}

function createPromptConstraintCheck(images: GeneratedImage[]): ReviewCheck {
  const prompt = readPrompt(images);

  if (!prompt) {
    return makeCheck({
      id: "prompt-present",
      label: "Prompt 记录",
      message: "生成结果缺少 Prompt 记录，后续复盘难度较高。",
      severity: "warning",
      status: "warning",
    });
  }

  if (!hasSingleImageConstraint(prompt)) {
    return makeCheck({
      id: "single-output-constraint",
      label: "单图约束",
      message: "Prompt 中未检测到明确的单张完整画面与禁止拼图约束，需人工检查是否出现多宫格或分屏。",
      severity: "warning",
      status: "warning",
    });
  }

  return makeCheck({
    id: "single-output-constraint",
    label: "单图约束",
    message: "Prompt 已包含单张完整画面与禁止拼图/分屏类约束。",
    severity: "info",
    status: "pass",
  });
}

function createPromptValidationCheck(
  validation?: PromptValidationResult | null,
): ReviewCheck {
  if (!validation) {
    return makeCheck({
      id: "prompt-validation",
      label: "Prompt 语义校验",
      message: "未记录 Prompt 语义校验结果，建议人工复核商品事实、场景和文案。",
      severity: "warning",
      status: "warning",
    });
  }

  if (validation.valid) {
    return makeCheck({
      id: "prompt-validation",
      label: "Prompt 语义校验",
      message: `Prompt 语义校验通过，得分 ${validation.score}。`,
      severity: "info",
      status: "pass",
    });
  }

  return makeCheck({
    id: "prompt-validation",
    label: "Prompt 语义校验",
    message: `Prompt 语义校验未通过，得分 ${validation.score}，建议优先复核商品事实、参考图角色和可见文案。`,
    severity: validation.score < 70 ? "critical" : "warning",
    status: validation.score < 70 ? "fail" : "warning",
  });
}

export function reviewGeneratedImages(input: ReviewInput): GeneratedImageQualityReview {
  const checks: ReviewCheck[] = [
    input.images.length > 0
      ? makeCheck({
          id: "image-returned",
          label: "图片返回",
          message: `生图接口返回 ${input.images.length} 张图片。`,
          severity: "info",
          status: "pass",
        })
      : makeCheck({
          id: "image-returned",
          label: "图片返回",
          message: "生图接口没有返回图片。",
          severity: "critical",
          status: "fail",
        }),
    input.images.length === input.requestedImageCount
      ? makeCheck({
          id: "candidate-count",
          label: "候选数量",
          message: `返回数量与请求数量一致：${input.requestedImageCount} 张。`,
          severity: "info",
          status: "pass",
        })
      : makeCheck({
          id: "candidate-count",
          label: "候选数量",
          message: `请求 ${input.requestedImageCount} 张，实际返回 ${input.images.length} 张。`,
          severity: "warning",
          status: "warning",
        }),
    input.images.every((image) => Boolean(image.url))
      ? makeCheck({
          id: "image-url",
          label: "图片地址",
          message: "所有返回图片均包含可保存地址。",
          severity: "info",
          status: "pass",
        })
      : makeCheck({
          id: "image-url",
          label: "图片地址",
          message: "部分返回图片缺少可保存地址。",
          severity: "critical",
          status: "fail",
        }),
    input.actualImageModel
      ? makeCheck({
          id: "actual-image-model",
          label: "实际生图模型",
          message: `已记录实际生图模型：${input.actualImageModel}。`,
          severity: "info",
          status: "pass",
        })
      : makeCheck({
          id: "actual-image-model",
          label: "实际生图模型",
          message: "未记录实际生图模型，后续模型效果归因不完整。",
          severity: "warning",
          status: "warning",
        }),
    input.requestedImageModel && input.actualImageModel && input.requestedImageModel !== input.actualImageModel
      ? makeCheck({
          id: "image-model-match",
          label: "模型一致性",
          message: `请求模型为 ${input.requestedImageModel}，实际返回模型为 ${input.actualImageModel}，请确认供应商是否发生模型映射或回退。`,
          severity: "warning",
          status: "warning",
        })
      : makeCheck({
          id: "image-model-match",
          label: "模型一致性",
          message: "请求生图模型与实际记录一致，或未发现可判定的模型映射差异。",
          severity: "info",
          status: "pass",
        }),
    input.referenceImageCount > 0
      ? makeCheck({
          id: "reference-images",
          label: "参考图记录",
          message: `本次记录 ${input.referenceImageCount} 张参考图作为输入来源。`,
          severity: "info",
          status: "pass",
        })
      : makeCheck({
          id: "reference-images",
          label: "参考图记录",
          message: "本次没有记录参考图输入；如本任务依赖产品结构或 Logo，请人工确认是否遗漏。",
          severity: "warning",
          status: "warning",
        }),
    createPromptValidationCheck(input.promptValidation),
    createPromptConstraintCheck(input.images),
    createBrandLogoReferenceCheck(input),
    ...createInstrumentChecks(input),
  ];
  const score = scoreChecks(checks);
  const status = getOverallStatus(checks);
  const decision = decideQuality({
    attempt: input.attempt,
    checks,
    maxAttempts: input.maxAttempts,
    score,
    status,
  });

  return {
    ...decision,
    checks,
    generatedTime: new Date().toISOString(),
    reviewer: "local-heuristic-v1",
    score,
    status,
    summary: summarizeStatus(status),
  };
}
