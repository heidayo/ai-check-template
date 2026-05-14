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

function createFixture(t, packageJson = { name: "fixture", scripts: { test: "node --test" } }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-check-template-"));
  fs.writeFileSync(path.join(dir, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`);
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

function readPackageJson(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
}

function readInstallState(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, ".ai-check-template.json"), "utf8"));
}

test("prints help", () => {
  const result = runCli(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /init/);
  assert.match(result.stdout, /--package-manager/);
});

test("init merges package scripts and copies shell scripts", (t) => {
  const target = createFixture(t);
  const result = runCli(["init", "--target", target, "--profile", "react-nextjs", "--ci", "none", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  const packageJson = readPackageJson(target);
  assert.equal(packageJson.scripts["ai:check"], "pnpm typecheck && pnpm lint && pnpm doctor && pnpm deadcode && pnpm test && pnpm test:e2e:smoke");
  assert.equal(packageJson.scripts["ai:check:fast"], "pnpm typecheck && pnpm lint && pnpm test:unit");
  assert.equal(packageJson.scripts.doctor, "npx -y react-doctor@latest . --fail-on warning");
  assert.equal(packageJson.scripts.deadcode, "knip");
  assert.equal(fs.existsSync(path.join(target, "scripts", "ai-check.sh")), true);
  assert.equal(fs.existsSync(path.join(target, "scripts", "ai-check-fast.sh")), true);
});

test("init uses explicit npm package manager scripts", (t) => {
  const target = createFixture(t);
  const result = runCli([
    "init",
    "--target",
    target,
    "--profile",
    "react-nextjs+supabase-rls",
    "--package-manager",
    "npm",
    "--ci",
    "none",
    "--yes",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const packageJson = readPackageJson(target);
  assert.equal(packageJson.scripts["ai:check"], "npm run typecheck && npm run lint && npm run doctor && npm run deadcode && npm run test && npm run test:e2e:smoke && npm run test:db && npm run test:integration:rls");
  assert.equal(packageJson.scripts["ai:check:fast"], "npm run typecheck && npm run lint && npm run test:unit");
  assert.equal(readInstallState(target).packageManager, "npm");
});

test("init detects yarn from lockfile", (t) => {
  const target = createFixture(t);
  fs.writeFileSync(path.join(target, "yarn.lock"), "");
  const result = runCli(["init", "--target", target, "--profile", "node-cli", "--ci", "none", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  const packageJson = readPackageJson(target);
  assert.equal(packageJson.scripts["ai:check"], "yarn typecheck && yarn lint && yarn deadcode && yarn test");
  assert.equal(packageJson.scripts["ai:check:fast"], "yarn typecheck && yarn lint && yarn test:unit");
  assert.equal(readInstallState(target).packageManager, "yarn");
});

test("node-cli profile scripts exclude UI E2E", (t) => {
  const target = createFixture(t);
  const result = runCli(["init", "--target", target, "--profile", "node-cli", "--ci", "none", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  const packageJson = readPackageJson(target);
  assert.equal(packageJson.scripts["ai:check"], "pnpm typecheck && pnpm lint && pnpm deadcode && pnpm test");
  assert.equal(packageJson.scripts["ai:check"].includes("test:e2e:smoke"), false);
});

test("supabase addon profile scripts add RLS checks", (t) => {
  const target = createFixture(t);
  const result = runCli(["init", "--target", target, "--profile", "react-nextjs+supabase-rls", "--ci", "none", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  const packageJson = readPackageJson(target);
  assert.equal(packageJson.scripts["test:db"], "supabase test db");
  assert.equal(packageJson.scripts["test:integration:rls"], "vitest run --dir tests/rls");
  assert.match(packageJson.scripts["ai:check"], /pnpm test:db/);
  assert.match(packageJson.scripts["ai:check"], /pnpm test:integration:rls/);
});

test("init writes deterministic install state", (t) => {
  const target = createFixture(t);
  const result = runCli([
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

  assert.equal(result.status, 0, result.stderr);
  const state = readInstallState(target);
  assert.deepEqual(state, {
    schemaVersion: 1,
    packageName: "ai-check-template",
    packageVersion: "0.2.0-alpha.0",
    profile: {
      base: "react-nextjs",
      addons: ["supabase-rls"],
      all: ["react-nextjs", "supabase-rls"],
    },
    packageManager: "pnpm",
    ci: "reusable",
    claudeHooks: true,
    managedBy: "ai-check-template",
  });
});

test("dry-run writes nothing", (t) => {
  const packageJson = { name: "fixture", scripts: { test: "node --test" } };
  const target = createFixture(t, packageJson);
  const result = runCli(["init", "--target", target, "--profile", "react-nextjs", "--dry-run"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /dry-run/);
  assert.deepEqual(readPackageJson(target), packageJson);
  assert.equal(fs.existsSync(path.join(target, "scripts")), false);
  assert.equal(fs.existsSync(path.join(target, ".github")), false);
  assert.equal(fs.existsSync(path.join(target, ".ai-check-template.json")), false);
});

test("direct CI mode copies direct workflow files", (t) => {
  const target = createFixture(t);
  const result = runCli(["init", "--target", target, "--profile", "react-nextjs", "--ci", "direct", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(target, ".github", "workflows", "ai-check.yml")), true);
  assert.equal(fs.existsSync(path.join(target, ".github", "workflows", "ai-check-fast.yml")), true);
});

test("reusable CI mode copies reusable workflow files", (t) => {
  const target = createFixture(t);
  const result = runCli(["init", "--target", target, "--profile", "react-nextjs+supabase-rls", "--ci", "reusable", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(target, ".github", "workflows", "ai-quality-reusable.yml")), true);
  assert.equal(fs.existsSync(path.join(target, ".github", "workflows", "ai-quality-call.yml")), true);
});

test("Claude hooks copy rules and merge settings", (t) => {
  const target = createFixture(t);
  const result = runCli(["init", "--target", target, "--profile", "react-nextjs", "--ci", "none", "--claude-hooks", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(target, ".claude", "rules", "test-rules.md")), true);
  const settings = JSON.parse(fs.readFileSync(path.join(target, ".claude", "settings.json"), "utf8"));
  assert.ok(settings.hooks.PostToolUse);
  assert.ok(settings.hooks.Stop);
});

test("existing files and scripts are not overwritten by default", (t) => {
  const target = createFixture(t, {
    name: "fixture",
    scripts: {
      "ai:check": "custom check",
    },
  });
  fs.mkdirSync(path.join(target, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(target, "scripts", "ai-check.sh"), "custom script\n");

  const result = runCli(["init", "--target", target, "--profile", "react-nextjs", "--ci", "none", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  const packageJson = readPackageJson(target);
  assert.equal(packageJson.scripts["ai:check"], "custom check");
  assert.equal(packageJson.scripts["ai:check:fast"], "pnpm typecheck && pnpm lint && pnpm test:unit");
  assert.equal(fs.readFileSync(path.join(target, "scripts", "ai-check.sh"), "utf8"), "custom script\n");
});

test("invalid profile is rejected before writes", (t) => {
  const packageJson = { name: "fixture", scripts: {} };
  const target = createFixture(t, packageJson);
  const result = runCli(["init", "--target", target, "--profile", "../bad", "--yes"]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid profile/);
  assert.deepEqual(readPackageJson(target), packageJson);
  assert.equal(fs.existsSync(path.join(target, "scripts")), false);
});

test("invalid package manager is rejected before writes", (t) => {
  const packageJson = { name: "fixture", scripts: {} };
  const target = createFixture(t, packageJson);
  const result = runCli(["init", "--target", target, "--package-manager", "bad", "--yes"]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /package-manager must be one of/);
  assert.deepEqual(readPackageJson(target), packageJson);
  assert.equal(fs.existsSync(path.join(target, "scripts")), false);
  assert.equal(fs.existsSync(path.join(target, ".ai-check-template.json")), false);
});
