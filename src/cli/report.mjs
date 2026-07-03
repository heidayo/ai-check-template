import { CliError } from "./utils.mjs";

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
