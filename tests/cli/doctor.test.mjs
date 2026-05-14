import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const binPath = path.join(repoRoot, "bin", "ai-check-template.mjs");

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [binPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    ...options,
  });
}

function createFixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-check-template-doctor-"));
  fs.writeFileSync(path.join(dir, "package.json"), `${JSON.stringify({ name: "fixture", scripts: {} }, null, 2)}\n`);
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

function initFixture(target, args = []) {
  const result = runCli(["init", "--target", target, "--profile", "react-nextjs", "--yes", ...args]);
  assert.equal(result.status, 0, result.stderr);
}

function mergePackageScripts(dir, scripts) {
  const packageJsonPath = path.join(dir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.scripts = { ...(packageJson.scripts ?? {}), ...scripts };
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function deletePackageScripts(dir, names) {
  const packageJsonPath = path.join(dir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  for (const name of names) {
    delete packageJson.scripts[name];
  }
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function missingScriptWarningNames(output) {
  return output.warnings
    .filter((warning) => warning.code === "script-advice")
    .map((warning) => warning.message.replace("ai:check references missing package script: ", ""))
    .sort();
}

function snapshotDirectory(dir) {
  const snapshot = {};
  for (const filePath of listFiles(dir)) {
    snapshot[path.relative(dir, filePath)] = fs.readFileSync(filePath, "utf8");
  }
  return snapshot;
}

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });
}

test("prints doctor help", () => {
  const result = runCli(["doctor", "--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ai-check-template doctor/);
  assert.match(result.stdout, /--json/);
  assert.match(result.stdout, /--strict/);
  assert.match(result.stdout, /--package-manager/);
});

test("doctor passes for a healthy target with scripts only", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  const before = snapshotDirectory(target);
  const result = runCli(["doctor", "--target", target, "--ci", "none"]);
  const after = snapshotDirectory(target);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /doctor pass/);
  assert.deepEqual(after, before);
});

test("doctor passes for direct CI, reusable CI, and Claude hooks", (t) => {
  const directTarget = createFixture(t);
  initFixture(directTarget, ["--ci", "direct"]);
  assert.equal(runCli(["doctor", "--target", directTarget, "--ci", "direct"]).status, 0);

  const reusableTarget = createFixture(t);
  initFixture(reusableTarget, ["--ci", "reusable"]);
  assert.equal(runCli(["doctor", "--target", reusableTarget, "--ci", "reusable"]).status, 0);

  const claudeTarget = createFixture(t);
  initFixture(claudeTarget, ["--ci", "none", "--claude-hooks"]);
  assert.equal(runCli(["doctor", "--target", claudeTarget, "--ci", "none", "--claude-hooks"]).status, 0);
});

test("doctor warns on inactive managed CI workflows", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--profile", "node-cli", "--ci", "direct"]);
  const before = snapshotDirectory(target);

  const result = runCli(["doctor", "--target", target, "--profile", "node-cli", "--ci", "none", "--json"]);
  const after = snapshotDirectory(target);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.equal(output.issues.length, 0);
  assert.deepEqual(
    output.warnings
      .filter((warning) => warning.code === "ci-advice")
      .map((warning) => warning.path)
      .sort(),
    [".github/workflows/ai-check-fast.yml", ".github/workflows/ai-check.yml"],
  );
  assert.deepEqual(after, before);
});

test("strict mode fails on inactive managed CI workflows", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--profile", "node-cli", "--ci", "direct"]);
  const before = snapshotDirectory(target);

  const result = runCli(["doctor", "--target", target, "--profile", "node-cli", "--ci", "none", "--strict", "--json"]);
  const after = snapshotDirectory(target);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "fail");
  assert.equal(output.strict, true);
  assert.equal(output.issues.length, 0);
  assert.equal(output.warnings.some((warning) => warning.code === "ci-advice"), true);
  assert.deepEqual(after, before);
});

test("doctor does not warn on custom inactive CI workflow content", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--profile", "node-cli", "--ci", "none"]);
  fs.mkdirSync(path.join(target, ".github", "workflows"), { recursive: true });
  fs.writeFileSync(path.join(target, ".github", "workflows", "ai-check.yml"), "name: custom\n");

  const result = runCli(["doctor", "--target", target, "--profile", "node-cli", "--ci", "none", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.equal(output.warnings.some((warning) => warning.code === "ci-advice"), false);
});

test("selected CI mode issues remain issues", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--profile", "node-cli", "--ci", "none"]);

  const result = runCli(["doctor", "--target", target, "--profile", "node-cli", "--ci", "direct", "--json"]);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "fail");
  assert.equal(output.issues.some(
    (issue) => issue.code === "missing-file" && issue.path === ".github/workflows/ai-check.yml",
  ), true);
});

test("doctor uses install state defaults and reports JSON context", (t) => {
  const target = createFixture(t);
  const init = runCli([
    "init",
    "--target",
    target,
    "--profile",
    "react-nextjs+supabase-rls",
    "--ci",
    "reusable",
    "--claude-hooks",
    "--yes",
  ]);
  assert.equal(init.status, 0, init.stderr);

  const result = runCli(["doctor", "--target", target, "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.equal(output.installation.source, "state");
  assert.equal(output.effectiveOptions.profile, "react-nextjs+supabase-rls");
  assert.equal(output.effectiveOptions.packageManager, "pnpm");
  assert.equal(output.effectiveOptions.ci, "reusable");
  assert.equal(output.effectiveOptions.claudeHooks, true);
  assert.equal(Array.isArray(output.warnings), true);
});

test("doctor uses install state package manager for script drift", (t) => {
  const target = createFixture(t);
  const init = runCli([
    "init",
    "--target",
    target,
    "--profile",
    "node-cli",
    "--package-manager",
    "npm",
    "--ci",
    "none",
    "--yes",
  ]);
  assert.equal(init.status, 0, init.stderr);

  const result = runCli(["doctor", "--target", target, "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.equal(output.effectiveOptions.packageManager, "npm");
  assert.equal(output.issues.length, 0);
});

test("doctor accepts old install state without package manager", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  const statePath = path.join(target, ".ai-check-template.json");
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  delete state.packageManager;
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);

  const result = runCli(["doctor", "--target", target, "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.effectiveOptions.packageManager, "pnpm");
});

test("profile warnings do not fail doctor", (t) => {
  const target = createFixture(t);
  const init = runCli(["init", "--target", target, "--profile", "node-cli", "--ci", "none", "--yes"]);
  assert.equal(init.status, 0, init.stderr);
  const packageJsonPath = path.join(target, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.scripts["test:e2e:smoke"] = "playwright test";
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const result = runCli(["doctor", "--target", target, "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.equal(output.strict, false);
  assert.equal(output.issues.length, 0);
  assert.equal(output.warnings.some((warning) => warning.code === "profile-advice"), true);
  assert.doesNotMatch(result.stdout, /pnpm typecheck/);
});

test("doctor warns on missing referenced package scripts", (t) => {
  const target = createFixture(t);
  const init = runCli(["init", "--target", target, "--profile", "node-cli", "--ci", "none", "--yes"]);
  assert.equal(init.status, 0, init.stderr);
  deletePackageScripts(target, ["typecheck", "lint", "test", "test:unit"]);
  const before = snapshotDirectory(target);

  const result = runCli(["doctor", "--target", target, "--json"]);
  const after = snapshotDirectory(target);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.deepEqual(
    missingScriptWarningNames(output),
    ["lint", "test", "test:unit", "typecheck"],
  );
  assert.deepEqual(after, before);
});

test("strict mode fails on missing referenced package scripts", (t) => {
  const target = createFixture(t);
  const init = runCli(["init", "--target", target, "--profile", "node-cli", "--ci", "none", "--yes"]);
  assert.equal(init.status, 0, init.stderr);
  deletePackageScripts(target, ["typecheck"]);

  const result = runCli(["doctor", "--target", target, "--strict", "--json"]);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "fail");
  assert.equal(output.strict, true);
  assert.equal(output.issues.length, 0);
  assert.equal(output.warnings.some((warning) => warning.code === "script-advice"), true);
});

test("doctor does not warn when referenced package scripts exist", (t) => {
  const target = createFixture(t);
  const init = runCli(["init", "--target", target, "--profile", "node-cli", "--ci", "none", "--yes"]);
  assert.equal(init.status, 0, init.stderr);
  mergePackageScripts(target, {
    typecheck: "tsc --noEmit",
    lint: "eslint .",
    test: "vitest run",
    "test:unit": "vitest run --dir tests/unit",
  });

  const result = runCli(["doctor", "--target", target, "--strict", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.equal(output.warnings.some((warning) => warning.code === "script-advice"), false);
});

test("missing script parser supports package manager invocation forms", (t) => {
  const target = createFixture(t);
  const init = runCli(["init", "--target", target, "--profile", "node-cli", "--ci", "none", "--yes"]);
  assert.equal(init.status, 0, init.stderr);
  deletePackageScripts(target, ["typecheck", "lint", "test:unit"]);
  mergePackageScripts(target, {
    "ai:check": "npm run typecheck && yarn lint && bun run test:unit && pnpm deadcode",
    "ai:check:fast": "bun run typecheck && pnpm lint",
  });

  const result = runCli(["doctor", "--target", target, "--json"]);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.deepEqual(
    missingScriptWarningNames(output),
    ["lint", "test:unit", "typecheck"],
  );
});

test("strict mode fails on profile warnings without converting them to issues", (t) => {
  const target = createFixture(t);
  const init = runCli(["init", "--target", target, "--profile", "node-cli", "--ci", "none", "--yes"]);
  assert.equal(init.status, 0, init.stderr);
  const packageJsonPath = path.join(target, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.scripts["test:e2e:smoke"] = "playwright test";
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
  const before = snapshotDirectory(target);

  const result = runCli(["doctor", "--target", target, "--strict", "--json"]);
  const after = snapshotDirectory(target);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "fail");
  assert.equal(output.strict, true);
  assert.equal(output.issues.length, 0);
  assert.equal(output.warnings.some((warning) => warning.code === "profile-advice"), true);
  assert.deepEqual(after, before);
});

test("strict mode passes when there are no issues or warnings", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--profile", "node-cli", "--ci", "none"]);
  mergePackageScripts(target, {
    typecheck: "tsc --noEmit",
    lint: "eslint .",
    test: "vitest run",
    "test:unit": "vitest run --dir tests/unit",
  });
  const result = runCli(["doctor", "--target", target, "--strict", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "pass");
  assert.equal(output.strict, true);
  assert.equal(output.issues.length, 0);
  assert.equal(output.warnings.length, 0);
});

test("explicit profile controls diagnostics warnings", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);

  const result = runCli(["doctor", "--target", target, "--profile", "node-cli", "--ci", "none", "--json"]);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.effectiveOptions.profile, "node-cli");
  assert.equal(output.issues.some((issue) => issue.message.includes("ai:check")), true);
});

test("doctor passes node-cli profile scripts", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--profile", "node-cli", "--ci", "none"]);
  const result = runCli(["doctor", "--target", target, "--ci", "none"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /doctor pass/);
});

test("doctor detects generic script drift for node-cli profile", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--profile", "node-cli", "--ci", "none"]);
  const packageJsonPath = path.join(target, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.scripts["ai:check"] = "pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e:smoke";
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const result = runCli(["doctor", "--target", target, "--ci", "none"]);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /drift/);
});

test("doctor returns non-zero for missing files", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  fs.rmSync(path.join(target, "scripts", "ai-check.sh"));
  const result = runCli(["doctor", "--target", target, "--ci", "none"]);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /missing-file/);
  assert.match(result.stdout, /scripts\/ai-check\.sh/);
});

test("doctor returns non-zero for drifted package scripts", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  const packageJsonPath = path.join(target, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.scripts["ai:check"] = "custom";
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
  const result = runCli(["doctor", "--target", target, "--ci", "none"]);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /drift/);
  assert.match(result.stdout, /package\.json/);
});

test("doctor json output is parseable", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  fs.writeFileSync(path.join(target, "scripts", "ai-check-fast.sh"), "changed\n");
  const result = runCli(["doctor", "--target", target, "--ci", "none", "--json"]);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "fail");
  assert.equal(output.strict, false);
  assert.equal(Array.isArray(output.warnings), true);
  assert.equal(output.issues[0].code, "drift");
  assert.equal(output.issues[0].path, "scripts/ai-check-fast.sh");
});

test("strict mode keeps issue failures as failures", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  fs.writeFileSync(path.join(target, "scripts", "ai-check-fast.sh"), "changed\n");
  const result = runCli(["doctor", "--target", target, "--ci", "none", "--strict", "--json"]);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, "fail");
  assert.equal(output.strict, true);
  assert.equal(output.issues[0].code, "drift");
});

test("doctor skips profile warnings for malformed package json", (t) => {
  const target = createFixture(t);
  fs.writeFileSync(path.join(target, "package.json"), "{bad json\n");
  const result = runCli(["doctor", "--target", target, "--ci", "none", "--json"]);

  assert.notEqual(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.issues[0].code, "invalid-json");
  assert.deepEqual(output.warnings, []);
});

test("doctor rejects target without package.json", (t) => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), "ai-check-template-empty-"));
  t.after(() => {
    fs.rmSync(target, { recursive: true, force: true });
  });
  const result = runCli(["doctor", "--target", target, "--ci", "none"]);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /missing-file/);
  assert.match(result.stdout, /package\.json/);
});

test("doctor reports malformed install state without writing", (t) => {
  const target = createFixture(t);
  initFixture(target, ["--ci", "none"]);
  fs.writeFileSync(path.join(target, ".ai-check-template.json"), "{bad json\n");
  const before = snapshotDirectory(target);
  const result = runCli(["doctor", "--target", target, "--ci", "none"]);
  const after = snapshotDirectory(target);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /invalid-install-state/);
  assert.deepEqual(after, before);
});
