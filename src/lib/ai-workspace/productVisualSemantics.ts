import type { ProductFacts } from "@/lib/ai-workspace/types";

function readProductText(facts: ProductFacts) {
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

export function inferProductVisualSemantics(facts: ProductFacts) {
  const text = readProductText(facts);
  const semantics: string[] = [];

  if (/1\s*\/\s*64|64分之1|微缩|迷你|工艺|模型|摆件|陈列/.test(text)) {
    semantics.push(
      "This is a 1/64-scale miniature display craft model, not a full-size playable instrument.",
      "Do not depict it as a full-size performance or practice violin.",
      "Use visual scale cues only when allowed by the platform and scene; otherwise make the miniature nature explicit through composition and copy-safe specification cues.",
    );
  }

  if (/4\s*\/?\s*4|成人|全尺寸|44/.test(text) && !/1\s*\/\s*64|64分之1|微缩/.test(text)) {
    semantics.push("This is a 4/4 full-size violin; keep adult full-size proportions accurate.");
  }

  if (/小提琴|violin/i.test(text)) {
    semantics.push(
      "Preserve violin-specific structure: scroll, pegs, fingerboard, bridge, four continuous strings, f-holes, tailpiece, chin rest area, body curves, varnish gloss, and realistic proportions.",
    );
  }

  if (/套装|琴盒|肩托|松香|调音器|指板贴|马桥|琴弦/.test(text)) {
    semantics.push(
      "Accessories are factual boundaries; show them only for set-content images or when explicitly requested.",
    );
  }

  return semantics;
}
