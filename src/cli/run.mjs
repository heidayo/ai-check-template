import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { CliError, pathExists, readJson, resolveTarget, writeLine } from "./utils.mjs";
import { loadCheckConfig, resolveGate, stepsForGate } from "./check-config.mjs";

const RUN_USAGE = `ai-check-template run

Usage:
  ai-check-template run --target <dir> --script <name> [options]

Options:
  --target <dir>       Target project directory. Defaults to the current directory.
  --script <name>      Package script to run. Defaults to ai:check.
  --json               Print machine-readable JSON output.
  --output <file>      Write the JSON result to a file.

Config:
  If .ai-check.yaml or .ai-check.json exists in the target directory, steps for
  the matching gate (ai:check=full, ai:check:fast=fast, ai:check:secure=secure)
  are resolved from the config instead of splitting the package script.
  See docs/cli.md for the schema. Without a config file, behavior is unchanged.`;

const SECRET_PATTERNS = [
  /\b(AKIA|ASIA)[A-Z0-9]{16}\b/g,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  /\b([A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|CREDENTIAL|API_KEY)[A-Z0-9_]*)=([^\s"'`]+)/gi,
  /\b((?:token|secret|password|credential|api[_-]?key)\s*[:=]\s*)["']?([A-Za-z0-9+/=_-]{8,})["']?/gi,
];

export async function runStructuredCheck(argv, io = {}) {
  const options = parseRunArgs(argv, io.cwd ?? process.cwd());

  if (options.help) {
    writeLine(io.stdout, RUN_USAGE);
    return;
  }

  const targetDir = await normalizeTargetDir(options.target);
  const packageJsonPath = path.join(targetDir, "package.json");
  if (!(await pathExists(packageJsonPath))) {
    throw new CliError(`Target project must contain package.json: ${packageJsonPath}`);
  }

  const packageJson = await readJson(packageJsonPath);
  const command = packageJson.scripts?.[options.script];
  if (typeof command !== "string" || command.trim().length === 0) {
    throw new CliError(`Missing package script: ${options.script}`);
  }

  // FR-03: config は 3 ゲート script のときだけ参照する。validation 失敗は
  // loadCheckConfig() が CliError を投げ、ステップ実行前に非 0 終了する（FR-07 / INV-03）。
  const gate = resolveGate(options.script);
  let stepDefinitions = null;
  let configPath = null;
  if (gate) {
    const config = await loadCheckConfig(targetDir);
    if (config) {
      const gateSteps = stepsForGate(config.steps, gate);
      // FR-05: 該当 gate の step が無ければ package script 分割へフォールバック。
      if (gateSteps.length > 0) {
        stepDefinitions = gateSteps.map((step) => ({
          name: step.name,
          command: resolveStepCommand(step, packageJson, config.fileName),
          enabled: step.enabled,
          source: "config",
        }));
        configPath = path.relative(targetDir, config.configPath) || config.fileName;
      }
    }
  }

  if (stepDefinitions === null) {
    stepDefinitions = splitCommandChain(command).map((stepCommand, index) => ({
      name: `step-${index + 1}`,
      command: stepCommand,
      enabled: true,
      source: "default",
    }));
  }

  const result = executeScript({ targetDir, script: options.script, command, stepDefinitions, configPath });

  if (options.output) {
    await fs.mkdir(path.dirname(options.output), { recursive: true });
    await fs.writeFile(options.output, `${JSON.stringify(result, null, 2)}\n`);
  }

  if (options.json) {
    writeLine(io.stdout, JSON.stringify(result, null, 2));
  } else {
    writeHumanOutput(io.stdout, result);
  }

  if (result.status === "FAIL") {
    throw new CliError(`ai-check-template run failed: ${options.script}`, 1);
  }
}

function parseRunArgs(argv, cwd) {
  const options = {
    target: cwd,
    script: "ai:check",
    json: false,
    output: null,
    help: false,
  };

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
    if (arg.startsWith("--target=")) {
      options.target = resolveTarget(arg.slice("--target=".length), cwd);
      continue;
    }
    if (arg === "--target") {
      options.target = resolveTarget(readFlagValue(argv, (index += 1), arg), cwd);
      continue;
    }
    if (arg.startsWith("--script=")) {
      options.script = arg.slice("--script=".length);
      continue;
    }
    if (arg === "--script") {
      options.script = readFlagValue(argv, (index += 1), arg);
      continue;
    }
    if (arg.startsWith("--output=")) {
      options.output = path.resolve(cwd, arg.slice("--output=".length));
      continue;
    }
    if (arg === "--output") {
      options.output = path.resolve(cwd, readFlagValue(argv, (index += 1), arg));
      continue;
    }
    throw new CliError(`Unknown run option: ${arg}\n\n${RUN_USAGE}`);
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

async function normalizeTargetDir(target) {
  const resolved = path.resolve(target);
  try {
    return await fs.realpath(resolved);
  } catch (error) {
    throw new CliError(`Target directory does not exist: ${resolved}\n${error.message}`);
  }
}

// 想定エラー2: command 省略 step は package script 名参照。無ければ黙って skip せずエラー。
function resolveStepCommand(step, packageJson, configFileName) {
  if (step.command !== null) {
    return step.command;
  }
  const scriptCommand = packageJson.scripts?.[step.name];
  if (typeof scriptCommand !== "string" || scriptCommand.trim().length === 0) {
    throw new CliError(
      `${configFileName}: step "${step.name}" has no command and package script "${step.name}" does not exist`,
    );
  }
  return scriptCommand;
}

function executeScript({ targetDir, script, command, stepDefinitions, configPath }) {
  const startedAt = Date.now();
  const steps = stepDefinitions.map((definition, index) => ({
    index: index + 1,
    name: definition.name,
    source: definition.source,
    command: definition.command,
    status: "SKIPPED",
    exitCode: null,
    durationMs: 0,
    stdout: "",
    stderr: "",
  }));

  let failed = false;
  for (const [position, step] of steps.entries()) {
    // FR-04 / 境界ケース1: enabled: false の step は実行せず SKIPPED のまま記録する。
    if (failed || !stepDefinitions[position].enabled) {
      continue;
    }

    const stepStartedAt = Date.now();
    const spawnResult = spawnSync(step.command, {
      cwd: targetDir,
      encoding: "utf8",
      shell: true,
    });
    const exitCode = typeof spawnResult.status === "number" ? spawnResult.status : 1;

    step.durationMs = Date.now() - stepStartedAt;
    step.exitCode = exitCode;
    step.stdout = redact(spawnResult.stdout ?? "");
    step.stderr = redact([spawnResult.error?.message, spawnResult.stderr].filter(Boolean).join("\n"));
    step.status = exitCode === 0 ? "PASS" : "FAIL";
    failed = step.status === "FAIL";
  }

  return {
    status: failed ? "FAIL" : "PASS",
    script,
    command,
    startedAt: new Date(startedAt).toISOString(),
    durationMs: Date.now() - startedAt,
    configPath: configPath ?? null,
    steps,
  };
}

function splitCommandChain(command) {
  return command.split("&&").map((part) => part.trim()).filter(Boolean);
}

export function redact(input) {
  let output = input;
  for (const pattern of SECRET_PATTERNS) {
    output = output.replace(pattern, (match, prefix) => (
      typeof prefix === "string" && match.includes("=")
        ? `${prefix}=[REDACTED]`
        : "[REDACTED]"
    ));
  }
  return output;
}

function writeHumanOutput(stream, result) {
  writeLine(stream, `ai-check-template run ${result.status}`);
  writeLine(stream, `script: ${result.script}`);
  writeLine(stream, `durationMs: ${result.durationMs}`);
  for (const step of result.steps) {
    writeLine(stream, `${step.index}. ${step.status} ${step.durationMs}ms ${step.command}`);
  }
}
