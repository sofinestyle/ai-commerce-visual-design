import { containsCjk } from "@/lib/ai-workspace/promptEnglishNormalizer";
import { buildPromptSemanticPlan } from "@/lib/ai-workspace/promptSemanticPlan";
import type {
  GenerationContext,
  PromptSemanticPlan,
  PromptValidationResult,
  SemanticValue,
} from "@/lib/ai-workspace/types";
import { normalizeVisibleCopy } from "@/lib/ai-workspace/visibleCopyPolicy";

const requiredHeadings = [
  "Task:",
  "Product Accuracy:",
  "Effective Scene Direction:",
  "Visible Copy:",
  "Compliance Constraints:",
];

const genericPlaceholderPatterns = [
  /verified product(?! facts)/i,
  /verified product color/i,
  /verified product materials/i,
  /approved scene direction as a clean, realistic, product-first commercial setting/i,
];

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function includesLoose(prompt: string, value?: string) {
  const text = value?.trim();

  if (!text) {
    return true;
  }

  return normalize(prompt).includes(normalize(text));
}

function validateSemanticValue(
  prompt: string,
  value: SemanticValue | undefined,
  label: string,
  missingFacts: string[],
) {
  if (!value) {
    return;
  }

  const expected = value.englishText && !containsCjk(value.englishText)
    ? value.englishText
    : value.sourceText;

  if (!includesLoose(prompt, expected)) {
    missingFacts.push(label);
  }
}

function validateVisibleCopy(
  prompt: string,
  context: GenerationContext,
  invalidVisibleCopy: string[],
) {
  const visibleCopy = normalizeVisibleCopy(
    context.visibleCopy,
    context.visualRule,
  );

  if (!visibleCopy?.enabled) {
    return;
  }

  for (const [label, value] of [
    ["headline", visibleCopy.headline],
    ["subheadline", visibleCopy.subheadline],
    ...(visibleCopy.sellingPoints ?? []).map((point, index) => [
      `selling point ${index + 1}`,
      point,
    ] as const),
  ] as const) {
    if (value && !prompt.includes(value)) {
      invalidVisibleCopy.push(label);
    }
  }
}

function validateVisibleCopyLayout(
  prompt: string,
  context: GenerationContext,
  duplicateConstraints: string[],
) {
  const visibleCopy = normalizeVisibleCopy(
    context.visibleCopy,
    context.visualRule,
  );

  if (!visibleCopy.enabled) {
    return;
  }

  const layoutChecks = [
    {
      id: "visible copy product priority",
      pattern: /away from the product|must not (?:overlap|crop|squeeze|visually compete)|must not .*compete with the product/i,
    },
    {
      id: "visible copy hierarchy",
      pattern: /clear hierarchy|mobile-readable/i,
    },
  ];

  for (const check of layoutChecks) {
    if (!check.pattern.test(prompt)) {
      duplicateConstraints.push(check.id);
    }
  }
}

function validateReferenceRoles(
  prompt: string,
  plan: PromptSemanticPlan,
  referenceRoleIssues: string[],
) {
  const normalizedPrompt = normalize(prompt);

  for (const role of plan.references.roles) {
    const roleText = `Image ${role.index}: ${role.type}`;
    const roleOnly = role.type.replace(/[_\s-]+/g, " ");

    if (!includesLoose(prompt, roleText) && !normalizedPrompt.includes(normalize(roleOnly))) {
      referenceRoleIssues.push(roleText);
    }
  }
}

function validateSceneAndType(
  prompt: string,
  plan: PromptSemanticPlan,
  missingSceneElements: string[],
) {
  if (
    plan.scene.englishText &&
    !containsCjk(plan.scene.englishText) &&
    !includesLoose(prompt, plan.scene.englishText.split(".")[0])
  ) {
    missingSceneElements.push("effective scene direction");
  }

  // Image-type execution details are now conditionally generated from the design intent.
  // Do not require every profile sentence to appear verbatim in the final short prompt.
}

function scoreValidation(result: Omit<PromptValidationResult, "score" | "valid">) {
  const issueCount =
    result.duplicateConstraints.length +
    result.genericPlaceholders.length +
    result.invalidVisibleCopy.length +
    result.missingFacts.length +
    result.missingSceneElements.length +
    result.referenceRoleIssues.length;

  return Math.max(0, 100 - issueCount * 12);
}

export function validateWorkspacePrompt(
  prompt: string,
  context: GenerationContext,
): PromptValidationResult {
  const plan = buildPromptSemanticPlan(context);
  const missingFacts: string[] = [];
  const missingSceneElements: string[] = [];
  const invalidVisibleCopy: string[] = [];
  const referenceRoleIssues: string[] = [];
  const genericPlaceholders = genericPlaceholderPatterns
    .filter((pattern) => pattern.test(prompt))
    .map((pattern) => pattern.source);
  const duplicateConstraints: string[] = [];

  for (const heading of requiredHeadings) {
    if (!prompt.includes(heading)) {
      missingFacts.push(`missing heading ${heading}`);
    }
  }

  if (!/one standalone|single standalone|standalone complete/i.test(prompt)) {
    missingFacts.push("single standalone image constraint");
  }

  validateSemanticValue(prompt, plan.product.brand, "brand", missingFacts);
  validateSemanticValue(prompt, plan.product.name, "product name", missingFacts);
  validateSemanticValue(prompt, plan.product.category, "category", missingFacts);
  validateSemanticValue(prompt, plan.product.color, "color", missingFacts);
  validateSemanticValue(prompt, plan.product.size, "size", missingFacts);

  for (const semantic of plan.product.visualSemantics) {
    if (
      /^Accessories are factual boundaries/i.test(semantic) &&
      /Accessories and packaging are factual boundaries|Do not add unverified accessories|confirmed accessories/i.test(prompt)
    ) {
      continue;
    }

    const lead = semantic.split(/[.;]/)[0];

    if (lead && !includesLoose(prompt, lead)) {
      missingFacts.push(`visual semantic: ${lead}`);
    }
  }

  validateVisibleCopy(prompt, context, invalidVisibleCopy);
  validateVisibleCopyLayout(prompt, context, duplicateConstraints);
  validateReferenceRoles(prompt, plan, referenceRoleIssues);
  validateSceneAndType(prompt, plan, missingSceneElements);

  const resultWithoutScore = {
    duplicateConstraints,
    genericPlaceholders,
    invalidVisibleCopy,
    missingFacts,
    missingSceneElements,
    referenceRoleIssues,
  };
  const score = scoreValidation(resultWithoutScore);

  return {
    ...resultWithoutScore,
    score,
    valid:
      score >= 88 &&
      genericPlaceholders.length === 0 &&
      invalidVisibleCopy.length === 0 &&
      missingFacts.length === 0 &&
      referenceRoleIssues.length === 0,
  };
}

export function summarizePromptValidationFailure(validation: PromptValidationResult) {
  return [
    validation.missingFacts.length
      ? `Missing facts: ${validation.missingFacts.join("; ")}`
      : "",
    validation.missingSceneElements.length
      ? `Missing scene/type elements: ${validation.missingSceneElements.join("; ")}`
      : "",
    validation.invalidVisibleCopy.length
      ? `Invalid visible copy: ${validation.invalidVisibleCopy.join("; ")}`
      : "",
    validation.referenceRoleIssues.length
      ? `Reference role issues: ${validation.referenceRoleIssues.join("; ")}`
      : "",
    validation.genericPlaceholders.length
      ? `Generic placeholders: ${validation.genericPlaceholders.join("; ")}`
      : "",
  ]
    .filter(Boolean)
    .join(" | ");
}
