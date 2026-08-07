import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);
export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function resolveProjectSpecifier(specifier) {
  if (specifier.startsWith("@/")) {
    return resolve(projectRoot, "src", specifier.slice(2));
  }

  return null;
}

function resolveRelativeSpecifier(specifier, parentFilename) {
  if (!specifier.startsWith(".")) {
    return null;
  }

  return resolve(dirname(parentFilename), specifier);
}

function resolveTsFilename(baseFilename) {
  if (extname(baseFilename)) {
    return baseFilename;
  }

  for (const extension of [".ts", ".tsx", ".js", ".mjs"]) {
    try {
      const filename = `${baseFilename}${extension}`;

      readFileSync(filename, "utf8");

      return filename;
    } catch {
      // Try the next extension.
    }
  }

  for (const indexFilename of ["index.ts", "index.tsx", "index.js", "index.mjs"]) {
    try {
      const filename = resolve(baseFilename, indexFilename);

      readFileSync(filename, "utf8");

      return filename;
    } catch {
      // Try the next index file.
    }
  }

  return baseFilename;
}

export function loadTsModule(relativePath, options = {}) {
  const cache = options.cache ?? new Map();
  const stubs = options.stubs ?? {};
  const filename = resolveTsFilename(resolve(projectRoot, relativePath));

  if (cache.has(filename)) {
    return cache.get(filename).exports;
  }

  const source = readFileSync(filename, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  });
  const loadedModule = { exports: {} };

  cache.set(filename, loadedModule);

  const localRequire = (specifier) => {
    if (Object.hasOwn(stubs, specifier)) {
      const stub = stubs[specifier];

      return typeof stub === "function" ? stub({ cache, loadTsModule, parentFilename: filename }) : stub;
    }

    const projectSpecifier = resolveProjectSpecifier(specifier);
    const relativeSpecifier = resolveRelativeSpecifier(specifier, filename);
    const nextFilename = projectSpecifier ?? relativeSpecifier;

    if (nextFilename) {
      const resolvedFilename = resolveTsFilename(nextFilename);

      if (/\.[cm]?[tj]sx?$/.test(resolvedFilename)) {
        const relativeResolvedPath = resolvedFilename.slice(projectRoot.length + 1);

        return loadTsModule(relativeResolvedPath, { cache, stubs });
      }
    }

    return require(specifier);
  };
  const factory = new Function(
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
    transpiled.outputText,
  );

  factory(loadedModule.exports, localRequire, loadedModule, filename, dirname(filename));

  return loadedModule.exports;
}
