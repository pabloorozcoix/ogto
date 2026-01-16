import { spawnSync } from "node:child_process";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    target: "src/**/*.{ts,tsx,js,jsx}",
    outJson: "magic-numbers.filtered.eslint.json",
    outMd: "MAGIC_NUMBERS_REPORT.filtered.md",
    ignoreCommon: true,
    ignoreHttp: true,
    ignoreTimeouts: true,
    ignore: [],
  };

  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];

    if (token === "--target" && argv[i + 1]) args.target = argv[++i];
    else if (token === "--out-json" && argv[i + 1]) args.outJson = argv[++i];
    else if (token === "--out-md" && argv[i + 1]) args.outMd = argv[++i];
    else if (token === "--ignore" && argv[i + 1]) {
      const raw = argv[++i];
      const values = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => Number(s))
        .filter((n) => Number.isFinite(n));
      args.ignore.push(...values);
    } else if (token === "--no-ignore-common") args.ignoreCommon = false;
    else if (token === "--no-ignore-http") args.ignoreHttp = false;
    else if (token === "--no-ignore-timeouts") args.ignoreTimeouts = false;
  }

  return args;
}

const argv = parseArgs(process.argv);

const ignore = new Set(argv.ignore);

// Common low-signal literals that often appear in code.
if (argv.ignoreCommon) {
  [0, 1, -1].forEach((n) => ignore.add(n));
}

// Common HTTP status codes.
if (argv.ignoreHttp) {
  [
    200, 201, 202, 204,
    301, 302, 304,
    400, 401, 403, 404, 409, 410, 412, 413, 415, 418, 422, 429,
    500, 501, 502, 503, 504,
  ].forEach((n) => ignore.add(n));
}

// Common timeouts (ms) used in UI / networking.
if (argv.ignoreTimeouts) {
  [
    50, 100, 150, 200, 250, 300, 400, 500,
    750, 1000, 1500, 2000, 3000, 5000, 8000,
    10000, 15000, 20000, 30000, 60000,
  ].forEach((n) => ignore.add(n));
}

const ignoreList = Array.from(ignore);

const ruleOptions = {
  ignore: ignoreList,
  // These reduce noise a lot for UIs and data transforms.
  ignoreArrayIndexes: true,
  ignoreDefaultValues: true,
  enforceConst: false,
  detectObjects: true,
};

const rule = `no-magic-numbers:["error",${JSON.stringify(ruleOptions)}]`;

const commandString = `npx eslint "${argv.target}" --rule '${rule}' -f json -o ${argv.outJson}`;

const outJson = path.resolve(process.cwd(), argv.outJson);
const outMd = path.resolve(process.cwd(), argv.outMd);

console.log("Scanning for magic numbers with ignores:");
console.log(`- target: ${argv.target}`);
console.log(`- outJson: ${argv.outJson}`);
console.log(`- outMd: ${argv.outMd}`);
console.log(`- ignore count: ${ignoreList.length}`);

// ESLint exits with code 1 when it finds errors; we still want the JSON report.
spawnSync(
  "npx",
  [
    "eslint",
    argv.target,
    "--ignore-pattern",
    "**/constants.ts",
    "--ignore-pattern",
    "**/constants.tsx",
    "--ignore-pattern",
    "src/lib/constants.ts",
    "--rule",
    rule,
    "-f",
    "json",
    "-o",
    outJson,
  ],
  { stdio: "inherit" },
);

spawnSync(
  "node",
  [
    "scripts/report-magic-numbers.mjs",
    "--input",
    outJson,
    "--output",
    outMd,
    "--command",
    commandString,
  ],
  { stdio: "inherit" },
);
