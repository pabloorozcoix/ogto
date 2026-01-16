import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");

const CODE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const CSS_EXTS = new Set([".css"]);

function isIdentifierChar(ch) {
  return /[A-Za-z0-9_$]/.test(ch);
}

function stripCommentsFromTsLike(text, languageVariant) {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    /* skipTrivia */ false,
    languageVariant,
    text
  );
  const removals = [];

  while (true) {
    const token = scanner.scan();
    if (token === ts.SyntaxKind.EndOfFileToken) break;

    if (
      token === ts.SyntaxKind.SingleLineCommentTrivia ||
      token === ts.SyntaxKind.MultiLineCommentTrivia
    ) {
      let start = scanner.getTokenPos();
      let end = scanner.getTextPos();

      // Special case: JSX comment expression like `{/* ... */}`.
      // Remove the surrounding braces too, otherwise we leave `{}` which is invalid JSX.
      if (
        token === ts.SyntaxKind.MultiLineCommentTrivia &&
        languageVariant === ts.LanguageVariant.JSX
      ) {
        let left = start - 1;
        while (left >= 0 && /\s/.test(text[left])) left -= 1;
        let right = end;
        while (right < text.length && /\s/.test(text[right])) right += 1;

        if (left >= 0 && text[left] === "{" && right < text.length && text[right] === "}") {
          start = left;
          end = right + 1;
        }
      }

      removals.push({ start, end });
    }
  }

  if (removals.length === 0) return text;

  // Apply removals from back to front.
  let out = text;
  for (let i = removals.length - 1; i >= 0; i -= 1) {
    const { start, end } = removals[i];

    const beforeChar = start > 0 ? out[start - 1] : "";
    const afterChar = end < out.length ? out[end] : "";

    let replacement = "";

    // Avoid merging tokens when a comment sat between two identifier-ish characters.
    if (beforeChar && afterChar && isIdentifierChar(beforeChar) && isIdentifierChar(afterChar)) {
      replacement = " ";
    }

    out = out.slice(0, start) + replacement + out.slice(end);
  }

  return out;
}

function stripBlockCommentsFromCss(text) {
  let out = "";
  let i = 0;
  let inSingle = false;
  let inDouble = false;

  while (i < text.length) {
    const ch = text[i];
    const next = i + 1 < text.length ? text[i + 1] : "";

    if (!inDouble && ch === "'" && text[i - 1] !== "\\") {
      inSingle = !inSingle;
      out += ch;
      i += 1;
      continue;
    }
    if (!inSingle && ch === '"' && text[i - 1] !== "\\") {
      inDouble = !inDouble;
      out += ch;
      i += 1;
      continue;
    }

    if (!inSingle && !inDouble && ch === "/" && next === "*") {
      // Skip until closing */
      i += 2;
      while (i < text.length) {
        const c = text[i];
        const n = i + 1 < text.length ? text[i + 1] : "";
        if (c === "*" && n === "/") {
          i += 2;
          break;
        }
        i += 1;
      }
      continue;
    }

    out += ch;
    i += 1;
  }

  return out;
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (e.isFile()) {
      files.push(full);
    }
  }
  return files;
}

function languageVariantForExt(ext) {
  return ext === ".tsx" || ext === ".jsx"
    ? ts.LanguageVariant.JSX
    : ts.LanguageVariant.Standard;
}

async function main() {
  const all = await walk(SRC_DIR);
  let changed = 0;

  for (const file of all) {
    const ext = path.extname(file);
    if (!CODE_EXTS.has(ext) && !CSS_EXTS.has(ext)) continue;

    const original = await fs.readFile(file, "utf8");
    let next = original;

    if (CODE_EXTS.has(ext)) {
      next = stripCommentsFromTsLike(original, languageVariantForExt(ext));
    } else if (CSS_EXTS.has(ext)) {
      next = stripBlockCommentsFromCss(original);
    }

    if (next !== original) {
      await fs.writeFile(file, next, "utf8");
      changed += 1;
    }
  }

  console.log(`remove-comments-src: updated ${changed} file(s)`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
