import fs from "node:fs/promises";
import path from "node:path";
import { CliError, pathExists } from "./utils.mjs";

// SPEC-0058: `.ai-check.yaml` / `.ai-check.json` は利用者所有・installer 非管理。
// managed-files.mjs の一覧には決して追加しない（FR-08 / INV-01）。
export const CONFIG_YAML_NAME = ".ai-check.yaml";
export const CONFIG_JSON_NAME = ".ai-check.json";

// FR-03: gate 名 ↔ package script 名の対応。3 ゲート名以外の --script では config を参照しない。
export const GATE_BY_SCRIPT = {
  "ai:check": "full",
  "ai:check:fast": "fast",
  "ai:check:secure": "secure",
};

const KNOWN_GATES = ["fast", "full", "secure"];
const STEP_NAME_PATTERN = /^[a-z][a-z0-9:_-]*$/;
const STEP_KEYS = ["command", "enabled", "gates"];
const YAML_SUBSET_HINT =
  "The .ai-check.yaml parser supports only a minimal YAML subset (version line, steps mapping, scalar key: value pairs, and inline gate arrays like [fast, full]). Use .ai-check.json for anything else.";

export function resolveGate(script) {
  return GATE_BY_SCRIPT[script] ?? null;
}

export function stepsForGate(steps, gate) {
  return steps.filter((step) => step.gates.includes(gate));
}

// FR-01 / PRE-01: 検出は targetDir 直下のみ（存在チェック 2 回 — NFR-03）。
// 戻り値: config 不在なら null、存在すれば { configPath, fileName, steps }。
// FR-07: パース・validation 失敗は CliError で fail-fast（silent フォールバック禁止）。
export async function loadCheckConfig(targetDir) {
  const yamlPath = path.join(targetDir, CONFIG_YAML_NAME);
  const jsonPath = path.join(targetDir, CONFIG_JSON_NAME);
  const [hasYaml, hasJson] = await Promise.all([pathExists(yamlPath), pathExists(jsonPath)]);

  // 想定エラー4: 併存はどちらを意図したか判別できないためエラー。
  if (hasYaml && hasJson) {
    throw new CliError(
      `Both ${CONFIG_YAML_NAME} and ${CONFIG_JSON_NAME} exist in ${targetDir}. Delete one of them so the intended configuration is unambiguous.`,
    );
  }

  if (!hasYaml && !hasJson) {
    return null;
  }

  const configPath = hasYaml ? yamlPath : jsonPath;
  const fileName = path.basename(configPath);
  const content = await fs.readFile(configPath, "utf8");
  const raw = hasYaml ? parseConfigYaml(content, fileName) : parseConfigJson(content, fileName);
  const steps = validateCheckConfig(raw, fileName);

  return { configPath, fileName, steps };
}

function parseConfigJson(content, fileName) {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new CliError(`${fileName}: invalid JSON: ${error.message}`);
  }
}

// FR-02 / FR-07: スキーマ version 1 の validation。YAML / JSON 共通（AC-04 の等価性の根拠）。
// 戻り値は宣言順の step リスト（POST-02）。
export function validateCheckConfig(raw, fileName) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new CliError(`${fileName}: config root must be a mapping with "version" and "steps"`);
  }

  for (const key of Object.keys(raw)) {
    if (key !== "version" && key !== "steps") {
      throw new CliError(`${fileName}: unknown top-level key "${key}" (allowed: version, steps)`);
    }
  }

  if (raw.version !== 1) {
    throw new CliError(`${fileName}: "version" must be 1 (got ${JSON.stringify(raw.version ?? null)})`);
  }

  const stepsValue = raw.steps;
  if (!stepsValue || typeof stepsValue !== "object" || Array.isArray(stepsValue)) {
    throw new CliError(`${fileName}: "steps" must be a mapping of step name to step definition`);
  }

  const names = Object.keys(stepsValue);
  if (names.length === 0) {
    throw new CliError(`${fileName}: "steps" must declare at least one step`);
  }

  const steps = [];
  for (const name of names) {
    if (!STEP_NAME_PATTERN.test(name)) {
      throw new CliError(`${fileName}: invalid step name "${name}" (must match [a-z][a-z0-9:_-]*)`);
    }

    const step = stepsValue[name];
    if (!step || typeof step !== "object" || Array.isArray(step)) {
      throw new CliError(`${fileName}: step "${name}" must be a mapping with a "gates" array`);
    }

    for (const key of Object.keys(step)) {
      if (!STEP_KEYS.includes(key)) {
        throw new CliError(`${fileName}: step "${name}" has unknown key "${key}" (allowed: command, enabled, gates)`);
      }
    }

    if (!Array.isArray(step.gates) || step.gates.length === 0) {
      throw new CliError(`${fileName}: step "${name}" needs "gates" as a non-empty array of fast|full|secure`);
    }
    for (const gate of step.gates) {
      if (!KNOWN_GATES.includes(gate)) {
        throw new CliError(`${fileName}: step "${name}" has unknown gate value ${JSON.stringify(gate)} (allowed: fast, full, secure)`);
      }
    }

    if (step.command !== undefined && (typeof step.command !== "string" || step.command.trim().length === 0)) {
      throw new CliError(`${fileName}: step "${name}" has an empty or non-string "command" (omit it to reuse the package script "${name}", or set a non-empty command)`);
    }

    if (step.enabled !== undefined && typeof step.enabled !== "boolean") {
      throw new CliError(`${fileName}: step "${name}" has a non-boolean "enabled" (use true or false)`);
    }

    steps.push({
      name,
      command: step.command ?? null,
      enabled: step.enabled ?? true,
      gates: [...step.gates],
    });
  }

  return steps;
}

// 想定エラー1 / リスク2: サブセット外の構造は `.ai-check.json` 案内付きで拒否する。
// expect.mjs parseTemplateYaml() と同方針の独立実装（構造が異なるため共通化しない — SPEC 実装メモ）。
export function parseConfigYaml(content, fileName) {
  const root = {};
  let currentTopKey = null;
  let currentStepName = null;

  for (const rawLine of content.split(/\r?\n/)) {
    const withoutComment = rawLine.replace(/\s+#.*$/, "");
    const trimmed = withoutComment.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      continue;
    }
    if (withoutComment.includes("\t")) {
      throw new CliError(`${fileName}: tab indentation is not supported: ${trimmed}\n${YAML_SUBSET_HINT}`);
    }

    const indent = withoutComment.match(/^ */)[0].length;
    const [key, rawValue] = splitYamlKeyValue(trimmed, fileName);

    if (indent === 0) {
      if (Object.prototype.hasOwnProperty.call(root, key)) {
        throw new CliError(`${fileName}: duplicate top-level key "${key}"`);
      }
      if (rawValue === "") {
        root[key] = {};
        currentTopKey = key;
      } else {
        root[key] = parseYamlScalar(rawValue);
        currentTopKey = null;
      }
      currentStepName = null;
      continue;
    }

    if (indent === 2) {
      if (currentTopKey === null) {
        throw new CliError(`${fileName}: nested value without parent mapping: ${trimmed}\n${YAML_SUBSET_HINT}`);
      }
      if (rawValue !== "") {
        throw new CliError(`${fileName}: step entries must be nested mappings, not inline values: ${trimmed}\n${YAML_SUBSET_HINT}`);
      }
      if (Object.prototype.hasOwnProperty.call(root[currentTopKey], key)) {
        throw new CliError(`${fileName}: duplicate step name "${key}"`);
      }
      root[currentTopKey][key] = {};
      currentStepName = key;
      continue;
    }

    if (indent === 4) {
      if (currentTopKey === null || currentStepName === null) {
        throw new CliError(`${fileName}: nested value without parent step: ${trimmed}\n${YAML_SUBSET_HINT}`);
      }
      if (rawValue === "") {
        throw new CliError(`${fileName}: nesting deeper than "steps.<name>.<key>: <value>" is not supported: ${trimmed}\n${YAML_SUBSET_HINT}`);
      }
      const step = root[currentTopKey][currentStepName];
      if (Object.prototype.hasOwnProperty.call(step, key)) {
        throw new CliError(`${fileName}: duplicate key "${key}" in step "${currentStepName}"`);
      }
      step[key] = parseYamlScalar(rawValue);
      continue;
    }

    throw new CliError(`${fileName}: unsupported indentation (${indent} spaces): ${trimmed}\n${YAML_SUBSET_HINT}`);
  }

  return root;
}

function splitYamlKeyValue(line, fileName) {
  // step 名は `:` を含み得る（例: test:unit）ため、「行末の `:`」または「`: ` 区切り」で分割する。
  const match = line.match(/^(\S+?):(?:\s+(.*))?$/);
  if (!match) {
    throw new CliError(`${fileName}: expected "key: value" or "key:" line: ${line}\n${YAML_SUBSET_HINT}`);
  }
  return [match[1], (match[2] ?? "").trim()];
}

function parseYamlScalar(value) {
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (inner === "") {
      return [];
    }
    return inner.split(",").map((part) => parseYamlScalar(part.trim()));
  }
  const quoted = value.match(/^"(.*)"$/) ?? value.match(/^'(.*)'$/);
  if (quoted) {
    return quoted[1];
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (/^-?\d+$/.test(value)) {
    return Number(value);
  }
  return value;
}
