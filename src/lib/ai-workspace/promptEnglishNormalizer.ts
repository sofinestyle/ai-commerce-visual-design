const cjkPattern = /[\u3400-\u9fff]/;

const phraseTranslations: Array<[string, string]> = [
  ["场景中，小提琴立于浅色木质练习室中央，远处有模糊琴谱架和柔和窗光。暖色侧光沿琴身漆面形成细腻高光，背景保持安静、真实、克制，突出入门练习氛围", "Place the violin at the center of a light wood practice room, with a softly blurred music stand in the distance and gentle window light. Warm side light creates refined highlights along the glossy varnish, while the background stays quiet, realistic, and restrained, emphasizing an entry-level daily practice atmosphere"],
  ["场景中，乐器主体置于海边木质码头中央，远处蔚蓝海面与天空相接，细碎波光沿画面纵深延伸。黄金时刻的暖色侧光落在主体，远景保留细腻空气透视，画面开阔清新，呈现音乐与自然相遇的宁静时刻", "Place the instrument subject at the center of a wooden seaside dock, with the blue sea and sky meeting in the distance and subtle sparkling water highlights extending into the depth of the frame. Warm golden-hour side light falls on the subject, the distant background keeps delicate atmospheric perspective, and the image feels open, fresh, and airy, presenting a quiet moment where music meets nature"],
  ["严格遵循纯白背景规则，仅以精细光影、真实材质和专业工艺感表达原设计氛围，不呈现任何环境、道具或场景背景", "Strictly follow the pure-white background rule, expressing the original mood only through refined lighting, realistic material detail, and professional craftsmanship, without showing any environment, props, or scene background"],
  ["一把小提琴立于浅色摄影棚中央", "a violin stands in the center of a light-colored studio"],
  ["柔和侧光突出亮光棕色漆面和琴身弧线", "soft side lighting highlights the glossy brown varnish and violin body curves"],
  ["柔和侧光突出棕色漆面", "soft side lighting highlights the brown varnish"],
  ["背景干净克制", "the background is clean and restrained"],
  ["画面保留左上角文案空间", "the image reserves top-left copy space"],
  ["场景中", "in the scene"],
  ["乐器主体", "the instrument subject"],
  ["海边木质码头", "wooden seaside dock"],
  ["蔚蓝海面与天空", "blue sea and sky"],
  ["细碎波光", "subtle sparkling water highlights"],
  ["沿画面纵深延伸", "extending into the depth of the frame"],
  ["黄金时刻的暖色侧光", "warm golden-hour side light"],
  ["黄金时刻", "golden hour"],
  ["暖色侧光", "warm side light"],
  ["落在主体", "falls on the subject"],
  ["远景保留细腻空气透视", "the distant background keeps delicate atmospheric perspective"],
  ["细腻空气透视", "delicate atmospheric perspective"],
  ["画面开阔清新", "the image feels open, fresh, and airy"],
  ["开阔清新", "open, fresh, and airy"],
  ["音乐与自然相遇", "music meeting nature"],
  ["宁静时刻", "quiet and calm moment"],
  ["制琴工坊", "violin-making workshop"],
  ["制作语境", "craftsmanship context"],
  ["浅色摄影棚", "light-colored studio"],
  ["浅色木质练习室", "light wood practice room"],
  ["练习室", "practice room"],
  ["琴谱架", "music stand"],
  ["模糊琴谱架", "softly blurred music stand"],
  ["柔和窗光", "gentle window light"],
  ["窗光", "window light"],
  ["琴身漆面", "violin varnish"],
  ["形成细腻高光", "creates refined highlights"],
  ["细腻高光", "refined highlights"],
  ["安静、真实、克制", "quiet, realistic, and restrained"],
  ["入门练习氛围", "entry-level daily practice atmosphere"],
  ["摄影棚", "studio"],
  ["木质码头", "wooden dock"],
  ["海边", "seaside"],
  ["码头", "dock"],
  ["远处", "in the distance"],
  ["天空", "sky"],
  ["海面", "sea surface"],
  ["主体", "subject"],
  ["中央", "center"],
  ["置于", "is placed at"],
  ["立于", "stands at"],
  ["相接", "meet"],
  ["延伸", "extends"],
  ["保留", "keeps"],
  ["呈现", "presenting"],
  ["辅助展现", "support showing"],
  ["采用", "use"],
  ["整洁", "clean"],
  ["背景", "background"],
  ["小提琴", "violin"],
  ["黑色实木小提琴", "black solid wood violin"],
  ["夹板普及小提琴", "beginner laminated violin"],
  ["夹板", "laminated"],
  ["普及", "beginner"],
  ["亮光棕色", "glossy brown"],
  ["深棕色", "dark brown"],
  ["黑色", "black"],
  ["实木", "solid wood"],
  ["云杉", "spruce"],
  ["无花纹枫木", "plain maple"],
  ["枫木", "maple"],
  ["乌木", "ebony"],
  ["Alice", "Alice"],
  ["alice", "Alice"],
  ["棕色", "brown"],
  ["面板", "top"],
  ["背板", "back"],
  ["配件", "fittings"],
  ["拉弦板", "tailpiece"],
  ["碳纤维", "carbon fiber"],
  ["碳纤", "carbon fiber"],
  ["琴弦", "strings"],
  ["铝镁合金", "aluminum-magnesium alloy"],
  ["三角琴盒", "triangular violin case"],
  ["马桥", "bridge"],
  ["2个松香", "two rosins"],
  ["指板贴", "fingerboard sticker"],
  ["塑料肩托", "plastic shoulder rest"],
  ["松香", "rosin"],
  ["塑料黑色肩托", "black plastic shoulder rest"],
  ["黑色肩托", "black shoulder rest"],
  ["牛皮纸外箱", "kraft paper outer carton"],
  ["彩盒", "color box"],
  ["品牌识别", "brand identity"],
  ["突出", "highlight"],
  ["与", "and"],
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeEnglishSpacing(value: string) {
  return value
    .replace(/[，、；]/g, ", ")
    .replace(/[。]/g, ". ")
    .replace(/[:：]/g, ": ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*\.\s*/g, ". ")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
}

export function containsCjk(value: string) {
  return cjkPattern.test(value);
}

export function translateKnownChineseText(value: string | undefined | null, _fallback: string) {
  void _fallback;
  const source = value?.trim();

  if (!source) return "";
  if (!containsCjk(source)) return source;

  let translated = source;
  const sortedTranslations = [...phraseTranslations].sort(
    ([left], [right]) => right.length - left.length,
  );

  for (const [phrase, replacement] of sortedTranslations) {
    translated = translated.replace(new RegExp(escapeRegExp(phrase), "g"), replacement);
  }

  translated = normalizeEnglishSpacing(translated);

  return containsCjk(translated) ? source : translated;
}

export function translateProductName(value?: string | null) {
  return translateKnownChineseText(value, "verified product");
}

export function translateProductCategory(value?: string | null) {
  return translateKnownChineseText(value, "product category");
}

export function translateProductColor(value?: string | null) {
  return translateKnownChineseText(value, "verified product color");
}

export function normalizeProductSize(value?: string | null) {
  const source = value?.trim();

  if (!source) return "";

  if (/^4\s*\/?\s*4$/.test(source)) {
    return "4/4";
  }

  return source;
}

export function translateProductMaterial(value?: string | null) {
  const source = value?.trim();

  if (!source) return "";
  if (!containsCjk(source)) return source;

  const parts = [
    /面板[:：]?[^；;，,。]*云杉/.test(source) ? "spruce top" : "",
    /背板[:：]?[^；;，,。]*无花纹枫木/.test(source) ? "plain maple back" : "",
    /背板[:：]?[^；;，,。]*枫木/.test(source) &&
    !/背板[:：]?[^；;，,。]*无花纹枫木/.test(source)
      ? "maple back"
      : "",
    /配件[:：]?[^；;，,。]*乌木/.test(source) ? "ebony fittings" : "",
    /拉弦板[:：]?[^；;，,。]*乌木/.test(source) ? "ebony tailpiece" : "",
    /面板[:：]?[^；;，,。]*夹板/.test(source) ? "laminated top" : "",
    /背板[:：]?[^；;，,。]*夹板/.test(source) ? "laminated back" : "",
    /拉弦板[:：]?[^；;，,。]*碳纤/.test(source) ? "carbon fiber tailpiece" : "",
    /琴弦[:：]?[^；;，,。]*Alice[^；;，,。]*铝镁合金/i.test(source)
      ? "Alice aluminum-magnesium alloy strings"
      : "",
    /琴弦[:：]?[^；;，,。]*铝镁合金/.test(source) &&
    !/琴弦[:：]?[^；;，,。]*Alice[^；;，,。]*铝镁合金/i.test(source)
      ? "aluminum-magnesium alloy strings"
      : "",
  ].filter(Boolean);

  if (parts.length > 0) {
    return Array.from(new Set(parts)).join(", ");
  }

  return translateKnownChineseText(source, "verified product materials");
}

export function translateAccessories(value?: string | null) {
  const translated = translateKnownChineseText(value, "verified accessories");

  return translated
    .replace(/\bstrings, rosin\b/g, "extra strings, rosin")
    .replace(/\s+/g, " ")
    .trim();
}

export function translatePackaging(value?: string | null) {
  return translateKnownChineseText(value, "verified packaging");
}

export function translateDesignIntent(value?: string | null) {
  return translateKnownChineseText(
    value,
    "Use the approved scene direction as a clean, realistic, product-first commercial setting without adding unverified details.",
  );
}
