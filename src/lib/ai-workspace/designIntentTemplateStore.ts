import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type DesignIntentTemplate = {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

const dataFilePath = path.join(process.cwd(), "data", "design-intent-templates.json");

async function readTemplates() {
  try {
    const raw = await readFile(dataFilePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    return Array.isArray(parsed) ? (parsed as DesignIntentTemplate[]) : [];
  } catch {
    return [];
  }
}

async function writeTemplates(templates: DesignIntentTemplate[]) {
  await mkdir(path.dirname(dataFilePath), { recursive: true });
  await writeFile(dataFilePath, `${JSON.stringify(templates, null, 2)}\n`, "utf8");
}

export async function getDesignIntentTemplates() {
  const templates = await readTemplates();

  return templates.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function createDesignIntentTemplate(input: {
  content: string;
  name: string;
}) {
  const name = input.name.trim();
  const content = input.content.trim();

  if (!name) {
    throw new Error("请输入常用意图名称。");
  }

  if (!content) {
    throw new Error("请输入常用意图内容。");
  }

  const now = new Date().toISOString();
  const template: DesignIntentTemplate = {
    content,
    createdAt: now,
    id: randomUUID(),
    name,
    updatedAt: now,
  };
  const templates = await readTemplates();

  await writeTemplates([template, ...templates]);

  return template;
}

export async function deleteDesignIntentTemplate(id: string) {
  const templates = await readTemplates();
  const nextTemplates = templates.filter((template) => template.id !== id);

  if (nextTemplates.length === templates.length) {
    throw new Error("未找到常用意图。");
  }

  await writeTemplates(nextTemplates);

  return { id };
}
