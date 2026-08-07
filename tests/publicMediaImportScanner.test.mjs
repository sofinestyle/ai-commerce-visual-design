import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { loadTsModule } from "./helpers/loadTsModule.mjs";

const { scanPublicMediaProductCandidates } = loadTsModule(
  "src/lib/services/publicMediaImportScanner.ts",
);

test("scanPublicMediaProductCandidates scans public/media and builds import candidates", async () => {
  const rootDirectory = await mkdtemp(join(tmpdir(), "public-media-scan-"));

  try {
    const imageDirectory = join(rootDirectory, "media", "小提琴", "W102-BR", "参考图");
    const brandDirectory = join(rootDirectory, "media", "品牌", "YorRay");
    const generatedDirectory = join(rootDirectory, "media", "generated");

    await mkdir(imageDirectory, { recursive: true });
    await mkdir(brandDirectory, { recursive: true });
    await mkdir(generatedDirectory, { recursive: true });
    await writeFile(join(imageDirectory, "front.JPG"), Buffer.from("fake image bytes"));
    await writeFile(join(imageDirectory, "ignore.gif"), Buffer.from("unsupported"));
    await writeFile(join(brandDirectory, "logo.png"), Buffer.from("brand logo"));
    await writeFile(join(generatedDirectory, "ai.png"), Buffer.from("generated image"));

    const candidates = await scanPublicMediaProductCandidates({
      products: [{ category: "小提琴", sku: "W102-BR" }],
      rootDirectory,
    });

    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].category, "小提琴");
    assert.equal(candidates[0].sku, "W102-BR");
    assert.equal(candidates[0].filename, "front.JPG");
    assert.equal(candidates[0].relativePath, "media/小提琴/W102-BR/参考图/front.JPG");
    assert.equal(candidates[0].previewUrl, "/media/%E5%B0%8F%E6%8F%90%E7%90%B4/W102-BR/%E5%8F%82%E8%80%83%E5%9B%BE/front.JPG");
    assert.equal(candidates[0].sourceInStandardSkuFolder, true);
    assert.equal(candidates[0].usageType, "reference");
    assert.equal(candidates[0].status, "ready");
  } finally {
    await rm(rootDirectory, { force: true, recursive: true });
  }
});
