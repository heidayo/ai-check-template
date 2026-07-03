import fs from "node:fs/promises";
import path from "node:path";
import { parseExpectationContent, validateExpectation } from "./expect.mjs";
import { CliError, pathExists, writeLine } from "./utils.mjs";

const REPORT_USAGE = `ai-check-template report

Usage:
  ai-check-template report --expect <file> --run <file> [options]

Options:
  --expect <file>      JSON or template-subset YAML AC/Test Matrix file.
  --run <file>         Run result JSON written by run --output / run --json.
  --format <name>      Output format: text (default), markdown, or json.
  --json               Alias for --format json.
  --strict             Exit non-zero when any AC is FAIL or UNVERIFIED.`;

const REPORT_FORMATS = new Set(["text", "markdown", "json"]);

export async function runReport(argv, io = {}) {
  const options = parseReportArgs(argv);

  if (options.help) {
    writeLine(io.stdout, REPORT_USAGE);
    return;
  }

  // FR-01: both inputs are mandatory.
  if (!options.expect) {
    throw new CliError(`Missing --expect\n\n${REPORT_USAGE}`);
  }
  if (!options.run) {
    throw new CliError(`Missing --run\n\n${REPORT_USAGE}`);
  }

  // FR-02 / INV-04: reuse the expect validation; fail before any matching output.
  const expectValue = await loadExpectation(options.expect);
  const runResult = await readRunResult(options.run);
  checkRunResult(runResult, options.run);

  const report = buildReport({
    expectValue,
    runResult,
    expectFile: options.expect,
    runFile: options.run,
  });

  if (options.format === "json") {
    writeLine(io.stdout, JSON.stringify(report, null, 2));
  } else if (options.format === "markdown") {
    writeLine(io.stdout, formatMarkdown(report));
  } else {
    writeTextOutput(io.stdout, report);
  }

  // FR-07 / POST-01: strict gate evaluated after the report is printed.
  if (options.strict && (report.summary.failed > 0 || report.summary.unverified > 0)) {
    throw new CliError(
      `report --strict: ${report.summary.failed} FAIL / ${report.summary.unverified} UNVERIFIED acceptance criteria`,
      1,
    );
  }
}

function parseReportArgs(argv) {
  const options = { expect: null, run: null, format: "text", strict: false, help: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--json") {
      options.format = "json";
      continue;
    }
    if (arg === "--strict") {
      options.strict = true;
      continue;
    }
    if (arg.startsWith("--expect=")) {
      options.expect = arg.slice("--expect=".length);
      continue;
    }
    if (arg === "--expect") {
      options.expect = readFlagValue(argv, (index += 1), arg);
      continue;
    }
    if (arg.startsWith("--run=")) {
      options.run = arg.slice("--run=".length);
      continue;
    }
    if (arg === "--run") {
      options.run = readFlagValue(argv, (index += 1), arg);
      continue;
    }
    if (arg.startsWith("--format=")) {
      options.format = parseFormat(arg.slice("--format=".length));
      continue;
    }
    if (arg === "--format") {
      options.format = parseFormat(readFlagValue(argv, (index += 1), arg));
      continue;
    }
    throw new CliError(`Unknown report option: ${arg}\n\n${REPORT_USAGE}`);
  }

  return options;
}

function parseFormat(value) {
  if (!REPORT_FORMATS.has(value)) {
    throw new CliError(`Unknown report format: ${value}\n\n${REPORT_USAGE}`);
  }
  return value;
}

function readFlagValue(argv, index, flagName) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new CliError(`Missing value for ${flagName}`);
  }
  return value;
}

// FR-02: same parse + validation as `expect`; validation issues are reported
// in the same issue-list form and abort before any matching output (INV-04).
async function loadExpectation(expectFile) {
  if (!(await pathExists(expectFile))) {
    throw new CliError(`Expectation file does not exist: ${expectFile}`);
  }
  const content = await fs.readFile(expectFile, "utf8");
  const parseResult = parseExpectationContent(content, path.extname(expectFile).toLowerCase());
  const issues = parseResult.issues.length > 0 ? parseResult.issues : validateExpectation(parseResult.value);
  if (issues.length > 0) {
    const issueLines = issues.map((entry) => `- ${entry.code}: ${entry.message}`).join("\n");
    throw new CliError(`Invalid expectation file: ${expectFile}\n${issueLines}`, 1);
  }
  return parseResult.value;
}

async function readRunResult(runFile) {
  if (!(await pathExists(runFile))) {
    throw new CliError(`Run result file does not exist: ${runFile}`);
  }
  try {
    return JSON.parse(await fs.readFile(runFile, "utf8"));
  } catch (error) {
    throw new CliError(`Invalid run result JSON: ${runFile}\n- ${error.message}\n${REGENERATE_HINT}`, 1);
  }
}

// FR-03 (SPEC-0059): hand-written structure check mirroring
// package-templates/docs/run-result.schema.json (kept in sync by the AC-07
// schema regression test — the schema file itself is not read at runtime).
const RUN_ROOT_FIELDS = [
  ["status", isRunRootStatus, 'must be "PASS" or "FAIL"'],
  ["script", isNonEmptyString, "must be a non-empty string"],
  ["command", isNonEmptyString, "must be a non-empty string"],
  ["startedAt", isNonEmptyString, "must be a non-empty string"],
  ["durationMs", isNumber, "must be a number"],
  ["configPath", isStringOrNull, "must be a string or null"],
];

const RUN_STEP_FIELDS = [
  ["index", isInteger, "must be an integer"],
  ["name", isNonEmptyString, "must be a non-empty string"],
  ["source", isStepSource, 'must be "config" or "default"'],
  ["command", isNonEmptyString, "must be a non-empty string"],
  ["status", isStepStatus, 'must be "PASS", "FAIL", or "SKIPPED"'],
  ["exitCode", isIntegerOrNull, "must be an integer or null"],
  ["durationMs", isNumber, "must be a number"],
  ["stdout", isString, "must be a string"],
  ["stderr", isString, "must be a string"],
];

const REGENERATE_HINT = "Regenerate the run result with: ai-check-template run --output <file>";

function isString(value) {
  return typeof value === "string";
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringOrNull(value) {
  return value === null || typeof value === "string";
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isInteger(value) {
  return Number.isInteger(value);
}

function isIntegerOrNull(value) {
  return value === null || Number.isInteger(value);
}

function isRunRootStatus(value) {
  return value === "PASS" || value === "FAIL";
}

function isStepSource(value) {
  return value === "config" || value === "default";
}

function isStepStatus(value) {
  return value === "PASS" || value === "FAIL" || value === "SKIPPED";
}

// FR-03 / INV-04 (SPEC-0059): fail fast on any structural mismatch so a report
// is never produced from an input that is not a `run --json` result.
export function checkRunResult(runResult, runFile) {
  const problems = [];

  if (!runResult || typeof runResult !== "object" || Array.isArray(runResult)) {
    fail(runFile, ["run result must be a JSON object"]);
  }

  for (const [key, check, expectation] of RUN_ROOT_FIELDS) {
    if (!(key in runResult)) {
      problems.push(`missing required field: ${key}`);
    } else if (!check(runResult[key])) {
      problems.push(`${key} ${expectation}`);
    }
  }

  if (!Array.isArray(runResult.steps)) {
    problems.push("steps must be an array");
    fail(runFile, problems);
  }

  for (const [index, step] of runResult.steps.entries()) {
    if (!step || typeof step !== "object" || Array.isArray(step)) {
      problems.push(`steps[${index}] must be an object`);
      continue;
    }
    for (const [key, check, expectation] of RUN_STEP_FIELDS) {
      if (!(key in step)) {
        problems.push(`steps[${index}].${key} is missing`);
      } else if (!check(step[key])) {
        problems.push(`steps[${index}].${key} ${expectation}`);
      }
    }
  }

  if (problems.length > 0) {
    fail(runFile, problems);
  }

  // 想定エラー3 (SPEC-0059): duplicate step names break explicit-key matching.
  const seen = new Set();
  const duplicates = new Set();
  for (const step of runResult.steps) {
    if (seen.has(step.name)) {
      duplicates.add(step.name);
    }
    seen.add(step.name);
  }
  if (duplicates.size > 0) {
    fail(runFile, [`duplicate step name(s): ${[...duplicates].join(", ")}`]);
  }
}

function fail(runFile, problems) {
  throw new CliError(
    `Invalid run result JSON: ${runFile}\n${problems.map((problem) => `- ${problem}`).join("\n")}\n${REGENERATE_HINT}`,
    1,
  );
}

// FR-04 (SPEC-0059): explicit keys only — AC `step` must equal a step `name`
// exactly; without `step`, the AC `command` must match exactly one step
// `command` after trim. No fuzzy matching of any kind.
export function matchCriterion(criterion, steps) {
  if (typeof criterion.step === "string") {
    const matched = steps.find((step) => step.name === criterion.step) ?? null;
    return matched
      ? { step: matched, reason: "matched-step" }
      : { step: null, reason: "no-match" };
  }

  const command = criterion.command.trim();
  const matches = steps.filter((step) => step.command.trim() === command);
  if (matches.length === 1) {
    return { step: matches[0], reason: "matched-command" };
  }
  return { step: null, reason: matches.length === 0 ? "no-match" : "ambiguous-command" };
}

// FR-05 (SPEC-0059): PASS / FAIL / UNVERIFIED (no match or SKIPPED step).
function verdictFor(matchedStep) {
  if (!matchedStep || matchedStep.status === "SKIPPED") {
    return "UNVERIFIED";
  }
  return matchedStep.status === "PASS" ? "PASS" : "FAIL";
}

// 契約 (1) (SPEC-0059): report JSON — status / expectFile / runFile / summary /
// criteria[]. SEC-02: step stdout/stderr never enter the result.
export function buildReport({ expectValue, runResult, expectFile, runFile }) {
  const criteria = expectValue.acceptanceCriteria.map((criterion) => {
    const { step, reason } = matchCriterion(criterion, runResult.steps);
    return {
      id: criterion.id,
      criterion: criterion.criterion,
      step: step ? step.name : null,
      command: criterion.command,
      verdict: verdictFor(step),
      reason,
    };
  });

  const summary = {
    total: criteria.length,
    passed: criteria.filter((entry) => entry.verdict === "PASS").length,
    failed: criteria.filter((entry) => entry.verdict === "FAIL").length,
    unverified: criteria.filter((entry) => entry.verdict === "UNVERIFIED").length,
  };

  return {
    status: summary.failed === 0 && summary.unverified === 0 ? "pass" : "fail",
    expectFile,
    runFile,
    summary,
    criteria,
  };
}

function verifiedCount(summary) {
  // 検証済み = actually measured (PASS or FAIL); UNVERIFIED is unmeasured.
  return summary.passed + summary.failed;
}

// FR-06 / POST-02 (SPEC-0059): GFM table (one row per AC) + summary line.
// SEC-02: only AC id / criterion / step name / command / verdict appear.
export function formatMarkdown(report) {
  const escape = (value) => String(value).replace(/\|/g, "\\|");
  const lines = [
    "| AC | 宣言内容 | 対応 step / コマンド | 判定 |",
    "|---|---|---|---|",
  ];
  for (const entry of report.criteria) {
    const target = entry.step ?? `\`${entry.command}\``;
    lines.push(`| ${escape(entry.id)} | ${escape(entry.criterion)} | ${escape(target)} | ${entry.verdict} |`);
  }
  lines.push(`検証済み ${verifiedCount(report.summary)} / 宣言 ${report.summary.total}`);
  return lines.join("\n");
}

function writeTextOutput(stream, report) {
  writeLine(stream, `ai-check-template report ${report.status}`);
  writeLine(stream, `expect: ${report.expectFile}`);
  writeLine(stream, `run: ${report.runFile}`);
  for (const entry of report.criteria) {
    const target = entry.step ?? entry.command;
    writeLine(stream, `${entry.id} ${entry.verdict} (${entry.reason}) ${target}`);
  }
  const { summary } = report;
  writeLine(
    stream,
    `summary: total ${summary.total}, passed ${summary.passed}, failed ${summary.failed}, unverified ${summary.unverified}`,
  );
}
