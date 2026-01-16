#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const root = process.cwd();

const tsconfigPath = resolve(root, "tsconfig.json");
const tsconfigText = readFileSync(tsconfigPath, "utf8");
const tsconfigJson = ts.parseConfigFileTextToJson(tsconfigPath, tsconfigText);
if (tsconfigJson.error) {
  process.stderr.write(
    ts.formatDiagnosticsWithColorAndContext([tsconfigJson.error], {
      getCurrentDirectory: () => root,
      getCanonicalFileName: (f) => f,
      getNewLine: () => "\n",
    })
  );
  process.exit(2);
}

const configParse = ts.parseJsonConfigFileContent(
  tsconfigJson.config,
  ts.sys,
  root,
  undefined,
  tsconfigPath
);

const program = ts.createProgram({
  rootNames: configParse.fileNames,
  options: configParse.options,
});
const checker = program.getTypeChecker();

/** @type {Array<{file:string,line:number,col:number,functionName:string,paramName:string,kind:string}>} */
const findings = [];

function posToLineCol(sourceFile, pos) {
  const lc = sourceFile.getLineAndCharacterOfPosition(pos);
  return { line: lc.line + 1, col: lc.character + 1 };
}

function classify(filePath, functionName) {
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.includes("/src/app/api/") && normalized.endsWith("/route.ts")) {
    return "api-route";
  }
  if (normalized.includes("/hooks/") || /^use[A-Z0-9_]/.test(functionName)) {
    return "hook";
  }
  return "function";
}

/**
 * Extract binding identifiers from a parameter name (identifier or binding pattern)
 * @param {ts.BindingName} name
 * @returns {ts.Identifier[]}
 */
function getBindingIdentifiers(name) {
  /** @type {ts.Identifier[]} */
  const ids = [];
  const visit = (node) => {
    if (ts.isIdentifier(node)) {
      ids.push(node);
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(name);
  return ids;
}

/**
 * Determine whether a binding identifier is referenced in the function body or other parameter initializers.
 * @param {ts.Identifier} id
 * @param {ts.FunctionLikeDeclarationBase} fn
 */
function isIdentifierUsed(id, fn) {
  const sym = checker.getSymbolAtLocation(id);
  if (!sym) return false;

  /** @type {ts.Node[]} */
  const searchRoots = [];
  if (fn.body) searchRoots.push(fn.body);

  for (const p of fn.parameters) {
    if (p.initializer) searchRoots.push(p.initializer);
  }

  let used = false;
  const visit = (node) => {
    if (used) return;
    // Do not count the identifier in its own binding position as "usage".
    if (node === id) return;
    if (ts.isIdentifier(node)) {
      // ShorthandPropertyAssignment (e.g. { url }) is a usage of the variable.
      // TypeChecker.getSymbolAtLocation(node) can resolve to the property symbol,
      // so we must ask for the *value* symbol.
      const parent = node.parent;
      if (ts.isShorthandPropertyAssignment(parent) && parent.name === node) {
        const valueSym = checker.getShorthandAssignmentValueSymbol(parent);
        if (valueSym === sym) {
          used = true;
          return;
        }
      }

      const otherSym = checker.getSymbolAtLocation(node);
      if (otherSym === sym) {
        used = true;
        return;
      }
    }
    ts.forEachChild(node, visit);
  };

  for (const rootNode of searchRoots) {
    ts.forEachChild(rootNode, visit);
    if (used) break;
  }

  return used;
}

function getFunctionName(node) {
  if (node.name && ts.isIdentifier(node.name)) return node.name.text;
  // For variable-assigned functions, try to use parent name.
  if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) {
    return node.parent.name.text;
  }
  return "(anonymous)";
}

for (const sourceFile of program.getSourceFiles()) {
  const filePath = sourceFile.fileName.replace(/\\/g, "/");
  if (!filePath.includes("/src/")) continue;
  if (filePath.endsWith(".d.ts")) continue;

  const visit = (node) => {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node)
    ) {
      const fn = node;
      if (!fn.body) {
        ts.forEachChild(node, visit);
        return;
      }

      const functionName = getFunctionName(fn);
      const kind = classify(filePath, functionName);

      for (const param of fn.parameters) {
        const ids = getBindingIdentifiers(param.name);
        for (const id of ids) {
          const paramName = id.text;
          // Convention: underscore-prefixed means intentionally unused.
          if (paramName.startsWith("_")) continue;
          if (!isIdentifierUsed(id, fn)) {
            const { line, col } = posToLineCol(sourceFile, id.getStart(sourceFile));
            findings.push({
              file: filePath,
              line,
              col,
              functionName,
              paramName,
              kind,
            });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
}

findings.sort((a, b) =>
  a.file === b.file ? a.line - b.line || a.col - b.col : a.file.localeCompare(b.file)
);

const jsonPath = resolve(root, "orphan-params.json");
writeFileSync(
  jsonPath,
  JSON.stringify({ generatedAt: new Date().toISOString(), findings }, null, 2) + "\n"
);

const mdPath = resolve(root, "ORPHAN_PARAMS_REPORT.md");
const md = [
  "# Orphan (Unused) Parameters Report",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  `Total findings: ${findings.length}`,
  "",
  "## Findings",
  "",
  "| Kind | Function | Param | File | Line | Col |",
  "| --- | --- | --- | --- | ---:| ---:|",
  ...findings.map((f) => {
    const fn = String(f.functionName).replace(/\|/g, "\\|");
    const pn = String(f.paramName).replace(/\|/g, "\\|");
    return `| ${f.kind} | ${fn} | ${pn} | ${f.file} | ${f.line} | ${f.col} |`;
  }),
  "",
  "## Notes",
  "",
  "- This scanner uses the TypeScript AST and catches unused destructured parameters too.",
  "- Intentionally-unused parameters should be prefixed with `_` (e.g. `_req`, `_ctx`).",
  "",
].join("\n");
writeFileSync(mdPath, md);

if (findings.length > 0) {
  process.stderr.write(
    `Found ${findings.length} orphan parameter(s). Report written to ${mdPath}\n`
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `No orphan parameters found. Report written to ${mdPath}\n`
  );
}
