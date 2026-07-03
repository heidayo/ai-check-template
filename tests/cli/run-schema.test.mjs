import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

// SPEC-0059 AC-07 / FR-09 / INV-06: `run --json` の実出力（config 経路・default
// 経路の両方）が package-templates/docs/run-result.schema.json の必須フィールド・
// 型・許容値に適合し、スキーマに無いフィールドが出力に存在しないことを固定する
// additive-only 回帰ガード。期待値は SPEC-0059 の AC-07 から導出（AP-07 対策）。

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const binPath = path.join(repoRoot, "bin", "ai-check-template.mjs");
const schemaPath = path.join(repoRoot, "package-templates", "docs", "run-result.schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

function runCli(args) {
  return spawnSync(process.execPath, [binPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

function createFixture(t, scripts) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-check-template-run-schema-"));
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  fs.writeFileSync(path.join(dir, "package.json"), `${JSON.stringify({ name: "fixture", scripts }, null, 2)}\n`);
  return dir;
}

// NFR-02: validator ライブラリ（ajv 等）を使わず、schema ファイル自体を一次情報源
// とした小さな再帰チェッカで検査する（依存追加禁止）。
function checkAgainstSchema(value, node, label, errors) {
  const types = Array.isArray(node.type) ? node.type : [node.type];

  if (value === null) {
    if (!types.includes("null")) {
      errors.push(`${label}: null is not allowed (expected ${types.join("/")})`);
    }
    return;
  }

  const matchesType = types.some((type) => {
    if (type === "object") return typeof value === "object" && !Array.isArray(value);
    if (type === "array") return Array.isArray(value);
    if (type === "string") return typeof value === "string";
    if (type === "number") return typeof value === "number" && Number.isFinite(value);
    if (type === "integer") return Number.isInteger(value);
    if (type === "null") return false;
    return false;
  });
  if (!matchesType) {
    errors.push(`${label}: expected type ${types.join("/")}, got ${Array.isArray(value) ? "array" : typeof value}`);
    return;
  }

  if (node.enum && !node.enum.includes(value)) {
    errors.push(`${label}: value ${JSON.stringify(value)} is not in enum ${JSON.stringify(node.enum)}`);
  }
  if (typeof node.minLength === "number" && typeof value === "string" && value.length < node.minLength) {
    errors.push(`${label}: string shorter than minLength ${node.minLength}`);
  }
  if (typeof node.minimum === "number" && typeof value === "number" && value < node.minimum) {
    errors.push(`${label}: number below minimum ${node.minimum}`);
  }

  if (types.includes("object") && node.properties) {
    for (const key of node.required ?? []) {
      if (!(key in value)) {
        errors.push(`${label}.${key}: missing required field`);
      }
    }
    for (const key of Object.keys(value)) {
      if (!(key in node.properties)) {
        // additionalProperties: false — スキーマに無いフィールドは回帰として検出
        if (node.additionalProperties === false) {
          errors.push(`${label}.${key}: field not declared in schema (additive change requires schema update)`);
        }
        continue;
      }
      checkAgainstSchema(value[key], node.properties[key], `${label}.${key}`, errors);
    }
  }

  if (types.includes("array") && node.items) {
    for (const [index, item] of value.entries()) {
      checkAgainstSchema(item, node.items, `${label}[${index}]`, errors);
    }
  }
}

function assertMatchesSchema(output) {
  const errors = [];
  checkAgainstSchema(output, schema, "$", errors);
  assert.deepEqual(errors, [], `run --json output must match run-result.schema.json:\n${errors.join("\n")}`);
}

test("run --json の default 経路出力（PASS）が run-result.schema.json に適合する", (t) => {
  // AC-07: config 不在（default 経路）の実出力を schema と照合する
  const target = createFixture(t, {
    "ai:check": "node -e \"console.log('one')\" && node -e \"console.log('two')\"",
  });

  const result = runCli(["run", "--target", target, "--script", "ai:check", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.configPath, null);
  assertMatchesSchema(output);
});

test("run --json の default 経路出力（FAIL + SKIPPED / exitCode null）も schema に適合する", (t) => {
  // AC-07: status の enum 全域（FAIL / SKIPPED）と exitCode: null の型許容を検証する
  const target = createFixture(t, {
    "ai:check": "node -e \"console.log('ok')\" && node -e \"process.exit(3)\" && node -e \"console.log('never')\"",
  });

  const result = runCli(["run", "--target", target, "--script", "ai:check", "--json"]);

  assert.equal(result.status, 1);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "FAIL");
  assert.equal(output.steps[2].status, "SKIPPED");
  assert.equal(output.steps[2].exitCode, null);
  assertMatchesSchema(output);
});

test("run --json の config 経路出力が run-result.schema.json に適合する", (t) => {
  // AC-07: config 経路（source: config / configPath 文字列）の実出力を schema と照合する
  const target = createFixture(t, {
    "ai:check": "node -e \"console.log('default-never-runs')\"",
  });
  fs.writeFileSync(path.join(target, ".ai-check.yaml"), [
    "version: 1",
    "steps:",
    "  lint:",
    "    command: node -e \"console.log('lint-ran')\"",
    "    gates: [full]",
    "  e2e:",
    "    command: node -e \"console.log('never')\"",
    "    enabled: false",
    "    gates: [full]",
    "",
  ].join("\n"));

  const result = runCli(["run", "--target", target, "--script", "ai:check", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.configPath, ".ai-check.yaml");
  assert.deepEqual(output.steps.map((step) => step.source), ["config", "config"]);
  assertMatchesSchema(output);
});

test("schema 自体が厳格形（additionalProperties: false + 必須フィールド網羅）を保つ", () => {
  // AC-07 / FR-09: 回帰ガードの前提 — スキーマが緩められたらここで検出する
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(
    [...schema.required].sort(),
    ["command", "configPath", "durationMs", "script", "startedAt", "status", "steps"],
  );
  assert.equal(schema.properties.steps.items.additionalProperties, false);
  assert.deepEqual(
    [...schema.properties.steps.items.required].sort(),
    ["command", "durationMs", "exitCode", "index", "name", "source", "status", "stderr", "stdout"],
  );
});
