import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const binPath = path.join(repoRoot, "bin", "ai-check-template.mjs");
const PKG_VERSION = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")).version;
const PNPM_SECURE_SCRIPT = "pnpm security:secrets && pnpm security:deps && pnpm security:supply-chain && pnpm security:sast";
const NPM_SECURE_SCRIPT = "npm run security:secrets && npm run security:deps && npm run security:supply-chain && npm run security:sast";
const YARN_SECURE_SCRIPT = "yarn security:secrets && yarn security:deps && yarn security:supply-chain && yarn security:sast";

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

function readWorkflow(dir, name) {
  return fs.readFileSync(path.join(dir, ".github", "workflows", name), "utf8");
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
  assert.match(result.stdout, /--review-templates/);
});

test("init merges package scripts and copies shell scripts", (t) => {
  const target = createFixture(t);
  const result = runCli(["init", "--target", target, "--profile", "react-nextjs", "--ci", "none", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  const packageJson = readPackageJson(target);
  assert.equal(packageJson.scripts["ai:check"], "pnpm typecheck && pnpm lint && pnpm doctor && pnpm deadcode && pnpm test && pnpm test:e2e:smoke");
  assert.equal(packageJson.scripts["ai:check:fast"], "pnpm typecheck && pnpm lint && pnpm test:unit");
  assert.equal(packageJson.scripts["ai:check:secure"], PNPM_SECURE_SCRIPT);
  assert.equal(packageJson.scripts["security:secrets"], "npx -y @secretlint/quick-start \"**/*\"");
  assert.equal(packageJson.scripts["security:deps"], "pnpm audit --audit-level high");
  assert.equal(packageJson.scripts["security:supply-chain"], "pnpm audit --prod --audit-level moderate");
  assert.equal(packageJson.scripts["security:sast"], "semgrep scan --config auto");
  assert.equal(packageJson.scripts.doctor, "npx -y react-doctor@latest . --fail-on warning");
  assert.equal(packageJson.scripts.deadcode, "knip");
  assert.equal(packageJson.scripts.typecheck, "tsc --noEmit");
  assert.equal(packageJson.scripts.lint, "eslint .");
  assert.equal(packageJson.scripts["test:unit"], "vitest run --dir tests/unit");
  assert.equal(packageJson.scripts["test:e2e:smoke"], "playwright test --grep smoke");
  assert.equal(fs.existsSync(path.join(target, "scripts", "ai-check.sh")), true);
  assert.equal(fs.existsSync(path.join(target, "scripts", "ai-check-fast.sh")), true);
  assert.equal(fs.existsSync(path.join(target, "scripts", "ai-check-secure.sh")), true);
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
  assert.equal(packageJson.scripts["ai:check:secure"], NPM_SECURE_SCRIPT);
  assert.equal(packageJson.scripts["security:deps"], "npm audit --audit-level high");
  assert.equal(packageJson.scripts["security:supply-chain"], "npm audit signatures");
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
  assert.equal(packageJson.scripts["ai:check:secure"], YARN_SECURE_SCRIPT);
  assert.equal(packageJson.scripts["security:deps"], "yarn npm audit --severity high");
  assert.equal(readInstallState(target).packageManager, "yarn");
});

test("node-cli profile scripts exclude UI E2E", (t) => {
  const target = createFixture(t);
  const result = runCli(["init", "--target", target, "--profile", "node-cli", "--ci", "none", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  const packageJson = readPackageJson(target);
  assert.equal(packageJson.scripts["ai:check"], "pnpm typecheck && pnpm lint && pnpm deadcode && pnpm test");
  assert.equal(packageJson.scripts["ai:check:secure"], PNPM_SECURE_SCRIPT);
  assert.equal(packageJson.scripts.typecheck, "tsc --noEmit");
  assert.equal(packageJson.scripts.lint, "eslint .");
  assert.equal(packageJson.scripts.test, "node --test");
  assert.equal(packageJson.scripts["test:unit"], "vitest run --dir tests/unit");
  assert.equal(packageJson.scripts["ai:check"].includes("test:e2e:smoke"), false);
  assert.equal(Object.hasOwn(packageJson.scripts, "test:e2e:smoke"), false);
  assert.equal(fs.existsSync(path.join(target, "docs", "ai-check-template", "profiles", "node-cli", "README.md")), true);
  assert.equal(fs.existsSync(path.join(target, "docs", "ai-check-template", "profiles", "react-nextjs", "README.md")), false);
});

test("expo-rn profile scripts include React Doctor and Maestro smoke", (t) => {
  const target = createFixture(t);
  const result = runCli(["init", "--target", target, "--profile", "expo-rn", "--ci", "none", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  const packageJson = readPackageJson(target);
  assert.equal(packageJson.scripts["ai:check"], "pnpm typecheck && pnpm lint && pnpm doctor && pnpm deadcode && pnpm test && pnpm test:e2e:smoke");
  assert.equal(packageJson.scripts.doctor, "npx -y react-doctor@latest . --fail-on warning");
  assert.equal(packageJson.scripts["test:e2e:smoke"], "maestro test .maestro/smoke.yaml");
  assert.equal(packageJson.scripts["ai:check:secure"], PNPM_SECURE_SCRIPT);
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
  assert.equal(fs.existsSync(path.join(target, "docs", "ai-check-template", "docs", "ac-test-matrix.schema.json")), true);
  assert.equal(fs.existsSync(path.join(target, "docs", "ai-check-template", "docs", "ac-test-matrix.example.json")), true);
  assert.equal(fs.existsSync(path.join(target, "docs", "ai-check-template", "docs", "ac-test-matrix.example.yaml")), true);
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
  // AC-02: init 直後の install state は schemaVersion: 2 で managedFiles を含む
  const { managedFiles, ...rest } = state;
  assert.deepEqual(rest, {
    schemaVersion: 2,
    packageName: "ai-check-template",
    packageVersion: PKG_VERSION,
    profile: {
      base: "react-nextjs",
      addons: ["supabase-rls"],
      all: ["react-nextjs", "supabase-rls"],
    },
    packageManager: "pnpm",
    ci: "reusable",
    claudeHooks: true,
    reviewTemplates: false,
    managedBy: "ai-check-template",
  });
  // AC-02: 全 managed ファイル（shell scripts / CI workflow / Claude rule / profile docs）の hash が記録される
  for (const expected of [
    "scripts/ai-check.sh",
    "scripts/ai-check-fast.sh",
    "scripts/ai-check-secure.sh",
    ".github/workflows/ai-quality-reusable.yml",
    ".github/workflows/ai-quality-call.yml",
    ".claude/rules/test-rules.md",
  ]) {
    assert.equal(Object.hasOwn(managedFiles, expected), true, `missing managedFiles entry: ${expected}`);
  }
  // INV-02: 各 hash は対応ファイルの実内容の SHA-256 と一致する
  for (const [relativePath, entry] of Object.entries(managedFiles)) {
    const content = fs.readFileSync(path.join(target, ...relativePath.split("/")), "utf8");
    assert.equal(entry.hash, `sha256:${createHash("sha256").update(content).digest("hex")}`, relativePath);
  }
});

test("init copies reviewability templates when requested", (t) => {
  const target = createFixture(t);
  const result = runCli([
    "init",
    "--target",
    target,
    "--profile",
    "react-nextjs",
    "--ci",
    "none",
    "--review-templates",
    "--yes",
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(target, ".github", "PULL_REQUEST_TEMPLATE.md")), true);
  assert.equal(fs.existsSync(path.join(target, "worksheet", "ai-code-understanding.md")), true);
  assert.match(
    fs.readFileSync(path.join(target, ".github", "PULL_REQUEST_TEMPLATE.md"), "utf8"),
    /AI-Generated Code Review/,
  );
  assert.match(
    fs.readFileSync(path.join(target, "worksheet", "ai-code-understanding.md"), "utf8"),
    /Reimplementation Check/,
  );
  assert.equal(readInstallState(target).reviewTemplates, true);
  assert.match(result.stdout, /copy: \.github\/PULL_REQUEST_TEMPLATE\.md \(review PR template\)/);
  assert.match(result.stdout, /copy: worksheet\/ai-code-understanding\.md \(review worksheet\)/);
});

test("init does not copy reviewability templates unless requested", (t) => {
  const target = createFixture(t);
  const result = runCli(["init", "--target", target, "--profile", "react-nextjs", "--ci", "none", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(target, ".github", "PULL_REQUEST_TEMPLATE.md")), false);
  assert.equal(fs.existsSync(path.join(target, "worksheet", "ai-code-understanding.md")), false);
  assert.equal(readInstallState(target).reviewTemplates, false);
});

test("reviewability templates preserve existing files without overwrite", (t) => {
  const target = createFixture(t);
  const prTemplatePath = path.join(target, ".github", "PULL_REQUEST_TEMPLATE.md");
  const worksheetPath = path.join(target, "worksheet", "ai-code-understanding.md");
  fs.mkdirSync(path.dirname(prTemplatePath), { recursive: true });
  fs.mkdirSync(path.dirname(worksheetPath), { recursive: true });
  fs.writeFileSync(prTemplatePath, "custom pr template\n");
  fs.writeFileSync(worksheetPath, "custom worksheet\n");

  const result = runCli([
    "init",
    "--target",
    target,
    "--profile",
    "react-nextjs",
    "--ci",
    "none",
    "--review-templates",
    "--yes",
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(prTemplatePath, "utf8"), "custom pr template\n");
  assert.equal(fs.readFileSync(worksheetPath, "utf8"), "custom worksheet\n");
  assert.match(result.stdout, /skip: \.github\/PULL_REQUEST_TEMPLATE\.md \(review PR template exists\)/);
  assert.match(result.stdout, /skip: worksheet\/ai-code-understanding\.md \(review worksheet exists\)/);
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
  assert.match(readWorkflow(target, "ai-check.yml"), /run: pnpm ai:check$/m);
  assert.match(readWorkflow(target, "ai-check-fast.yml"), /run: pnpm ai:check:fast$/m);
});

test("reusable CI mode copies reusable workflow files", (t) => {
  const target = createFixture(t);
  const result = runCli(["init", "--target", target, "--profile", "react-nextjs+supabase-rls", "--ci", "reusable", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(target, ".github", "workflows", "ai-quality-reusable.yml")), true);
  assert.equal(fs.existsSync(path.join(target, ".github", "workflows", "ai-quality-call.yml")), true);
});

test("direct CI workflows render package-manager-specific commands", (t) => {
  const cases = [
    ["pnpm", "pnpm install --frozen-lockfile", "pnpm ai:check", "pnpm ai:check:fast"],
    ["npm", "npm ci", "npm run ai:check", "npm run ai:check:fast"],
    ["yarn", "yarn install --immutable", "yarn ai:check", "yarn ai:check:fast"],
    ["bun", "bun install --frozen-lockfile", "bun run ai:check", "bun run ai:check:fast"],
  ];

  for (const [packageManager, installCommand, fullCommand, fastCommand] of cases) {
    const target = createFixture(t);
    const result = runCli([
      "init",
      "--target",
      target,
      "--profile",
      "react-nextjs",
      "--ci",
      "direct",
      "--package-manager",
      packageManager,
      "--yes",
    ]);

    assert.equal(result.status, 0, result.stderr);
    const fullWorkflow = readWorkflow(target, "ai-check.yml");
    const fastWorkflow = readWorkflow(target, "ai-check-fast.yml");
    assert.match(fullWorkflow, new RegExp(`run: ${escapeRegExp(installCommand)}$`, "m"));
    assert.match(fullWorkflow, new RegExp(`run: ${escapeRegExp(fullCommand)}$`, "m"));
    assert.match(fastWorkflow, new RegExp(`run: ${escapeRegExp(fastCommand)}$`, "m"));

    if (packageManager !== "pnpm") {
      assert.doesNotMatch(fullWorkflow, /run: pnpm (install|ai:check)/);
      assert.doesNotMatch(fastWorkflow, /run: pnpm (install|ai:check)/);
    }
  }
});

test("reusable caller workflow renders package-manager-specific inputs", (t) => {
  const target = createFixture(t);
  const result = runCli([
    "init",
    "--target",
    target,
    "--profile",
    "react-nextjs",
    "--ci",
    "reusable",
    "--package-manager",
    "npm",
    "--yes",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const caller = readWorkflow(target, "ai-quality-call.yml");
  assert.match(caller, /package-manager: npm/);
  assert.match(caller, /check-command: npm run ai:check/);
});

test("Claude hooks copy rules and merge settings", (t) => {
  const target = createFixture(t);
  const result = runCli(["init", "--target", target, "--profile", "react-nextjs", "--ci", "none", "--claude-hooks", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(target, ".claude", "rules", "test-rules.md")), true);
  const settings = readClaudeSettings(target);
  assert.ok(settings.hooks.PostToolUse);
  assert.ok(settings.hooks.Stop);
  assert.equal(settings.hooks.PostToolUse[0].matcher, "Edit|Write|MultiEdit|NotebookEdit");
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

function localReadmeOperations(output) {
  return output.operations.filter((operation) => (
    operation.targetPath.endsWith(path.join(".claude", "rules", "local", "README.md"))
  ));
}

function sha256File(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

test("--claude-hooks 付き init は .claude/rules/local/README.md を create し再 init で skip する", (t) => {
  // SPEC-0057 AC-05 / FR-03 / INV-05 / POST-01 / POST-02 / OPS-01:
  // 初回 init は overlay README を create、再 init は skip で内容不変
  // （SHA-256 一致で検証）。--json 出力に create / skip が各 1 件現れる
  const target = createFixture(t);
  const readmePath = path.join(target, ".claude", "rules", "local", "README.md");

  const first = runCli(["init", "--target", target, "--profile", "react-nextjs", "--ci", "none", "--claude-hooks", "--yes", "--json"]);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(fs.existsSync(readmePath), true); // POST-01
  const firstOps = localReadmeOperations(JSON.parse(first.stdout));
  assert.equal(firstOps.length, 1); // POST-02: create または skip のいずれか 1 件
  assert.equal(firstOps[0].action, "create");
  const hashAfterCreate = sha256File(readmePath);

  const second = runCli(["init", "--target", target, "--profile", "react-nextjs", "--ci", "none", "--claude-hooks", "--yes", "--json"]);
  assert.equal(second.status, 0, second.stderr);
  const secondOps = localReadmeOperations(JSON.parse(second.stdout));
  assert.equal(secondOps.length, 1); // POST-02
  assert.equal(secondOps[0].action, "skip");
  // AC-05 / INV-05: 再 init 前後で README の内容が SHA-256 一致（不変）
  assert.equal(sha256File(readmePath), hashAfterCreate);
});

test("--claude-hooks なしの init は .claude/rules/local/ を作成しない", (t) => {
  // FR-03: overlay README の配置は --claude-hooks 指定時のみ
  const target = createFixture(t);
  const result = runCli(["init", "--target", target, "--profile", "react-nextjs", "--ci", "none", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(target, ".claude", "rules", "local")), false);
});

test("ユーザー編集済みの .claude/rules/local/README.md は再 init でも上書きされない", (t) => {
  // INV-05 / FR-04 の init 側保証: 既存 README（ユーザー改変済み）の内容を変更しない
  const target = createFixture(t);
  const readmePath = path.join(target, ".claude", "rules", "local", "README.md");
  fs.mkdirSync(path.dirname(readmePath), { recursive: true });
  fs.writeFileSync(readmePath, "user customized overlay guide\n");

  const result = runCli(["init", "--target", target, "--profile", "react-nextjs", "--ci", "none", "--claude-hooks", "--yes", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const ops = localReadmeOperations(JSON.parse(result.stdout));
  assert.equal(ops.length, 1);
  assert.equal(ops[0].action, "skip");
  assert.equal(fs.readFileSync(readmePath, "utf8"), "user customized overlay guide\n");
});

test(".claude/rules/local が同名ファイルの場合は破壊せず skip + 警告 reason を報告する", (t) => {
  // 想定エラー3 / FR-03: local がディレクトリでなくファイルとして存在する場合、
  // 上書き・削除せず skip し、reason で警告する（ユーザー領域を破壊しない）
  const target = createFixture(t);
  const localPath = path.join(target, ".claude", "rules", "local");
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  fs.writeFileSync(localPath, "user file named local\n");

  const result = runCli(["init", "--target", target, "--profile", "react-nextjs", "--ci", "none", "--claude-hooks", "--yes", "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const ops = localReadmeOperations(JSON.parse(result.stdout));
  assert.equal(ops.length, 1);
  assert.equal(ops[0].action, "skip");
  assert.match(ops[0].reason, /exists as a file/);
  // 想定エラー3: 同名ファイルはそのまま残る（破壊しない）
  assert.equal(fs.readFileSync(localPath, "utf8"), "user file named local\n");
});

test("existing files and scripts are not overwritten by default", (t) => {
  const target = createFixture(t, {
    name: "fixture",
    scripts: {
      "ai:check": "custom check",
      "ai:check:secure": "custom secure check",
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
  assert.equal(packageJson.scripts["ai:check:secure"], "custom secure check");
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
  assert.equal(fs.existsSync(path.join(target, ".github")), false);
  assert.equal(fs.existsSync(path.join(target, ".ai-check-template.json")), false);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// --- SPEC-0061 workspace mode ------------------------------------------------

function createWorkspaceFixture(t, { rootMarker = "pnpm-workspace.yaml" } = {}) {
  const dir = createTempDir(t, "ai-check-template-ws-");
  const rootPackageJson = { name: "root-fixture", private: true, scripts: {} };
  if (rootMarker === "workspaces") {
    rootPackageJson.workspaces = ["packages/*"];
  } else {
    fs.writeFileSync(path.join(dir, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n");
  }
  fs.writeFileSync(path.join(dir, "package.json"), `${JSON.stringify(rootPackageJson, null, 2)}\n`);
  fs.mkdirSync(path.join(dir, "packages", "app"), { recursive: true });
  fs.writeFileSync(
    path.join(dir, "packages", "app", "package.json"),
    `${JSON.stringify({ name: "@fixture/app", scripts: {} }, null, 2)}\n`,
  );
  return dir;
}

function readWorkspacePackageJson(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, "packages", "app", "package.json"), "utf8"));
}

// AC-02 / FR-03 / FR-04: pnpm — ルートに gate scripts（--filter 形）、パッケージに step + support scripts
test("init --workspace はルートに pnpm --filter 形の gate scripts、パッケージに step scripts を書く", (t) => {
  const target = createWorkspaceFixture(t);
  const result = runCli(["init", "--target", target, "--workspace", "packages/app", "--profile", "react-nextjs", "--ci", "none", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  const rootPackageJson = readPackageJson(target);
  const f = "pnpm --filter @fixture/app";
  assert.equal(
    rootPackageJson.scripts["ai:check"],
    `${f} typecheck && ${f} lint && ${f} doctor && ${f} deadcode && ${f} test && ${f} test:e2e:smoke`,
  );
  assert.equal(rootPackageJson.scripts["ai:check:fast"], `${f} typecheck && ${f} lint && ${f} test:unit`);
  assert.equal(
    rootPackageJson.scripts["ai:check:secure"],
    `${f} security:secrets && ${f} security:deps && ${f} security:supply-chain && ${f} security:sast`,
  );
  // FR-04: ルートには gate scripts のみ（step / support はパッケージ側）
  assert.equal(rootPackageJson.scripts.typecheck, undefined);
  assert.equal(rootPackageJson.scripts.doctor, undefined);
  assert.equal(rootPackageJson.scripts["security:secrets"], undefined);

  const packageJson = readWorkspacePackageJson(target);
  assert.equal(packageJson.scripts["ai:check"], undefined); // gate はパッケージ側に置かない（INV-02）
  assert.equal(packageJson.scripts.doctor, "npx -y react-doctor@latest . --fail-on warning");
  assert.equal(packageJson.scripts.deadcode, "knip");
  assert.equal(packageJson.scripts.typecheck, "tsc --noEmit");
  assert.equal(packageJson.scripts.lint, "eslint .");
  assert.equal(packageJson.scripts.test, "vitest run");
  assert.equal(packageJson.scripts["test:unit"], "vitest run --dir tests/unit");
  assert.equal(packageJson.scripts["test:e2e:smoke"], "playwright test --grep smoke");
  assert.equal(packageJson.scripts["security:secrets"], "npx -y @secretlint/quick-start \"**/*\"");
  assert.equal(packageJson.scripts["security:deps"], "pnpm audit --audit-level high");
  assert.equal(packageJson.scripts["security:sast"], "semgrep scan --config auto");

  // AC-03 / FR-05: state に workspace を記録、schemaVersion は 2 のまま
  const state = readInstallState(target);
  assert.equal(state.workspace, "packages/app");
  assert.equal(state.schemaVersion, 2);
});

// AC-02 / FR-03: npm — `npm run <step> --workspace <pkg-dir>` 形（<dir> を使う）
test("init --workspace は npm で run <step> --workspace <dir> 形の gate scripts を書く", (t) => {
  const target = createWorkspaceFixture(t, { rootMarker: "workspaces" });
  const result = runCli([
    "init", "--target", target, "--workspace", "packages/app",
    "--profile", "react-nextjs", "--package-manager", "npm", "--ci", "none", "--yes",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const rootPackageJson = readPackageJson(target);
  assert.equal(
    rootPackageJson.scripts["ai:check:fast"],
    "npm run typecheck --workspace packages/app && npm run lint --workspace packages/app && npm run test:unit --workspace packages/app",
  );
  assert.equal(readWorkspacePackageJson(target).scripts["security:deps"], "npm audit --audit-level high");
});

// AC-02 / FR-03: yarn — `yarn workspace <name> <step>` 形（<name> を使う）
test("init --workspace は yarn で workspace <name> <step> 形の gate scripts を書く", (t) => {
  const target = createWorkspaceFixture(t, { rootMarker: "workspaces" });
  const result = runCli([
    "init", "--target", target, "--workspace", "packages/app",
    "--profile", "react-nextjs", "--package-manager", "yarn", "--ci", "none", "--yes",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const w = "yarn workspace @fixture/app";
  assert.equal(readPackageJson(target).scripts["ai:check:fast"], `${w} typecheck && ${w} lint && ${w} test:unit`);
});

// AC-02 / FR-03: bun — `bun run --filter <name> <step>` 形（Bun v1.1+、tests/cli/workspace.test.mjs のコメント参照）
test("init --workspace は bun で run --filter <name> <step> 形の gate scripts を書く", (t) => {
  const target = createWorkspaceFixture(t, { rootMarker: "workspaces" });
  const result = runCli([
    "init", "--target", target, "--workspace", "packages/app",
    "--profile", "react-nextjs", "--package-manager", "bun", "--ci", "none", "--yes",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const w = "bun run --filter @fixture/app";
  assert.equal(readPackageJson(target).scripts["ai:check:fast"], `${w} typecheck && ${w} lint && ${w} test:unit`);
});

// AC-02 / FR-03: addon step（supabase-rls）も workspace 描画を通る
test("init --workspace は addon step も --filter 形で ai:check に追記する", (t) => {
  const target = createWorkspaceFixture(t);
  const result = runCli([
    "init", "--target", target, "--workspace", "packages/app",
    "--profile", "react-nextjs+supabase-rls", "--ci", "none", "--yes",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const f = "pnpm --filter @fixture/app";
  assert.match(
    readPackageJson(target).scripts["ai:check"],
    new RegExp(`${escapeRegExp(`${f} test:db && ${f} test:integration:rls`)}$`),
  );
  assert.equal(readWorkspacePackageJson(target).scripts["test:db"], "supabase test db");
});

// AC-03 / FR-05: --workspace 未指定 init の state に workspace キーが存在しない
test("init 未指定時は state に workspace キーを書かない", (t) => {
  const target = createFixture(t);
  const result = runCli(["init", "--target", target, "--profile", "react-nextjs", "--ci", "none", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal("workspace" in readInstallState(target), false);
});

// FR-08: --workspace と --install-deps の併用は CliError
test("init は --workspace と --install-deps の併用を CliError にする", (t) => {
  const target = createWorkspaceFixture(t);
  const before = snapshotDirectory(target);
  const result = runCli([
    "init", "--target", target, "--workspace", "packages/app", "--install-deps", "--ci", "none", "--yes",
  ]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--workspace cannot be combined with --install-deps/);
  assert.deepEqual(snapshotDirectory(target), before);
});

// FR-01: --workspace の複数指定は CliError（単一指定制限）
test("init は複数の --workspace 指定を CliError にする", (t) => {
  const target = createWorkspaceFixture(t);
  const before = snapshotDirectory(target);
  const result = runCli([
    "init", "--target", target, "--workspace", "packages/app", "--workspace", "packages/other", "--ci", "none", "--yes",
  ]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /only be specified once/);
  assert.deepEqual(snapshotDirectory(target), before);
});

// AC-06(a) / PRE-01: workspace ルートでない target への --workspace は何も書かず CliError
test("init は workspace ルートでない target への --workspace で何も書き込まない", (t) => {
  const target = createFixture(t);
  const before = snapshotDirectory(target);
  const result = runCli(["init", "--target", target, "--workspace", "packages/app", "--ci", "none", "--yes"]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /pnpm-workspace\.yaml/);
  assert.deepEqual(snapshotDirectory(target), before);
});
