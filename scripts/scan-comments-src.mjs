import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");

const CODE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const CSS_EXTS = new Set([".css"]);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(full)));
    else if (e.isFile()) files.push(full);
  }
  return files;
}

function languageVariantForExt(ext) {
  return ext === ".tsx" || ext === ".jsx"
    ? ts.LanguageVariant.JSX
    : ts.LanguageVariant.Standard;
}

function countTsLikeComments(text, languageVariant) {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    /* skipTrivia */ false,
    languageVariant,
    text
  );

  let single = 0;
  let multi = 0;

  while (true) {
    const token = scanner.scan();
    if (token === ts.SyntaxKind.EndOfFileToken) break;
    if (token === ts.SyntaxKind.SingleLineCommentTrivia) single += 1;
    if (token === ts.SyntaxKind.MultiLineCommentTrivia) multi += 1;
  }

  return { single, multi, total: single + multi };
}

function cssHasBlockComment(text) {
  // CSS only supports /* */ comments; this is sufficient.
  return text.includes("/*");
}

async function main() {
  const all = await walk(SRC_DIR);

  const offenders = [];

  for (const file of all) {
    const ext = path.extname(file);
    if (!CODE_EXTS.has(ext) && !CSS_EXTS.has(ext)) continue;

    const text = await fs.readFile(file, "utf8");

    if (CODE_EXTS.has(ext)) {
      const counts = countTsLikeComments(text, languageVariantForExt(ext));
      if (counts.total > 0) offenders.push({ file, ...counts });
    } else if (CSS_EXTS.has(ext)) {
      if (cssHasBlockComment(text)) offenders.push({ file, single: 0, multi: 1, total: 1 });
    }
  }

  if (offenders.length === 0) {
    console.log("scan-comments-src: OK (0 comment tokens found in src/)");
    return;
  }

  console.log(`scan-comments-src: FOUND comments in ${offenders.length} file(s)`);
  for (const o of offenders) {
    const rel = path.relative(ROOT, o.file);
    console.log(`- ${rel}: single=${o.single} multi=${o.multi} total=${o.total}`);
  }
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
