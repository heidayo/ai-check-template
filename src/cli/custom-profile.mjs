import fs from "node:fs/promises";
import path from "node:path";
import { DEFAULT_PACKAGE_MANAGER, scriptCommand, validatePackageManager } from "./package-manager.mjs";
import { CliError } from "./utils.mjs";

// SPEC-0065: custom profile definition file. Opt-in via `--profile-file`, read
// on a path that branches BEFORE the built-in profile tables (profile.mjs /
// profile-scripts.mjs / dependency-installer.mjs), so custom names never reach
// the silent empty-scripts fallback in getProfileScripts (INV-03 / risk 2).
// This module never imports or references those built-in tables.
export const CUSTOM_PROFILE_YAML_NAME = ".ai-check-profile.yaml";
export const CUSTOM_PROFILE_JSON_NAME = ".ai-check-profile.json";

// FR-03 / FR-08: the three gate scripts a custom definition must cover, matching
// the built-in gate contract (profile-scripts.mjs GATE_SCRIPT_NAMES).
export const CUSTOM_GATE_SCRIPT_NAMES = ["ai:check", "ai:check:fast", "ai:check:secure"];

// SEC-03: the profile name and step names are embedded into generated
// package.json scripts and doc paths (profiles/custom-<name>/README.md), so a
// custom definition file (outside the trust boundary) is rejected fast when it
// carries shell metacharacters or path separators.
const PROFILE_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;
const STEP_NAME_PATTERN = /^[a-z][a-z0-9:_-]*$/;

// Built-in profile names: a custom definition must never reuse one (想定エラー3).
// Kept as a local literal so this module does not import the built-in registry
// (custom is resolved on a separate path from profile.mjs — INV-02 / INV-03).
const BUILT_IN_PROFILE_NAMES = new Set([
  "react-nextjs",
  "react-vanilla",
  "expo-rn",
  "node-cli",
  "supabase-rls",
]);

const YAML_SUBSET_HINT =
  "The .ai-check-profile.yaml parser supports only a minimal YAML subset "
  + "(version line, a `profile:` mapping, `gateScripts:` / `supportScripts:` mappings, "
  + "and a `devDependencies:` list of `- item` entries). Use .ai-check-profile.json for anything else.";

// FR-01 / FR-04: read + validate a custom profile definition file.
// Order (PRE-01 / 想定エラー1 / 想定エラー2): (1) SEC-02 path check →
// (2) extension detect → (3) read + parse → (4) schema v1 validation →
// (5) normalized snapshot. Every failure is a CliError with the file name and
// cause; a partial definition is never returned.
export async function loadCustomProfile(targetDir, profileFilePath) {
  const resolvedPath = resolveCustomProfilePath(targetDir, profileFilePath);
  const fileName = path.basename(resolvedPath);
  const parser = customProfileParserFor(fileName);

  let content;
  try {
    content = await fs.readFile(resolvedPath, "utf8");
  } catch (error) {
    throw new CliError(`Custom profile definition file not found: ${profileFilePath} (${error.message})`);
  }

  const raw = parser(content, fileName);
  const definition = validateCustomProfile(raw, fileName);

  return {
    name: definition.name,
    // Store the caller-supplied relative path so install state stays portable
    // (SEC-02 keeps it inside the target; absolute paths are rejected above).
    filePath: profileFilePath,
    definition: {
      gateScripts: definition.gateScripts,
      supportScripts: definition.supportScripts,
      devDependencies: definition.devDependencies,
    },
  };
}

// SEC-02: `--profile-file` (and any state-recorded filePath) must be a relative
// path that stays inside the target directory. Absolute paths and `..` segments
// are rejected before any filesystem read, so no read path escapes --target.
export function resolveCustomProfilePath(targetDir, profileFilePath) {
  if (typeof profileFilePath !== "string" || profileFilePath.length === 0) {
    throw new CliError("--profile-file requires a non-empty relative path");
  }

  if (path.isAbsolute(profileFilePath)) {
    throw new CliError(
      `--profile-file must be a relative path inside the target directory, got absolute path: ${profileFilePath}`,
    );
  }

  const normalizedInput = profileFilePath.split(path.sep).join("/");
  if (normalizedInput.split("/").includes("..")) {
    throw new CliError(
      `--profile-file must not contain ".." segments (path must stay inside the target): ${profileFilePath}`,
    );
  }

  const resolvedPath = path.resolve(targetDir, profileFilePath);
  const relativeToTarget = path.relative(targetDir, resolvedPath);
  if (relativeToTarget.startsWith("..") || path.isAbsolute(relativeToTarget)) {
    throw new CliError(
      `--profile-file must resolve to a path inside the target directory: ${profileFilePath}`,
    );
  }

  return resolvedPath;
}

function customProfileParserFor(fileName) {
  if (fileName.endsWith(".json")) {
    return parseCustomProfileJson;
  }
  if (fileName.endsWith(".yaml") || fileName.endsWith(".yml")) {
    return parseCustomProfileYaml;
  }
  throw new CliError(
    `--profile-file must be a ${CUSTOM_PROFILE_YAML_NAME} or ${CUSTOM_PROFILE_JSON_NAME} file (got: ${fileName})`,
  );
}

function parseCustomProfileJson(content, fileName) {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new CliError(`${fileName}: invalid JSON: ${error.message}`);
  }
}

// FR-03 / SEC-03: schema version 1 validation, fail-fast (validateCheckConfig
// same approach). Returns the normalized definition; a schema error never lets a
// definition reach the package.json writer (INV-06).
export function validateCustomProfile(raw, fileName) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new CliError(`${fileName}: definition root must be a mapping with "version" and "profile"`);
  }

  for (const key of Object.keys(raw)) {
    if (key !== "version" && key !== "profile") {
      throw new CliError(`${fileName}: unknown top-level key "${key}" (allowed: version, profile)`);
    }
  }

  if (raw.version !== 1) {
    throw new CliError(`${fileName}: "version" must be 1 (got ${JSON.stringify(raw.version ?? null)})`);
  }

  const profile = raw.profile;
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    throw new CliError(`${fileName}: "profile" must be a mapping with name, gateScripts, and supportScripts`);
  }

  const allowedProfileKeys = new Set(["name", "gateScripts", "supportScripts", "devDependencies"]);
  for (const key of Object.keys(profile)) {
    if (!allowedProfileKeys.has(key)) {
      throw new CliError(
        `${fileName}: profile has unknown key "${key}" (allowed: name, gateScripts, supportScripts, devDependencies)`,
      );
    }
  }

  const name = validateCustomProfileName(profile.name, fileName);
  const supportScripts = validateSupportScripts(profile.supportScripts, fileName);
  const gateScripts = validateGateScripts(profile.gateScripts, supportScripts, fileName);
  const devDependencies = validateDevDependencies(profile.devDependencies, fileName);

  return { name, gateScripts, supportScripts, devDependencies };
}

function validateCustomProfileName(name, fileName) {
  if (typeof name !== "string" || !PROFILE_NAME_PATTERN.test(name)) {
    throw new CliError(
      `${fileName}: profile.name must match [a-z][a-z0-9-]* (got ${JSON.stringify(name ?? null)})`,
    );
  }

  if (BUILT_IN_PROFILE_NAMES.has(name)) {
    throw new CliError(
      `${fileName}: profile.name "${name}" collides with a built-in profile. `
        + `Pick a different custom name (built-in: ${[...BUILT_IN_PROFILE_NAMES].join(", ")}).`,
    );
  }

  return name;
}

function validateSupportScripts(supportScripts, fileName) {
  if (!supportScripts || typeof supportScripts !== "object" || Array.isArray(supportScripts)) {
    throw new CliError(`${fileName}: profile.supportScripts must be a mapping of step name to command string`);
  }

  const names = Object.keys(supportScripts);
  if (names.length === 0) {
    throw new CliError(`${fileName}: profile.supportScripts must declare at least one step`);
  }

  const normalized = {};
  for (const name of names) {
    if (!STEP_NAME_PATTERN.test(name)) {
      throw new CliError(`${fileName}: invalid support script name "${name}" (must match [a-z][a-z0-9:_-]*)`);
    }

    const command = supportScripts[name];
    if (typeof command !== "string" || command.trim().length === 0) {
      throw new CliError(`${fileName}: support script "${name}" must be a non-empty command string`);
    }

    normalized[name] = command;
  }

  return normalized;
}

function validateGateScripts(gateScripts, supportScripts, fileName) {
  if (!gateScripts || typeof gateScripts !== "object" || Array.isArray(gateScripts)) {
    throw new CliError(
      `${fileName}: profile.gateScripts must be a mapping covering ${CUSTOM_GATE_SCRIPT_NAMES.join(", ")}`,
    );
  }

  for (const key of Object.keys(gateScripts)) {
    if (!CUSTOM_GATE_SCRIPT_NAMES.includes(key)) {
      throw new CliError(
        `${fileName}: profile.gateScripts has unknown gate "${key}" (allowed: ${CUSTOM_GATE_SCRIPT_NAMES.join(", ")})`,
      );
    }
  }

  const normalized = {};
  for (const gate of CUSTOM_GATE_SCRIPT_NAMES) {
    if (!Object.hasOwn(gateScripts, gate)) {
      throw new CliError(
        `${fileName}: profile.gateScripts is missing "${gate}" (all of ${CUSTOM_GATE_SCRIPT_NAMES.join(", ")} are required)`,
      );
    }

    normalized[gate] = normalizeGateValue(gateScripts[gate], gate, supportScripts, fileName);
  }

  return normalized;
}

// A gate value is either a command string (used as-is, PM-rendered later) or a
// list of step names (joined into canonical `pnpm <step> && ...`). Any step name
// referenced by a list must have an entry in supportScripts (FR-03 参照整合).
function normalizeGateValue(value, gate, supportScripts, fileName) {
  if (typeof value === "string") {
    if (value.trim().length === 0) {
      throw new CliError(`${fileName}: profile.gateScripts["${gate}"] must be a non-empty command string`);
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      throw new CliError(`${fileName}: profile.gateScripts["${gate}"] must list at least one step name`);
    }

    for (const step of value) {
      if (typeof step !== "string" || !STEP_NAME_PATTERN.test(step)) {
        throw new CliError(
          `${fileName}: profile.gateScripts["${gate}"] step ${JSON.stringify(step)} must match [a-z][a-z0-9:_-]*`,
        );
      }
      if (!Object.hasOwn(supportScripts, step)) {
        throw new CliError(
          `${fileName}: profile.gateScripts["${gate}"] references step "${step}" that is not defined in supportScripts`,
        );
      }
    }

    // Canonical `pnpm <step>` form so resolveCustomProfileScripts renders each
    // step per package manager in one pass (mirrors built-in gate rendering).
    return value.map((step) => `pnpm ${step}`).join(" && ");
  }

  throw new CliError(
    `${fileName}: profile.gateScripts["${gate}"] must be a command string or a list of step names`,
  );
}

function validateDevDependencies(devDependencies, fileName) {
  if (devDependencies === undefined) {
    return [];
  }

  if (!Array.isArray(devDependencies)) {
    throw new CliError(`${fileName}: profile.devDependencies must be an array of non-empty strings`);
  }

  return devDependencies.map((dependency) => {
    if (typeof dependency !== "string" || dependency.trim().length === 0) {
      throw new CliError(`${fileName}: profile.devDependencies entries must be non-empty strings`);
    }
    return dependency;
  });
}

// FR-05: render a resolved definition into the { gate + support } script set the
// init / update mergers consume. Gate scripts render `pnpm <step>` invocations
// per package manager (same transform as built-in renderScriptCommand); support
// scripts pass through verbatim (they are the step commands themselves).
export function resolveCustomProfileScripts(definition, options = {}) {
  const packageManager = validatePackageManager(options.packageManager ?? DEFAULT_PACKAGE_MANAGER);

  const gateScripts = {};
  for (const gate of CUSTOM_GATE_SCRIPT_NAMES) {
    gateScripts[gate] = renderCustomScriptCommand(definition.gateScripts[gate], packageManager);
  }

  return { gateScripts, supportScripts: { ...definition.supportScripts } };
}

// FR-05: dev dependencies come straight from the definition (custom never
// consults the built-in dependency table — INV-03).
export function resolveCustomProfileDevDependencies(definition) {
  return [...definition.devDependencies];
}

// Mirrors profile-scripts.mjs renderScriptCommand: rewrites `pnpm <script>`
// tokens to the target package manager. Reimplemented here so the custom path
// stays independent of the built-in module (INV-03).
function renderCustomScriptCommand(command, packageManager) {
  return command.replace(/\bpnpm ([a-zA-Z0-9:_-]+)/g, (_, scriptName) => (
    scriptCommand(packageManager, scriptName)
  ));
}

// ---------------------------------------------------------------------------
// YAML subset parser (NFR-02): same approach as check-config.mjs parseConfigYaml
// but for this file's shape (profile mapping + gateScripts/supportScripts
// mappings + a devDependencies list). Reimplemented, not shared, because the
// target structure differs (SPEC 実装メモ — expect.mjs makes the same call).
// ---------------------------------------------------------------------------
export function parseCustomProfileYaml(content, fileName) {
  const root = {};
  let currentTopKey = null;
  // The indent-2 key whose indent-4 children are still being read. Its container
  // type (mapping vs list) is decided by the first child line: a `- item` makes
  // it a list, a `key: value` makes it a mapping.
  let currentBlockKey = null;

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

    if (indent === 0) {
      currentBlockKey = null;
      const [key, rawValue] = splitYamlKeyValue(trimmed, fileName);
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
      continue;
    }

    if (indent === 2) {
      if (currentTopKey === null) {
        throw new CliError(`${fileName}: nested value without parent mapping: ${trimmed}\n${YAML_SUBSET_HINT}`);
      }
      currentBlockKey = null;
      const [key, rawValue] = splitYamlKeyValue(trimmed, fileName);
      const parent = root[currentTopKey];
      if (Object.prototype.hasOwnProperty.call(parent, key)) {
        throw new CliError(`${fileName}: duplicate key "${key}" under "${currentTopKey}"`);
      }
      if (rawValue === "") {
        // A block whose container type is resolved by its first child line.
        parent[key] = {};
        currentBlockKey = key;
      } else if (rawValue === "[]") {
        parent[key] = [];
      } else {
        parent[key] = parseYamlScalar(rawValue);
      }
      continue;
    }

    if (indent === 4) {
      if (currentBlockKey === null) {
        throw new CliError(`${fileName}: nested value without parent mapping: ${trimmed}\n${YAML_SUBSET_HINT}`);
      }

      const parent = root[currentTopKey];

      // First `- item` under an empty block resolves it to a list.
      if (trimmed.startsWith("- ") || trimmed === "-") {
        if (!Array.isArray(parent[currentBlockKey])) {
          if (Object.keys(parent[currentBlockKey]).length > 0) {
            throw new CliError(`${fileName}: "${currentBlockKey}" mixes list items and mapping keys: ${trimmed}\n${YAML_SUBSET_HINT}`);
          }
          parent[currentBlockKey] = [];
        }
        const item = trimmed === "-" ? "" : trimmed.slice(2).trim();
        parent[currentBlockKey].push(parseYamlScalar(item));
        continue;
      }

      if (Array.isArray(parent[currentBlockKey])) {
        throw new CliError(`${fileName}: "${currentBlockKey}" mixes list items and mapping keys: ${trimmed}\n${YAML_SUBSET_HINT}`);
      }

      const [key, rawValue] = splitYamlKeyValue(trimmed, fileName);
      if (rawValue === "") {
        throw new CliError(`${fileName}: nesting deeper than two mapping levels is not supported: ${trimmed}\n${YAML_SUBSET_HINT}`);
      }
      const mapping = parent[currentBlockKey];
      if (Object.prototype.hasOwnProperty.call(mapping, key)) {
        throw new CliError(`${fileName}: duplicate key "${key}" in "${currentBlockKey}"`);
      }
      mapping[key] = parseYamlScalar(rawValue);
      continue;
    }

    throw new CliError(`${fileName}: unsupported indentation (${indent} spaces): ${trimmed}\n${YAML_SUBSET_HINT}`);
  }

  return root;
}

function splitYamlKeyValue(line, fileName) {
  // Step / gate names contain `:` (e.g. ai:check:fast), so split on the first
  // `: ` separator or a trailing `:`.
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
