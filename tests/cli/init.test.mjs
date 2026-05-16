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

function createTempDir(t, prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

function createFixture(t, packageJson = { name: "fixture", scripts: { test: "node --test" } }) {
  const dir = createTempDir(t, "ai-check-template-");
  fs.writeFileSync(path.join(dir, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`);
  return dir;
}

function readPackageJson(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
}

function readInstallState(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, ".ai-check-template.json"), "utf8"));
}

function readClaudeSettings(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, ".claude", "settings.json"), "utf8"));
}

function claudeHookCommands(settings) {
  return Object.values(settings.hooks ?? {}).flatMap((entries) => (
    entries.flatMap((entry) => (entry.hooks ?? []).map((hook) => hook.command).filter(Boolean))
  ));
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

function createFakePackageManager(t, name) {
  const binDir = createTempDir(t, "ai-check-template-bin-");
  const logPath = path.join(binDir, "package-manager.log");
  const commandPath = path.join(binDir, name);
  fs.writeFileSync(
    commandPath,
    "#!/bin/sh\nprintf '%s\\n' \"$0 $*\" >> \"$AI_CHECK_PM_LOG\"\n",
  );
  fs.chmodSync(commandPath, 0o755);
  return { binDir, logPath };
}

test("prints help", () => {
  const result = runCli(["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /init/);
  assert.match(result.stdout, /--package-manager/);
  assert.match(result.stdout, /--install-deps/);
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
  assert.equal(packageJson.scripts.typecheck, "tsc --noEmit");
  assert.equal(packageJson.scripts.lint, "eslint .");
  assert.equal(packageJson.scripts["test:unit"], "vitest run --dir tests/unit");
  assert.equal(packageJson.scripts["test:e2e:smoke"], "playwright test --grep smoke");
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
  assert.equal(packageJson.scripts.typecheck, "tsc --noEmit");
  assert.equal(packageJson.scripts.lint, "eslint .");
  assert.equal(packageJson.scripts.test, "node --test");
  assert.equal(packageJson.scripts["test:unit"], "vitest run --dir tests/unit");
  assert.equal(packageJson.scripts["ai:check"].includes("test:e2e:smoke"), false);
  assert.equal(Object.hasOwn(packageJson.scripts, "test:e2e:smoke"), false);
  assert.equal(fs.existsSync(path.join(target, "docs", "ai-check-template", "profiles", "node-cli", "README.md")), true);
  assert.equal(fs.existsSync(path.join(target, "docs", "ai-check-template", "profiles", "react-nextjs", "README.md")), false);
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

test("init copies common and selected profile docs", (t) => {
  const target = createFixture(t);
  const result = runCli(["init", "--target", target, "--profile", "react-nextjs+supabase-rls", "--ci", "none", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(target, "docs", "ai-check-template", "docs", "test-design-template.md")), true);
  assert.equal(fs.existsSync(path.join(target, "docs", "ai-check-template", "docs", "philosophy", "formal-name-match.md")), true);
  assert.equal(fs.existsSync(path.join(target, "docs", "ai-check-template", "prompts", "diagnostic-repair.md")), true);
  assert.equal(fs.existsSync(path.join(target, "docs", "ai-check-template", "profiles", "README.md")), true);
  assert.equal(fs.existsSync(path.join(target, "docs", "ai-check-template", "profiles", "react-nextjs", "README.md")), true);
  assert.equal(fs.existsSync(path.join(target, "docs", "ai-check-template", "profiles", "supabase-rls", "README.md")), true);
  assert.equal(fs.existsSync(path.join(target, "docs", "ai-check-template", "profiles", "node-cli", "README.md")), false);
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
  assert.match(result.stdout, /would-copy: docs\/ai-check-template\/docs\/test-design-template\.md \(profile doc\)/);
  assert.equal(fs.existsSync(path.join(target, "scripts")), false);
  assert.equal(fs.existsSync(path.join(target, "docs", "ai-check-template")), false);
  assert.equal(fs.existsSync(path.join(target, ".github")), false);
  assert.equal(fs.existsSync(path.join(target, ".ai-check-template.json")), false);
});

test("install deps dry-run reports command without requiring package manager", (t) => {
  const packageJson = { name: "fixture", scripts: {} };
  const target = createFixture(t, packageJson);
  const emptyPath = createTempDir(t, "ai-check-template-empty-path-");
  const before = snapshotDirectory(target);
  const result = runCli(
    ["init", "--target", target, "--profile", "react-nextjs", "--ci", "none", "--install-deps", "--dry-run"],
    { env: { ...process.env, PATH: emptyPath } },
  );
  const after = snapshotDirectory(target);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /would-install/);
  assert.match(result.stdout, /pnpm add -D typescript eslint vitest knip @playwright\/test/);
  assert.deepEqual(after, before);
  assert.equal(fs.existsSync(path.join(target, "pnpm-lock.yaml")), false);
});

test("install deps invokes fake package manager and skips declared packages", (t) => {
  const target = createFixture(t, {
    name: "fixture",
    scripts: {},
    dependencies: {
      typescript: "^5.0.0",
    },
    devDependencies: {
      eslint: "^9.0.0",
    },
  });
  const fakePnpm = createFakePackageManager(t, "pnpm");
  const result = runCli(
    [
      "init",
      "--target",
      target,
      "--profile",
      "react-nextjs",
      "--package-manager",
      "pnpm",
      "--ci",
      "none",
      "--install-deps",
      "--yes",
    ],
    { env: { ...process.env, PATH: fakePnpm.binDir, AI_CHECK_PM_LOG: fakePnpm.logPath } },
  );

  assert.equal(result.status, 0, result.stderr);
  const log = fs.readFileSync(fakePnpm.logPath, "utf8");
  assert.match(log, /pnpm --version/);
  assert.match(log, /pnpm add -D vitest knip @playwright\/test/);
  assert.doesNotMatch(log, /add -D .*typescript/);
  assert.doesNotMatch(log, /add -D .*eslint/);
});

test("install deps missing package manager fails before writes", (t) => {
  const packageJson = { name: "fixture", scripts: {} };
  const target = createFixture(t, packageJson);
  const emptyPath = createTempDir(t, "ai-check-template-empty-path-");
  const result = runCli(
    [
      "init",
      "--target",
      target,
      "--profile",
      "react-nextjs",
      "--package-manager",
      "pnpm",
      "--ci",
      "none",
      "--install-deps",
      "--yes",
    ],
    { env: { ...process.env, PATH: emptyPath } },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Package manager command not found/);
  assert.deepEqual(readPackageJson(target), packageJson);
  assert.equal(fs.existsSync(path.join(target, "scripts")), false);
  assert.equal(fs.existsSync(path.join(target, "docs", "ai-check-template")), false);
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
  const settings = readClaudeSettings(target);
  assert.ok(settings.hooks.PostToolUse);
  assert.ok(settings.hooks.Stop);
  assert.deepEqual(claudeHookCommands(settings), ["pnpm ai:check:fast", "pnpm ai:check"]);
});

test("Claude hooks render package-manager-specific commands", (t) => {
  const cases = [
    ["pnpm", "pnpm ai:check:fast", "pnpm ai:check"],
    ["npm", "npm run ai:check:fast", "npm run ai:check"],
    ["yarn", "yarn ai:check:fast", "yarn ai:check"],
    ["bun", "bun run ai:check:fast", "bun run ai:check"],
  ];

  for (const [packageManager, fastCommand, fullCommand] of cases) {
    const target = createFixture(t);
    const result = runCli([
      "init",
      "--target",
      target,
      "--profile",
      "react-nextjs",
      "--ci",
      "none",
      "--claude-hooks",
      "--package-manager",
      packageManager,
      "--yes",
    ]);

    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(claudeHookCommands(readClaudeSettings(target)), [fastCommand, fullCommand]);
  }
});

test("Claude hooks preserve existing groups unless overwrite is requested", (t) => {
  const target = createFixture(t);
  const settingsPath = path.join(target, ".claude", "settings.json");
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, `${JSON.stringify({
    hooks: {
      PostToolUse: [
        {
          matcher: "Edit|Write",
          hooks: [{ type: "command", command: "custom fast check" }],
        },
      ],
      Stop: [
        {
          hooks: [{ type: "command", command: "custom full check" }],
        },
      ],
    },
  }, null, 2)}\n`);

  const preserve = runCli([
    "init",
    "--target",
    target,
    "--profile",
    "react-nextjs",
    "--ci",
    "none",
    "--claude-hooks",
    "--package-manager",
    "npm",
    "--yes",
  ]);

  assert.equal(preserve.status, 0, preserve.stderr);
  assert.deepEqual(claudeHookCommands(readClaudeSettings(target)), ["custom fast check", "custom full check"]);

  const overwrite = runCli([
    "init",
    "--target",
    target,
    "--profile",
    "react-nextjs",
    "--ci",
    "none",
    "--claude-hooks",
    "--package-manager",
    "npm",
    "--overwrite",
    "--yes",
  ]);

  assert.equal(overwrite.status, 0, overwrite.stderr);
  assert.deepEqual(claudeHookCommands(readClaudeSettings(target)), ["npm run ai:check:fast", "npm run ai:check"]);
});

test("existing files and scripts are not overwritten by default", (t) => {
  const target = createFixture(t, {
    name: "fixture",
    scripts: {
      "ai:check": "custom check",
      lint: "custom lint",
    },
  });
  fs.mkdirSync(path.join(target, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(target, "scripts", "ai-check.sh"), "custom script\n");

  const result = runCli(["init", "--target", target, "--profile", "react-nextjs", "--ci", "none", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  const packageJson = readPackageJson(target);
  assert.equal(packageJson.scripts["ai:check"], "custom check");
  assert.equal(packageJson.scripts["ai:check:fast"], "pnpm typecheck && pnpm lint && pnpm test:unit");
  assert.equal(packageJson.scripts.lint, "custom lint");
  assert.equal(packageJson.scripts.typecheck, "tsc --noEmit");
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
  const result = runCli(["init", "--target", target, "--package-manager", "bad", "--claude-hooks", "--yes"]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /package-manager must be one of/);
  assert.deepEqual(readPackageJson(target), packageJson);
  assert.equal(fs.existsSync(path.join(target, "scripts")), false);
  assert.equal(fs.existsSync(path.join(target, ".claude")), false);
  assert.equal(fs.existsSync(path.join(target, ".ai-check-template.json")), false);
});
