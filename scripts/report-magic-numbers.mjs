import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    input: "magic-numbers.eslint.json",
    output: "MAGIC_NUMBERS_REPORT.md",
    command: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--input" && argv[i + 1]) args.input = argv[++i];
    else if (token === "--output" && argv[i + 1]) args.output = argv[++i];
    else if (token === "--command" && argv[i + 1]) args.command = argv[++i];
  }
  return args;
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function relFromRepo(absOrRel, repoRoot) {
  const abs = path.isAbsolute(absOrRel) ? absOrRel : path.join(repoRoot, absOrRel);
  return toPosix(path.relative(repoRoot, abs));
}

const repoRoot = process.cwd();
const { input, output, command } = parseArgs(process.argv);

const raw = fs.readFileSync(path.isAbsolute(input) ? input : path.join(repoRoot, input), "utf8");
/** @type {Array<{filePath:string, messages:Array<{ruleId?:string, message:string, line:number, column:number}>}>} */
const results = JSON.parse(raw);

const byFile = new Map();
let totalHits = 0;

for (const file of results) {
  const hits = (file.messages || []).filter((m) => m.ruleId === "no-magic-numbers");
  if (hits.length === 0) continue;
  const rel = relFromRepo(file.filePath, repoRoot);
  byFile.set(rel, hits);
  totalHits += hits.length;
}

const files = Array.from(byFile.entries()).sort((a, b) => b[1].length - a[1].length);

const lines = [];
lines.push(`# Magic number scan (src/**)`);
lines.push("");
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push("");
lines.push("Command:");
lines.push(
  `\`${
    command ??
    "npx eslint \"src/**/*.{ts,tsx,js,jsx}\" --rule 'no-magic-numbers:[\\\"error\\\",{\\\"ignore\\\":[],\\\"ignoreArrayIndexes\\\":false,\\\"ignoreDefaultValues\\\":false,\\\"enforceConst\\\":false,\\\"detectObjects\\\":true}]' -f json -o magic-numbers.eslint.json"
  }\``,
);
lines.push("");
lines.push(`- Files with findings: ${files.length}`);
lines.push(`- Total \`no-magic-numbers\` findings: ${totalHits}`);
lines.push("");
lines.push("## Top files");
lines.push("");
lines.push("| File | Findings |");
lines.push("|---|---:|");
for (const [file, hits] of files.slice(0, 25)) {
  lines.push(`| [${file}](${encodeURI(file)}) | ${hits.length} |`);
}
lines.push("");
lines.push("## All findings (grouped by file)");
lines.push("");

for (const [file, hits] of files) {
  lines.push(`### ${file}`);
  lines.push("");
  for (const m of hits) {
    const loc = `[${file}#L${m.line}](${encodeURI(`${file}#L${m.line}`)})`;
    const msg = String(m.message || "").replace(/\s+/g, " ").trim();
    lines.push(`- ${loc}:${m.column} — ${msg}`);
  }
  lines.push("");
}

fs.writeFileSync(path.isAbsolute(output) ? output : path.join(repoRoot, output), lines.join("\n"), "utf8");
console.log(`Wrote ${output} with ${totalHits} findings across ${files.length} files.`);
