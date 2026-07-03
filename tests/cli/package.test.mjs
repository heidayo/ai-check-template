import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PNPM_SECURE_SCRIPT = "pnpm security:secrets && pnpm security:deps && pnpm security:supply-chain && pnpm security:sast";

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    ...options,
  });
}

function runNpm(args, options = {}) {
  return run("npm", args, options);
}

function createTempDir(t, prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

function createFixture(t) {
  const dir = createTempDir(t, "ai-check-template-target-");
  fs.writeFileSync(path.join(dir, "package.json"), `${JSON.stringify({ name: "fixture", scripts: {} }, null, 2)}\n`);
  return dir;
}

function dryRunPack() {
  const result = runNpm(["pack", "--dry-run", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout)[0];
}

function packTarball(t) {
  const packDir = createTempDir(t, "ai-check-template-pack-");
  const result = runNpm(["pack", "--pack-destination", packDir, "--json"]);

  assert.equal(result.status, 0, result.stderr);
  const [pack] = JSON.parse(result.stdout);
  return path.join(packDir, path.basename(pack.filename));
}

function installTarball(t, tarballPath) {
  const installDir = createTempDir(t, "ai-check-template-install-");
  const result = runNpm(
    ["install", "--prefix", installDir, tarballPath, "--ignore-scripts", "--no-audit", "--no-fund"],
  );

  assert.equal(result.status, 0, result.stderr);
  return path.join(installDir, "node_modules", ".bin", "ai-check-template");
}

test("npm pack dry-run includes runtime files and excludes repository-only files", () => {
  const pack = dryRunPack();
  const files = new Set(pack.files.map((file) => file.path));
  const requiredFiles = [
    "LICENSE",
    "README.md",
    "README-en.md",
    "README-ja.md",
    "package.json",
    "bin/ai-check-template.mjs",
    "src/cli/ci-workflows.mjs",
    "src/cli/claude-hooks.mjs",
    "src/cli/dependency-installer.mjs",
    "src/cli/expect.mjs",
    "src/cli/profile-docs.mjs",
    "src/cli/run.mjs",
    // SPEC-0058 AC-09: config 検出・validation モジュールは pack に含まれる
    "src/cli/check-config.mjs",
    "src/cli/index.mjs",
    "src/cli/doctor.mjs",
    "src/cli/install-state.mjs",
    "src/cli/init.mjs",
    "src/cli/package-manager.mjs",
    "src/cli/profile.mjs",
    "src/cli/profile-diagnostics.mjs",
    "src/cli/profile-scripts.mjs",
    "src/cli/update.mjs",
    "src/cli/utils.mjs",
    "docs/cli.md",
    "package-templates/package.scripts.fragment.json",
    // SPEC-0059 AC-09: report コマンドと run 結果 schema は pack に含まれる
    "src/cli/report.mjs",
    "package-templates/docs/run-result.schema.json",
    "package-templates/docs/ac-test-matrix.schema.json",
    "package-templates/docs/ac-test-matrix.example.json",
    "package-templates/docs/ac-test-matrix.example.yaml",
    "package-templates/scripts/ai-check.sh",
    // SPEC-0057 AC-08: overlay 案内 README テンプレートは pack に含まれる
    "package-templates/.claude/rules/local/README.md",
    "package-templates/ci-examples/github-actions/ai-check.yml",
    "package-templates/.claude/settings.hook-fragment.json",
    "package-templates/playwright/README.md",
    "package-templates/playwright/playwright.config.ts",
    "package-templates/playwright/tests/smoke.spec.ts",
    "package-templates/prompts/e2e-test-creation.md",
    "package-templates/prompts/security-scan.md",
    "package-templates/supabase/README.md",
    "package-templates/supabase/tests/database/rls_policy.test.sql",
    "package-templates/supabase/tests/rls/rls.integration.test.ts",
    "package-templates/supabase/tests/e2e/magic-link.spec.ts",
  ];

  for (const filePath of requiredFiles) {
    assert.equal(files.has(filePath), true, `${filePath} should be packed`);
  }

  for (const filePath of files) {
    // SPEC-0057 AC-08 / FR-02: ai-check.local.sh 実ファイルは配布物に含めない
    // （overlay はユーザーが作成する。example は README 内コードブロックのみ）
    assert.equal(filePath.endsWith("ai-check.local.sh"), false, `${filePath} should not be packed`);
    // SPEC-0058 AC-09 / FR-08: `.ai-check.yaml` / `.ai-check.json` 実ファイルは
    // 配布物に含めない（config はユーザーが手書きする opt-in。例示は docs 内のみ）
    assert.equal(filePath.endsWith(".ai-check.yaml"), false, `${filePath} should not be packed`);
    assert.equal(filePath.endsWith(".ai-check.json"), false, `${filePath} should not be packed`);
    assert.equal(filePath.startsWith("specs/"), false, `${filePath} should not be packed`);
    assert.equal(filePath.startsWith("plans/"), false, `${filePath} should not be packed`);
    assert.equal(filePath.startsWith("tasks/"), false, `${filePath} should not be packed`);
    assert.equal(filePath.startsWith("tests/"), false, `${filePath} should not be packed`);
    assert.equal(filePath.startsWith(".github/"), false, `${filePath} should not be packed`);
  }
});

test("package.json は runtime dependencies を持たない", () => {
  // SPEC-0058 NFR-02 / Forbidden Shortcuts: YAML パーサ等のための npm 依存追加を禁止
  // （YAML はサブセット自前パーサ、JSON は JSON.parse）。dependencies フィールドが
  // 存在しない、または空であることを検査する
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));

  assert.equal(
    packageJson.dependencies === undefined || Object.keys(packageJson.dependencies).length === 0,
    true,
    `package.json must not declare runtime dependencies: ${JSON.stringify(packageJson.dependencies)}`,
  );
});

test("packed tarball exposes the CLI binary", (t) => {
  const tarballPath = packTarball(t);
  const binPath = installTarball(t, tarballPath);
  const result = run(binPath, ["--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ai-check-template/);
  assert.match(result.stdout, /init/);
});

test("packed tarball can init a fixture project", (t) => {
  const tarballPath = packTarball(t);
  const binPath = installTarball(t, tarballPath);
  const target = createFixture(t);
  const result = run(binPath, ["init", "--target", target, "--profile", "react-nextjs", "--ci", "none", "--yes"]);

  assert.equal(result.status, 0, result.stderr);
  const packageJson = JSON.parse(fs.readFileSync(path.join(target, "package.json"), "utf8"));
  assert.equal(packageJson.scripts["ai:check"], "pnpm typecheck && pnpm lint && pnpm doctor && pnpm deadcode && pnpm test && pnpm test:e2e:smoke");
  assert.equal(packageJson.scripts["ai:check:fast"], "pnpm typecheck && pnpm lint && pnpm test:unit");
  assert.equal(packageJson.scripts["ai:check:secure"], PNPM_SECURE_SCRIPT);
  assert.equal(fs.existsSync(path.join(target, "scripts", "ai-check.sh")), true);
  assert.equal(fs.existsSync(path.join(target, "scripts", "ai-check-fast.sh")), true);
  assert.equal(fs.existsSync(path.join(target, "scripts", "ai-check-secure.sh")), true);
});
