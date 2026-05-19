import fs from "node:fs/promises";
import path from "node:path";
import { CliError, pathExists, resolveTarget, writeLine } from "./utils.mjs";

const EXPECT_USAGE = `ai-check-template expect

Usage:
  ai-check-template expect --file <path> [options]

Options:
  --file <path>        JSON or template-subset YAML AC/Test Matrix file.
  --json               Print machine-readable JSON output.`;

export async function runExpect(argv, io = {}) {
  const options = parseExpectArgs(argv, io.cwd ?? process.cwd());

  if (options.help) {
    writeLine(io.stdout, EXPECT_USAGE);
    return;
  }

  if (!options.file) {
    throw new CliError(`Missing --file\n\n${EXPECT_USAGE}`);
  }

  const result = await validateExpectationFile(options.file);
  if (options.json) {
    writeLine(io.stdout, JSON.stringify(result, null, 2));
  } else {
    writeHumanOutput(io.stdout, result);
  }

  if (result.status === "fail") {
    throw new CliError(`expect validation failed: ${options.file}`, 1);
  }
}

function parseExpectArgs(argv, cwd) {
  const options = { file: null, json: false, help: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg.startsWith("--file=")) {
      options.file = resolveTarget(arg.slice("--file=".length), cwd);
      continue;
    }
    if (arg === "--file") {
      options.file = resolveTarget(readFlagValue(argv, (index += 1), arg), cwd);
      continue;
    }
    throw new CliError(`Unknown expect option: ${arg}\n\n${EXPECT_USAGE}`);
  }

  return options;
}

function readFlagValue(argv, index, flagName) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new CliError(`Missing value for ${flagName}`);
  }
  return value;
}

async function validateExpectationFile(filePath) {
  if (!(await pathExists(filePath))) {
    throw new CliError(`Expectation file does not exist: ${filePath}`);
  }

  const content = await fs.readFile(filePath, "utf8");
  const extension = path.extname(filePath).toLowerCase();
  const parseResult = parseExpectationContent(content, extension);
  const issues = parseResult.issues.length > 0 ? parseResult.issues : validateExpectation(parseResult.value);

  return {
    status: issues.length === 0 ? "pass" : "fail",
    file: filePath,
    summary: parseResult.value ? summarize(parseResult.value) : null,
    issues,
  };
}

function parseExpectationContent(content, extension) {
  try {
    if (extension === ".json") {
      return { value: JSON.parse(content), issues: [] };
    }
    if (extension === ".yaml" || extension === ".yml") {
      return { value: parseTemplateYaml(content), issues: [] };
    }
  } catch (error) {
    return { value: null, issues: [issue("invalid-format", error.message)] };
  }

  return { value: null, issues: [issue("unsupported-extension", "Expected .json, .yaml, or .yml")] };
}

function validateExpectation(value) {
  const issues = [];
  const requirement = value?.requirement;
  if (!requirement || typeof requirement !== "object") {
    issues.push(issue("missing-requirement", "Missing requirement object"));
  } else {
    requireString(requirement, "id", "requirement", issues);
    requireString(requirement, "summary", "requirement", issues);
  }

  const acceptanceCriteria = Array.isArray(value?.acceptanceCriteria) ? value.acceptanceCriteria : null;
  if (!acceptanceCriteria || acceptanceCriteria.length === 0) {
    issues.push(issue("missing-acceptance-criteria", "acceptanceCriteria must be a non-empty array"));
  }

  const testMatrix = Array.isArray(value?.testMatrix) ? value.testMatrix : null;
  if (!testMatrix || testMatrix.length === 0) {
    issues.push(issue("missing-test-matrix", "testMatrix must be a non-empty array"));
  }

  if (!acceptanceCriteria || !testMatrix) {
    return issues;
  }

  const acIds = new Set();
  for (const [index, criterion] of acceptanceCriteria.entries()) {
    const pathLabel = `acceptanceCriteria[${index}]`;
    requireString(criterion, "id", pathLabel, issues);
    requireString(criterion, "criterion", pathLabel, issues);
    requireString(criterion, "command", pathLabel, issues);
    if (criterion?.id) {
      if (acIds.has(criterion.id)) {
        issues.push(issue("duplicate-ac", `Duplicate AC id: ${criterion.id}`));
      }
      acIds.add(criterion.id);
    }
  }

  const referencedAcIds = new Set();
  for (const [index, row] of testMatrix.entries()) {
    const pathLabel = `testMatrix[${index}]`;
    requireString(row, "id", pathLabel, issues);
    requireString(row, "ac", pathLabel, issues);
    requireString(row, "scenario", pathLabel, issues);
    requireString(row, "given", pathLabel, issues);
    requireString(row, "when", pathLabel, issues);
    requireString(row, "then", pathLabel, issues);
    requireString(row, "command", pathLabel, issues);
    if (row?.ac) {
      if (!acIds.has(row.ac)) {
        issues.push(issue("unknown-ac-reference", `${pathLabel}.ac references unknown AC: ${row.ac}`));
      }
      referencedAcIds.add(row.ac);
    }
  }

  for (const acId of acIds) {
    if (!referencedAcIds.has(acId)) {
      issues.push(issue("uncovered-ac", `No testMatrix row covers AC: ${acId}`));
    }
  }

  return issues;
}

function requireString(value, key, label, issues) {
  if (!value || typeof value[key] !== "string" || value[key].trim().length === 0) {
    issues.push(issue("missing-field", `${label}.${key} must be a non-empty string`));
  }
}

function summarize(value) {
  return {
    requirement: value.requirement?.id ?? null,
    acceptanceCriteria: Array.isArray(value.acceptanceCriteria) ? value.acceptanceCriteria.length : 0,
    testMatrix: Array.isArray(value.testMatrix) ? value.testMatrix.length : 0,
  };
}

function issue(code, message) {
  return { code, message };
}

function parseTemplateYaml(content) {
  const root = {};
  let currentTopKey = null;
  let currentListItem = null;

  for (const rawLine of content.split(/\r?\n/)) {
    const withoutComment = rawLine.replace(/\s+#.*$/, "");
    if (withoutComment.trim().length === 0) {
      continue;
    }

    const indent = withoutComment.match(/^\s*/)[0].length;
    const line = withoutComment.trim();

    if (indent === 0) {
      const [key, rawValue] = splitYamlKeyValue(line);
      root[key] = rawValue === "" ? null : unquote(rawValue);
      currentTopKey = rawValue === "" ? key : null;
      currentListItem = null;
      continue;
    }

    if (!currentTopKey) {
      throw new Error(`Nested value without parent: ${line}`);
    }

    if (indent === 2 && line.startsWith("- ")) {
      if (!Array.isArray(root[currentTopKey])) {
        root[currentTopKey] = [];
      }
      currentListItem = {};
      root[currentTopKey].push(currentListItem);
      const remainder = line.slice(2).trim();
      if (remainder) {
        const [key, rawValue] = splitYamlKeyValue(remainder);
        currentListItem[key] = unquote(rawValue);
      }
      continue;
    }

    if (indent === 2) {
      if (!root[currentTopKey] || Array.isArray(root[currentTopKey])) {
        root[currentTopKey] = {};
      }
      const [key, rawValue] = splitYamlKeyValue(line);
      root[currentTopKey][key] = unquote(rawValue);
      continue;
    }

    if (indent === 4 && currentListItem) {
      const [key, rawValue] = splitYamlKeyValue(line);
      currentListItem[key] = unquote(rawValue);
      continue;
    }

    throw new Error(`Unsupported YAML shape: ${line}`);
  }

  return root;
}

function splitYamlKeyValue(line) {
  const separator = line.indexOf(":");
  if (separator === -1) {
    throw new Error(`Expected key: value line: ${line}`);
  }
  return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
}

function unquote(value) {
  return value.replace(/^["']|["']$/g, "");
}

function writeHumanOutput(stream, result) {
  writeLine(stream, `ai-check-template expect ${result.status}`);
  writeLine(stream, `file: ${result.file}`);
  if (result.summary) {
    writeLine(stream, `requirement: ${result.summary.requirement}`);
    writeLine(stream, `acceptanceCriteria: ${result.summary.acceptanceCriteria}`);
    writeLine(stream, `testMatrix: ${result.summary.testMatrix}`);
  }
  for (const currentIssue of result.issues) {
    writeLine(stream, `- ${currentIssue.code}: ${currentIssue.message}`);
  }
}
