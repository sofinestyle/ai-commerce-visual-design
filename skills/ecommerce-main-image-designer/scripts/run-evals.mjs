#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const skillRoot = path.resolve(path.dirname(scriptPath), "..");
const evalRoot = path.join(skillRoot, "evals");
const repoRoot = path.resolve(skillRoot, "..", "..");
const reportRoot = path.join(evalRoot, "reports");

function readJson(relativePath) {
  return readFile(path.join(skillRoot, relativePath), "utf8").then(JSON.parse);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function getPath(value, dottedPath) {
  return dottedPath.split(".").reduce((current, key) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return current[key];
  }, value);
}

function includesAll(actual = [], expected = []) {
  return expected.every((item) => actual.includes(item));
}

function parseSku(prompt) {
  return prompt.match(/(?:产品编号|SKU|sku)\s*([A-Z0-9-]+)/i)?.[1] || "";
}

function parsePlatform(prompt) {
  if (/amazon/i.test(prompt)) return "Amazon";
  if (/temu/i.test(prompt)) return "TEMU";
  if (/shein/i.test(prompt)) return "SHEIN";
  if (/天猫/.test(prompt)) return "天猫";
  if (/抖店/.test(prompt)) return "抖店";
  if (/独立站/.test(prompt)) return "独立站";
  return "";
}

function parseImageCount(prompt) {
  const match = prompt.match(/制作\s*(\d+)\s*张|做\s*(\d+)\s*张|帮我做\s*(\d+)\s*张/);
  const count = Number(match?.[1] || match?.[2] || match?.[3]);

  return Number.isFinite(count) && count > 0 ? count : undefined;
}

function parseImageType(prompt) {
  if (/详情页/.test(prompt)) return "详情页";
  return /主图|首图|产品图|使用场景图/.test(prompt) ? "主图" : undefined;
}

function parseTheme(prompt) {
  if (/首图/.test(prompt)) return "首图";
  if (/使用场景|场景图|户外|室内|公园|音乐厅/.test(prompt)) return "使用场景图";
  if (/详情页/.test(prompt)) return "详情页";
  if (/产品图/.test(prompt)) return "产品图";
  return undefined;
}

function parseMode(prompt) {
  if (/分析|方案|如何设计|先给/.test(prompt)) return "plan_only";
  return "generate";
}

function parseCopyMode(prompt, request) {
  if (/不要文案|无文案|禁止文案/.test(prompt)) return "none";
  if (request.platform === "Amazon" && request.theme === "首图") return "none";
  if (/使用这句文案|确认.*文案/.test(prompt)) return "user_confirmed";
  return "auto";
}

function parseEndpoint(prompt) {
  if (/上一张|换成正确logo|其他都不要变|局部|local edit/i.test(prompt)) {
    return "/api/ai-workspace/edit-image";
  }

  return "/api/ai-workspace/ecommerce-generate";
}

function findPlatformRule(platformRules, request) {
  return platformRules.find(
    (rule) =>
      rule.platform === request.platform &&
      rule.imageType === request.imageType &&
      rule.theme === request.theme,
  );
}

function productBodyReferenceExists(mediaItems, sku) {
  return mediaItems.some(
    (item) =>
      item.sku === sku &&
      item.url &&
      item.source !== "AI" &&
      ["front", "back", "side", "detail"].includes(item.type),
  );
}

function buildActual(caseItem, fixtures) {
  const prompt = caseItem.prompt;
  const endpoint = parseEndpoint(prompt);

  if (endpoint === "/api/ai-workspace/edit-image") {
    return {
      endpoint,
      mode: "generate",
      request: {
        parentImageId: "present",
        preserveExistingText: true,
        revisionMode: "local_edit",
      },
      requiredReferences: caseItem.expected.requiredReferences ?? [],
      status: "planned",
    };
  }

  const request = {
    platform: parsePlatform(prompt) || undefined,
    sku: parseSku(prompt) || undefined,
    imageType: parseImageType(prompt),
    theme: parseTheme(prompt),
    imageCount: parseImageCount(prompt),
  };
  const mode = /确认以上/.test(prompt) ? "generate" : parseMode(prompt);

  request.copyMode = parseCopyMode(prompt, request);

  const platformRule = findPlatformRule(fixtures.platformRules, request);

  if (platformRule?.copyMode === "none" && request.copyMode !== "user_confirmed") {
    request.copyMode = "none";
  }

  if (platformRule?.logoMode) {
    request.brandLogoMode = platformRule.logoMode;
  }

  if (/确认以上/.test(prompt)) {
    request.confirmedPlanItems = "present";
    request.options = { generationConcurrency: 2 };
  }

  if (/使用这句文案|Practice With Confidence|Everything in One Set/.test(prompt)) {
    request.confirmedCopy = "present";
  }

  const missingFields = [];

  if (!request.sku && !request.confirmedPlanItems && !request.confirmedCopy) {
    missingFields.push("sku");
  }

  if (!request.platform && !request.confirmedPlanItems && !request.confirmedCopy) {
    missingFields.push("platform");
  }

  if (/限时|促销|折扣|limited|discount|sale/i.test(prompt)) {
    missingFields.push("promotionFacts");
  }

  const product = request.sku
    ? fixtures.products.find((item) => item.sku === request.sku)
    : null;

  if (request.sku && !product) {
    missingFields.push("product");
  }

  if (product && !productBodyReferenceExists(fixtures.media, request.sku)) {
    missingFields.push("verifiedProductReference");
  }

  const status = missingFields.length > 0 ? "needs_input" : mode === "plan_only" ? "planned" : "ready";

  return {
    endpoint,
    mode,
    missingFields: unique(missingFields),
    providerBypass: false,
    request,
    requiredReferences: caseItem.expected.requiredReferences ?? [],
    status,
  };
}

function compareCase(caseItem, actual) {
  const expected = caseItem.expected;
  const assertions = [];
  const add = (name, passed, expectedValue, actualValue) => {
    assertions.push({
      actual: actualValue,
      expected: expectedValue,
      name,
      passed,
    });
  };

  if (expected.status) {
    add("status", actual.status === expected.status, expected.status, actual.status);
  }

  if (expected.mode) {
    const passed =
      expected.mode === "generate_or_needs_input"
        ? actual.mode === "generate" || actual.status === "needs_input"
        : actual.mode === expected.mode;

    add("mode", passed, expected.mode, actual.mode);
  }

  if (expected.endpoint) {
    add("endpoint", actual.endpoint === expected.endpoint, expected.endpoint, actual.endpoint);
  }

  if (expected.missingFields) {
    add(
      "missingFields",
      includesAll(actual.missingFields, expected.missingFields),
      expected.missingFields,
      actual.missingFields ?? [],
    );
  }

  if (expected.requiredReferences) {
    add(
      "requiredReferences",
      includesAll(actual.requiredReferences, expected.requiredReferences),
      expected.requiredReferences,
      actual.requiredReferences,
    );
  }

  for (const [key, expectedValue] of Object.entries(expected.request ?? {})) {
    const actualValue = getPath(actual.request, key);
    const passed = expectedValue === "present" ? Boolean(actualValue) : actualValue === expectedValue;

    add(`request.${key}`, passed, expectedValue, actualValue);
  }

  if (/provider bypass/i.test(expected.behavior ?? "")) {
    add("providerBypass", actual.providerBypass === false, false, actual.providerBypass);
  }

  return assertions;
}

function categoryForCase(id) {
  if (/missing|unknown|promotion/.test(id)) return "requiredFacts";
  if (/amazon|platform|copy-forbidden/.test(id)) return "platformCompliance";
  if (/reference|logo/.test(id)) return "referenceAccuracy";
  if (/copy/.test(id)) return "copyDecision";
  if (/chain|batch|confirmed-plan/.test(id)) return "chainUsage";
  return "general";
}

function summarize(results, expectedResults) {
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;
  const categoryNames = [
    "requiredFacts",
    "platformCompliance",
    "referenceAccuracy",
    "copyDecision",
    "chainUsage",
  ];
  const categories = {};

  for (const category of categoryNames) {
    const categoryResults = results.filter((result) => result.category === category);
    const categoryPassed = categoryResults.filter((result) => result.passed).length;

    categories[category] = {
      passed: categoryPassed,
      total: categoryResults.length,
      rate: categoryResults.length ? categoryPassed / categoryResults.length : 1,
    };
  }

  return {
    categories,
    failed,
    generatedAt: new Date().toISOString(),
    passCriteria: expectedResults.passCriteria,
    passed,
    successRate: results.length ? passed / results.length : 0,
    total: results.length,
  };
}

function formatPercent(value) {
  return `${Math.round(value * 1000) / 10}%`;
}

function buildMarkdownReport(summary, results) {
  const failed = results.filter((result) => !result.passed);
  const lines = [
    "# Ecommerce Skill Eval Report",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    `Total Cases: ${summary.total}`,
    `Passed: ${summary.passed}`,
    `Failed: ${summary.failed}`,
    `Success Rate: ${formatPercent(summary.successRate)}`,
    "",
    "## Category Rates",
    "",
    `- Required Facts Accuracy: ${formatPercent(summary.categories.requiredFacts.rate)}`,
    `- Platform Compliance Rate: ${formatPercent(summary.categories.platformCompliance.rate)}`,
    `- Reference Accuracy Rate: ${formatPercent(summary.categories.referenceAccuracy.rate)}`,
    `- Copy Decision Accuracy: ${formatPercent(summary.categories.copyDecision.rate)}`,
    `- Chain Usage Rate: ${formatPercent(summary.categories.chainUsage.rate)}`,
    "",
  ];

  if (failed.length === 0) {
    lines.push("## Failed Cases", "", "None.");
    return `${lines.join("\n")}\n`;
  }

  lines.push("## Failed Cases", "");

  for (const result of failed) {
    lines.push(`### ${result.id}`, "", result.prompt, "");

    for (const assertion of result.assertions.filter((item) => !item.passed)) {
      lines.push(
        `- ${assertion.name}`,
        `  - Expected: \`${JSON.stringify(assertion.expected)}\``,
        `  - Actual: \`${JSON.stringify(assertion.actual)}\``,
      );
    }

    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function validateReferenceFiles(cases) {
  const missing = [];

  for (const caseItem of cases) {
    for (const reference of caseItem.expected.requiredReferences ?? []) {
      const absolutePath = path.join(skillRoot, "references", reference);

      missing.push(
        readFile(absolutePath, "utf8")
          .then(() => null)
          .catch(() => ({ caseId: caseItem.id, reference })),
      );
    }
  }

  return Promise.all(missing).then((items) => items.filter(Boolean));
}

async function main() {
  const [cases, expectedResults, products, media, platformRules] = await Promise.all([
    readJson("evals/eval-cases.json"),
    readJson("evals/expected-results.json"),
    readJson("evals/fixtures/products.json"),
    readJson("evals/fixtures/media.json"),
    readJson("evals/fixtures/platform-rules.json"),
  ]);
  const missingReferences = await validateReferenceFiles(cases);
  const fixtures = { media, platformRules, products };
  const results = cases.map((caseItem) => {
    const actual = buildActual(caseItem, fixtures);
    const assertions = compareCase(caseItem, actual);
    const passed = assertions.every((assertion) => assertion.passed);

    return {
      actual,
      assertions,
      category: categoryForCase(caseItem.id),
      expected: caseItem.expected,
      id: caseItem.id,
      passed,
      prompt: caseItem.prompt,
    };
  });

  for (const missingReference of missingReferences) {
    const result = results.find((item) => item.id === missingReference.caseId);

    if (!result) continue;

    result.assertions.push({
      actual: "missing",
      expected: missingReference.reference,
      name: `referenceFile.${missingReference.reference}`,
      passed: false,
    });
    result.passed = false;
  }

  const summary = summarize(results, expectedResults);
  const report = {
    runner: "ecommerce-main-image-designer-p0-contract-runner",
    summary,
    results,
  };

  await mkdir(reportRoot, { recursive: true });
  await Promise.all([
    writeFile(path.join(reportRoot, "latest.json"), `${JSON.stringify(report, null, 2)}\n`),
    writeFile(path.join(reportRoot, "latest.md"), buildMarkdownReport(summary, results)),
  ]);

  console.log(
    [
      "Ecommerce Skill Eval",
      `Cases: ${summary.total}`,
      `Passed: ${summary.passed}`,
      `Failed: ${summary.failed}`,
      `Success Rate: ${formatPercent(summary.successRate)}`,
      `Report: ${path.relative(repoRoot, path.join(reportRoot, "latest.md"))}`,
    ].join("\n"),
  );

  const criteria = expectedResults.passCriteria ?? {};
  const criteriaFailures = [];

  if (
    typeof criteria.minimumSkillSuccessRate === "number" &&
    summary.successRate < criteria.minimumSkillSuccessRate
  ) {
    criteriaFailures.push("minimumSkillSuccessRate");
  }

  if (
    typeof criteria.requiredFactsAccuracy === "number" &&
    summary.categories.requiredFacts.rate < criteria.requiredFactsAccuracy
  ) {
    criteriaFailures.push("requiredFactsAccuracy");
  }

  if (
    typeof criteria.platformComplianceRate === "number" &&
    summary.categories.platformCompliance.rate < criteria.platformComplianceRate
  ) {
    criteriaFailures.push("platformComplianceRate");
  }

  if (
    typeof criteria.chainUsageRate === "number" &&
    summary.categories.chainUsage.rate < criteria.chainUsageRate
  ) {
    criteriaFailures.push("chainUsageRate");
  }

  if (summary.failed > 0 || criteriaFailures.length > 0) {
    if (criteriaFailures.length > 0) {
      console.error(`Failed pass criteria: ${criteriaFailures.join(", ")}`);
    }

    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
