import type {
  ProductFacts,
  VisualRule,
} from "@/lib/ai-workspace/types";

export type EditConstraintMemory = {
  platformConstraints: string[];
  productConstraints: string[];
  preservedVisualElements: string[];
  userNegativeConstraints: string[];
};

export type EditTurnSummary = {
  editIntent: string;
};

const defaultNegativeKeywords = [
  "不要",
  "不能",
  "禁止",
  "不允许",
  "不要出现",
  "不能出现",
];

export function buildConstraintMemory(input: {
  designIntent?: string;
  editTurns?: EditTurnSummary[];
  preserveExistingText?: boolean;
  productFacts: ProductFacts;
  visualRule?: VisualRule;
}): EditConstraintMemory {
  const userTexts = [
    input.designIntent,
    ...(input.editTurns ?? []).map((turn) => turn.editIntent),
  ].filter((value): value is string => Boolean(value?.trim()));
  const userNegativeConstraints = userTexts.filter((text) =>
    defaultNegativeKeywords.some((keyword) => text.includes(keyword)),
  );

  return {
    platformConstraints: [
      input.visualRule?.designObjective
        ? `遵守视觉规则：${input.visualRule.designObjective}`
        : "遵守当前平台视觉规则。",
      "不得出现虚假认证、夸大宣传或与商品无关的营销元素。",
    ],
    productConstraints: [
      `产品名称保持为：${input.productFacts.name}`,
      `SKU 保持为：${input.productFacts.sku}`,
      input.productFacts.brand ? `品牌保持为：${input.productFacts.brand}` : "",
      input.productFacts.material ? `材质保持为：${input.productFacts.material}` : "",
      input.productFacts.color ? `颜色保持为：${input.productFacts.color}` : "",
      input.productFacts.size ? `尺寸比例保持为：${input.productFacts.size}` : "",
      input.productFacts.accessories ? `配件保持为：${input.productFacts.accessories}` : "",
      input.productFacts.packaging ? `包装内容保持为：${input.productFacts.packaging}` : "",
      "不得改变产品结构、颜色、材质、品牌 Logo、配件数量和包装内容。",
    ].filter(Boolean),
    preservedVisualElements: [
      "未被本轮修改要求明确提到的区域保持不变。",
      "必须保留原图背景、环境、光影、景深、色调、画幅比例、文字排版和整体构图。",
      "如果原图包含森林、室内、桌面、白底、渐变、阴影或其他背景元素，除非用户明确要求修改背景，否则必须逐像素风格保持这些背景元素。",
      "主体产品、视角、透视关系和整体构图保持一致。",
      "不要重新设计整张图，不要替换背景，不要添加用户没有要求的新元素。",
      input.preserveExistingText !== false
        ? "原图中已经存在的品牌 Logo、中文标题、卖点文案、规格标签、图标说明、促销标识和排版元素默认保持不变。"
        : "",
    ].filter(Boolean),
    userNegativeConstraints:
      userNegativeConstraints.length > 0
        ? userNegativeConstraints
        : [
            "不要新增用户没有要求的文字、水印、Logo、人物或无关道具。",
            input.preserveExistingText !== false
              ? "不要删除、改写或重排原图已有文字、Logo、标签和版式，除非用户明确要求。"
              : "",
          ].filter(Boolean),
  };
}

function buildTextPreservationInstruction(preserveExistingText: boolean) {
  if (!preserveExistingText) {
    return "";
  }

  return [
    "Existing text and layout preservation:",
    "- Preserve all existing text, brand logos, Chinese titles, selling points, specification labels, icon captions, promotional badges, typography, and layout elements unless the current edit request explicitly asks to change or remove them.",
    "- Do not add new text unless requested, but do not remove existing text just because the prompt says not to add text.",
  ].join("\n");
}

export function buildImageEditPrompt(input: {
  constraintMemory: EditConstraintMemory;
  editIntent: string;
  editReferenceImageCount?: number;
  historySummary?: string;
  originalPrompt?: string;
  preserveExistingText?: boolean;
}) {
  const preserveExistingText = input.preserveExistingText !== false;

  return [
    "You are editing the provided image, not creating a brand new unrelated image.",
    "Apply only the current edit request.",
    "Do not redesign the whole image.",
    "Preserve the original background, environment, lighting, shadows, typography, layout, camera angle, product positions, canvas size, and all areas not explicitly mentioned by the current edit request.",
    "Do not remove, replace, simplify, whiten, blur, or restyle the background unless the current edit request explicitly asks to change the background.",
    buildTextPreservationInstruction(preserveExistingText),
    "",
    `Current edit request: ${input.editIntent}`,
    input.editReferenceImageCount
      ? `Additional reference images are provided for this edit. Use them only for the newly requested object or the specific area mentioned by the user. Do not copy unrelated objects, backgrounds, text, logos, camera angles, lighting, or composition from those reference images. Do not let reference images override the current image background or layout. Preserve existing text and logos in the current image unless the user asks to change them.`
      : "",
    input.historySummary ? `Previous edit history: ${input.historySummary}` : "",
    input.originalPrompt ? `Original generation prompt summary: ${input.originalPrompt}` : "",
    "",
    "Must preserve:",
    ...input.constraintMemory.productConstraints.map((item) => `- ${item}`),
    ...input.constraintMemory.platformConstraints.map((item) => `- ${item}`),
    ...input.constraintMemory.preservedVisualElements.map((item) => `- ${item}`),
    "",
    "Must avoid:",
    ...input.constraintMemory.userNegativeConstraints.map((item) => `- ${item}`),
    "",
    "Keep all unchanged areas as visually consistent as possible.",
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 3000);
}
