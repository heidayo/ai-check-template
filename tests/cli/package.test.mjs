import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

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
    "README-ja.md",
    "package.json",
    "bin/ai-check-template.mjs",
    "src/cli/index.mjs",
    "src/cli/doctor.mjs",
    "src/cli/install-state.mjs",
    "src/cli/init.mjs",
    "src/cli/profile.mjs",
    "src/cli/update.mjs",
    "src/cli/utils.mjs",
    "docs/cli.md",
    "package-templates/package.scripts.fragment.json",
    "package-templates/scripts/ai-check.sh",
    "package-templates/ci-examples/github-actions/ai-check.yml",
    "package-templates/.claude/settings.hook-fragment.json",
  ];

  for (const filePath of requiredFiles) {
    assert.equal(files.has(filePath), true, `${filePath} should be packed`);
  }

  for (const filePath of files) {
    assert.equal(filePath.startsWith("specs/"), false, `${filePath} should not be packed`);
    assert.equal(filePath.startsWith("plans/"), false, `${filePath} should not be packed`);
    assert.equal(filePath.startsWith("tasks/"), false, `${filePath} should not be packed`);
    assert.equal(filePath.startsWith("tests/"), false, `${filePath} should not be packed`);
    assert.equal(filePath.startsWith(".github/"), false, `${filePath} should not be packed`);
  }
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
  assert.equal(packageJson.scripts["ai:check"], "pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e:smoke");
  assert.equal(packageJson.scripts["ai:check:fast"], "pnpm typecheck && pnpm lint && pnpm test:unit");
  assert.equal(fs.existsSync(path.join(target, "scripts", "ai-check.sh")), true);
  assert.equal(fs.existsSync(path.join(target, "scripts", "ai-check-fast.sh")), true);
});
