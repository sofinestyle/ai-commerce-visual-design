import type {
  ImageCopyCandidate,
  ProductMarketingAnalysis,
} from "@/lib/ai-workspace/types";
import type { ProductCopyFactSummary } from "@/lib/ai-workspace/productMarketingAnalysisService";

export type RawImageCopyCandidate = Pick<
  ImageCopyCandidate,
  | "angle"
  | "audience"
  | "confidence"
  | "evidence"
  | "headline"
  | "inferenceLevel"
  | "positioning"
  | "rationale"
  | "sellingPoints"
  | "subheadline"
>;

export type RejectedImageCopyCandidate = {
  candidate: RawImageCopyCandidate;
  reasons: string[];
};

type CandidateQualityResult = {
  accepted: boolean;
  candidate: RawImageCopyCandidate;
  qualityScore: number;
  warnings: string[];
  rejectionReasons: string[];
};

type SimilarCandidate = {
  item: CandidateQualityResult;
  reasons: string[];
};

const layoutContaminationPatterns: Array<[RegExp, string]> = [
  [/(?:完整|整个|商品|琴身).{0,8}(?:居中|中心).{0,8}(?:展示|呈现|摆放)/i, "包含居中构图说明"],
  [/(?:居中|中心).{0,8}(?:展示|呈现|摆放)/i, "包含居中构图说明"],
  [/(?:清晰可见|一目了然|一图看清|一眼看清)/i, "描述画面可见性而非商品价值"],
  [/(?:同框|分组|整齐|集中|逐项).{0,8}(?:展示|呈现|陈列|摆放)/i, "包含陈列或展示说明"],
  [/(?:套装|商品|产品|材质|配置).{0,8}(?:呈现|展示)(?:更|得)?(?:完整|清楚|直观)?/i, "使用展示或呈现状态代替商品卖点"],
  [/(?:画面|构图|排版|留白|棚拍|摄影背景|背景虚化|左上|右上|左下|右下)/i, "包含画面、摄影或排版说明"],
  [/(?:主体占比|视觉中心|产品占比|字体|字号|光线落在)/i, "包含视觉执行说明"],
];

const severeClaimPatterns: Array<[RegExp, string]> = [
  [/(?:权威|官方|国际|国家级).{0,8}(?:认证|奖项|认可)/i, "包含未验证认证或奖项"],
  [/(?:销量|排名|全网).{0,8}(?:第一|领先|冠军)/i, "包含未验证销量或排名"],
  [/(?:保证|承诺).{0,12}(?:学会|效果|音色|提升|改善)/i, "包含效果保证"],
  [/(?:提升|改善|增加|降低)\s*\d+\s*%/i, "包含未验证量化效果"],
  [/(?:医疗|治疗|矫正|康复)/i, "包含医疗或矫正声明"],
  [/(?:比赛级|大师级|收藏级|专业演奏级)/i, "包含未验证产品等级"],
];

const materialTokens = [
  "实木",
  "夹板",
  "云杉",
  "枫木",
  "乌木",
  "碳纤维",
  "碳纤",
  "铝镁合金",
  "塑料",
  "金属",
  "solid wood",
  "spruce",
  "maple",
  "ebony",
  "carbon fiber",
  "aluminum-magnesium",
  "plastic",
  "metal",
];
const accessoryTokens = [
  "琴盒",
  "木盒",
  "琴弓",
  "琴弦",
  "松香",
  "肩托",
  "支架",
  "指板贴",
  "马桥",
  "琴码",
  "调音器",
  "弱音器",
  "擦琴布",
  "case",
  "bow",
  "strings",
  "rosin",
  "shoulder rest",
  "fingerboard sticker",
  "bridge",
  "tuner",
  "mute",
  "cleaning cloth",
  "manual",
];
const colorTokens = [
  "黑色",
  "白色",
  "棕色",
  "红色",
  "蓝色",
  "绿色",
  "粉色",
  "原木色",
  "black",
  "white",
  "brown",
  "red",
  "blue",
  "green",
  "pink",
  "yellow-green",
  "natural",
];
const shopperBenefitPatterns = [
  /(?:省心|方便|减少|无需|一套|配齐|更齐|入门|初学|练习|日常|适合|从容|价值|好选择|之选|开启|开始|收纳|易用|安心)/i,
  /\b(?:ready|easy|easier|faster|less hassle|value|essentials|everything|all[-\s]?in[-\s]?one|beginner|starter|practice|daily|setup|growing|standout|confidence|convenient)\b/i,
];
const bareParameterPatterns = [
  /\b\d+\s*\/\s*\d+\b/i,
  /\b(?:full[-\s]?size|standard size|spruce top|maple back|ebony fittings?|yellow[-\s]?green finish|accessories included|case included|solid wood body|solid wood|black finish|brown finish|glossy finish)\b/i,
  /(?:全尺寸|标准尺寸|规格|尺寸|材质|实木|云杉|枫木|乌木|碳纤|铝镁合金|黑色|白色|棕色|红色|蓝色|绿色|黄绿色|亮光|哑光)/i,
];
const truncatedEnglishTailPattern =
  /\b(?:mor|togethe|separat|routi|practi|preparati|compar|guid|pairin|setu|polish|specia|choos|focus|includ|essentia|comfortabl|meanin|regula|maintenan|confiden|beginn|learnin)\b$/i;

function normalizeText(value: string) {
  return value.replace(/\s+/g, "").toLocaleLowerCase();
}

function visibleCandidateText(candidate: RawImageCopyCandidate) {
  return [
    candidate.headline,
    candidate.subheadline,
    ...(candidate.sellingPoints ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function hasShopperBenefitLanguage(text: string) {
  return shopperBenefitPatterns.some((pattern) => pattern.test(text));
}

function tokenIssueForBarePoint(
  point: string,
  tokens: string[],
  label: string,
) {
  const normalized = normalizeText(point);
  const matchedTokens = tokens.filter((token) =>
    normalized.includes(normalizeText(token)),
  );

  if (matchedTokens.length === 0) {
    return null;
  }

  return `卖点“${point}”只是${label}事实，缺少消费者利益`;
}

function findBareParameterSellingPoints(candidate: RawImageCopyCandidate) {
  const issues: string[] = [];
  const sellingPoints = candidate.sellingPoints ?? [];

  for (const point of sellingPoints) {
    const trimmedPoint = point.trim();

    if (!trimmedPoint || hasShopperBenefitLanguage(trimmedPoint)) {
      continue;
    }

    const tokenIssue =
      tokenIssueForBarePoint(trimmedPoint, materialTokens, "材质") ??
      tokenIssueForBarePoint(trimmedPoint, accessoryTokens, "配件") ??
      tokenIssueForBarePoint(trimmedPoint, colorTokens, "颜色");

    if (tokenIssue) {
      issues.push(tokenIssue);
      continue;
    }

    if (bareParameterPatterns.some((pattern) => pattern.test(trimmedPoint))) {
      issues.push(`卖点“${trimmedPoint}”偏参数标签，缺少消费者利益`);
    }
  }

  return uniqueStrings(issues);
}

function countHanCharacters(value: string) {
  return [...value.matchAll(/[\u3400-\u9fff]/g)].length;
}

function countEnglishWords(value: string) {
  return [...value.matchAll(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g)].length;
}

function isMostlyAlphabetic(value: string) {
  const letters = [...value.matchAll(/[A-Za-z]/g)].length;
  const han = countHanCharacters(value);

  return letters > 0 && han === 0;
}

function findSellingPointLengthIssues(candidate: RawImageCopyCandidate) {
  const issues: string[] = [];

  for (const point of candidate.sellingPoints ?? []) {
    const trimmedPoint = point.trim();

    if (!trimmedPoint) {
      continue;
    }

    const hanCount = countHanCharacters(trimmedPoint);

    if (hanCount > 0 && hanCount > 12) {
      issues.push(`卖点“${trimmedPoint}”超过12个汉字，主图移动端过长`);
    }

    if (!isMostlyAlphabetic(trimmedPoint)) {
      continue;
    }

    const characterCount = Array.from(trimmedPoint).length;
    const wordCount = countEnglishWords(trimmedPoint);

    if (characterCount > 40) {
      issues.push(`卖点“${trimmedPoint}”超过40个英文字符，主图移动端过长`);
    }

    if (wordCount > 6) {
      issues.push(`卖点“${trimmedPoint}”超过6个英文词，主图移动端过长`);
    }

    if (truncatedEnglishTailPattern.test(trimmedPoint)) {
      issues.push(`卖点“${trimmedPoint}”疑似被截断，不可用于主图`);
    }
  }

  return uniqueStrings(issues);
}

function findMainCopyLengthIssues(candidate: RawImageCopyCandidate) {
  const issues: string[] = [];
  const fields = [
    {
      englishCharacterLimit: 40,
      fieldLabel: "主标题",
      hanLimit: 20,
      value: candidate.headline,
    },
    {
      englishCharacterLimit: 60,
      fieldLabel: "副标题",
      hanLimit: 24,
      value: candidate.subheadline,
    },
  ];

  for (const field of fields) {
    const text = field.value?.trim();

    if (!text) {
      continue;
    }

    const hanCount = countHanCharacters(text);

    if (hanCount > 0 && hanCount > field.hanLimit) {
      issues.push(
        `${field.fieldLabel}“${text}”超过${field.hanLimit}个汉字，主图移动端过长`,
      );
    }

    if (
      isMostlyAlphabetic(text) &&
      Array.from(text).length > field.englishCharacterLimit
    ) {
      issues.push(
        `${field.fieldLabel}“${text}”超过${field.englishCharacterLimit}个英文字符，主图移动端过长`,
      );
    }
  }

  return uniqueStrings(issues);
}

function findPatternIssues(
  text: string,
  patterns: Array<[RegExp, string]>,
) {
  return uniqueStrings(
    patterns
      .filter(([pattern]) => pattern.test(text))
      .map(([, issue]) => issue),
  );
}

function findUnsupportedKnownTokens(
  text: string,
  sourceText: string,
  tokens: string[],
  label: string,
) {
  return tokens
    .filter((token) => text.includes(token) && !sourceText.includes(token))
    .map((token) => `出现未确认${label}“${token}”`);
}

function findSizeConflicts(
  text: string,
  summary: ProductCopyFactSummary,
) {
  const issues: string[] = [];
  const fractions = [...text.matchAll(/\b(\d+\s*\/\s*\d+)\b/g)].map(
    (match) => match[1].replace(/\s+/g, ""),
  );

  if (
    summary.normalizedSize &&
    fractions.some((fraction) => fraction !== summary.normalizedSize)
  ) {
    issues.push("文案尺寸与已确认尺寸不一致");
  }

  if (
    summary.typeSignals.miniatureCraft.length > 0 &&
    /标准尺寸|全尺寸|入门|初学|练习小提琴|可演奏/.test(text)
  ) {
    issues.push("微缩工艺品被错误描述为标准尺寸或入门演奏乐器");
  }

  return issues;
}

function findPositioningConflicts(
  text: string,
  analysis: ProductMarketingAnalysis,
) {
  if (
    /入门|初学/.test(text) &&
    !/入门|初学|普及/.test(
      `${analysis.marketPositioning} ${analysis.targetAudiences
        .map((item) => item.statement)
        .join(" ")}`,
    )
  ) {
    return ["文案使用入门或初学定位，但产品营销分析未支持该定位"];
  }

  return [];
}

function buildSourceText(summary: ProductCopyFactSummary) {
  return normalizeText(
    [
      summary.productName,
      summary.brand,
      summary.category,
      summary.color,
      summary.normalizedSize,
      summary.description,
      ...summary.materialFacts,
      ...summary.accessoryFacts,
      ...summary.packagingFacts,
      ...summary.sellingPointFacts,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function softWarnings(
  text: string,
  summary: ProductCopyFactSummary,
  candidate: RawImageCopyCandidate,
  analysis: ProductMarketingAnalysis,
) {
  const warnings: string[] = [];

  if (
    /完整套装|全套配齐|一套配齐|一应俱全/.test(text) &&
    summary.accessoryFacts.length < 3
  ) {
    warnings.push("“完整套装”表达较强，请结合实际配件人工确认");
  }

  if (/开箱即用|无需准备|立即演奏/.test(text)) {
    warnings.push("即时使用表达可能涉及安装、调音或准备条件，请人工确认");
  }

  if (/甄选|精选|精工|高品质|品质感|耐用|稳固|易调音/.test(text)) {
    warnings.push("包含主观品质或性能表达，请人工审核");
  }

  if (candidate.inferenceLevel === "creative") {
    warnings.push("包含 AI 创意表达，请在用于主图前人工审核");
  }

  if (candidate.confidence === "low") {
    warnings.push("该候选置信度较低，请重点审核推导是否适合商品");
  }

  if (
    candidate.inferenceLevel !== "fact" &&
    [
      ...analysis.targetAudiences,
      ...analysis.useCases,
      ...analysis.valuePillars,
    ].some((item) => item.reviewRequired)
  ) {
    warnings.push("包含基于产品信号推导的人群、场景或价值，请人工审核");
  }

  return uniqueStrings(warnings);
}

function scoreCandidate(
  candidate: RawImageCopyCandidate,
  warnings: string[],
) {
  let score = 55;
  const evidenceCount = candidate.evidence?.length ?? 0;
  const sellingPointCount = candidate.sellingPoints?.length ?? 0;
  const visibleLength = Array.from(visibleCandidateText(candidate)).length;

  score += Math.min(evidenceCount, 4) * 4;
  score += sellingPointCount >= 3 ? 6 : 0;
  score += candidate.positioning ? 5 : 0;
  score += candidate.audience ? 3 : 0;
  score += candidate.inferenceLevel === "supported" ? 4 : 0;
  score += candidate.inferenceLevel === "fact" ? 3 : 0;
  score += candidate.inferenceLevel === "creative" ? 2 : 0;
  score += candidate.confidence === "high" ? 4 : 0;
  score += visibleLength >= 12 && visibleLength <= 100 ? 3 : 0;
  score -= warnings.length * 4;

  return Math.max(0, Math.min(100, score));
}

export function evaluateImageCopyCandidate(input: {
  analysis: ProductMarketingAnalysis;
  candidate: RawImageCopyCandidate;
  summary: ProductCopyFactSummary;
}): CandidateQualityResult {
  const text = normalizeText(visibleCandidateText(input.candidate));
  const sourceText = buildSourceText(input.summary);
  const rejectionReasons = uniqueStrings([
    ...findPatternIssues(text, layoutContaminationPatterns),
    ...findPatternIssues(text, severeClaimPatterns),
    ...findUnsupportedKnownTokens(
      text,
      sourceText,
      materialTokens,
      "材质",
    ),
    ...findUnsupportedKnownTokens(
      text,
      sourceText,
      accessoryTokens,
      "配件",
    ),
    ...findUnsupportedKnownTokens(text, sourceText, colorTokens, "颜色"),
    ...findSizeConflicts(text, input.summary),
    ...findPositioningConflicts(text, input.analysis),
    ...findBareParameterSellingPoints(input.candidate),
    ...findMainCopyLengthIssues(input.candidate),
    ...findSellingPointLengthIssues(input.candidate),
  ]);
  const warnings = softWarnings(
    text,
    input.summary,
    input.candidate,
    input.analysis,
  );

  return {
    accepted: rejectionReasons.length === 0,
    candidate: input.candidate,
    qualityScore: scoreCandidate(input.candidate, warnings),
    rejectionReasons,
    warnings,
  };
}

function candidateIdentity(candidate: RawImageCopyCandidate) {
  return normalizeText(
    `${candidate.headline}|${candidate.subheadline ?? ""}`,
  );
}

function candidateSimilarityText(candidate: RawImageCopyCandidate) {
  return normalizeText(
    [
      candidate.angle,
      candidate.headline,
      candidate.subheadline,
      ...(candidate.sellingPoints ?? []),
    ]
      .filter(Boolean)
      .join("|"),
  );
}

function overlapRatio(left: string, right: string) {
  const leftTokens = new Set(Array.from(left));
  const rightTokens = new Set(Array.from(right));

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  const overlap = [...leftTokens].filter((token) =>
    rightTokens.has(token),
  ).length;

  return overlap / Math.min(leftTokens.size, rightTokens.size);
}

export function rankImageCopyCandidates(input: {
  analysis: ProductMarketingAnalysis;
  candidates: RawImageCopyCandidate[];
  summary: ProductCopyFactSummary;
}) {
  const seen = new Set<string>();
  const accepted: CandidateQualityResult[] = [];
  const similar: SimilarCandidate[] = [];
  const rejected: RejectedImageCopyCandidate[] = [];

  for (const candidate of input.candidates) {
    const identity = candidateIdentity(candidate);

    if (!identity || seen.has(identity)) {
      rejected.push({
        candidate,
        reasons: ["标题与副标题重复"],
      });
      continue;
    }

    seen.add(identity);
    const quality = evaluateImageCopyCandidate({
      analysis: input.analysis,
      candidate,
      summary: input.summary,
    });

    if (!quality.accepted) {
      rejected.push({
        candidate,
        reasons: quality.rejectionReasons,
      });
      continue;
    }

    accepted.push(quality);
  }

  const sorted = accepted.toSorted(
    (left, right) => right.qualityScore - left.qualityScore,
  );
  const diverse: CandidateQualityResult[] = [];

  for (const item of sorted) {
    const similarityReasons = findSimilarityReasons(item, diverse);

    if (similarityReasons.length > 0) {
      similar.push({
        item,
        reasons: similarityReasons,
      });
      continue;
    }

    diverse.push(item);

    if (diverse.length === 3) {
      break;
    }
  }

  if (diverse.length < 3) {
    for (const candidate of similar) {
      diverse.push({
        ...candidate.item,
        warnings: uniqueStrings([
          ...candidate.item.warnings,
          ...candidate.reasons,
        ]),
      });

      if (diverse.length === 3) {
        break;
      }
    }
  }

  for (const candidate of similar) {
    if (diverse.some((item) => item.candidate === candidate.item.candidate)) {
      continue;
    }

    rejected.push({
      candidate: candidate.item.candidate,
      reasons: candidate.reasons,
    });
  }

  return {
    accepted: diverse,
    rejected,
  };
}

function findSimilarityReasons(
  item: CandidateQualityResult,
  selected: CandidateQualityResult[],
) {
  const similarityText = candidateSimilarityText(item.candidate);
  const reasons: string[] = [];

  for (const existing of selected) {
    if (
      normalizeText(existing.candidate.angle ?? "") ===
      normalizeText(item.candidate.angle ?? "")
    ) {
      reasons.push("与更高分候选角度相同，请人工确认是否保留。");
    }

    if (
      overlapRatio(
        similarityText,
        candidateSimilarityText(existing.candidate),
      ) > 0.9
    ) {
      reasons.push("与更高分候选表达较接近，请人工确认是否需要重新生成。");
    }
  }

  return uniqueStrings(reasons);
}
