import type { VisualRule } from "@/lib/ai-workspace/types";

function compactLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function readSection(card: string, title: string) {
  const blocks = card
    .split(/^\s*=+\s*$/m)
    .map((block) => block.trim())
    .filter(Boolean);
  const block = blocks.find((item) => item.split("\n")[0]?.trim() === title);

  return block?.split("\n").slice(1).join("\n").trim() || "";
}

function readNamedBlock(section: string, name: string, stopNames: string[]) {
  const lines = section.split("\n");
  const startIndex = lines.findIndex((line) => line.trim().replace(/:$/, "") === name);

  if (startIndex === -1) {
    return [];
  }

  const collected: string[] = [];

  for (const line of lines.slice(startIndex + 1)) {
    const normalizedLine = line.trim().replace(/:$/, "");

    if (stopNames.includes(normalizedLine)) {
      break;
    }

    collected.push(line);
  }

  return compactLines(collected.join("\n"));
}

function parseVisualSpecification(section: string) {
  const specification: Record<string, string> = {};
  const matches = section.matchAll(
    /^([A-Za-z ]+):\s*\n([\s\S]*?)(?=^[A-Za-z ]+:\s*$|$)/gm,
  );

  for (const match of matches) {
    const key = match[1].trim();
    const value = compactLines(match[2]).join(" ");

    if (key && value) {
      specification[key] = value;
    }
  }

  return specification;
}

function parseGuidanceList(section: string, title: string) {
  return readNamedBlock(section, title, ["Primary", "Secondary", "Focus", "Avoid"]).map(
    (line) => line.replace(/^-\s*/, "").trim(),
  );
}

export function parseRuleCard(markdown: string, ruleId: string): VisualRule | null {
  const escapedRuleId = ruleId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const cardMatch = markdown.match(
    new RegExp(`Rule ID\\s*\\n\\s*${escapedRuleId}\\s*\\n([\\s\\S]*?)(?=\\n---\\n|\\n# End|$)`),
  );

  if (!cardMatch) {
    return null;
  }

  const card = cardMatch[1];
  const theme = compactLines(readSection(card, "Theme"))[0] || "";
  const designObjective = compactLines(readSection(card, "Design Objective")).join(" ");
  const visualSpecification = parseVisualSpecification(
    readSection(card, "Visual Specification"),
  );
  const mediaGuidanceSection = readSection(card, "Media Guidance");
  const promptGuidanceSection = readSection(card, "Prompt Guidance");

  return {
    ruleId,
    theme,
    designObjective,
    visualSpecification,
    mediaGuidance: {
      primary: parseGuidanceList(mediaGuidanceSection, "Primary"),
      secondary: parseGuidanceList(mediaGuidanceSection, "Secondary"),
    },
    promptGuidance: {
      focus: parseGuidanceList(promptGuidanceSection, "Focus"),
      avoid: parseGuidanceList(promptGuidanceSection, "Avoid"),
    },
  };
}
