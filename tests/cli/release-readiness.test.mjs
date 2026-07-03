import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const binPath = path.join(repoRoot, "bin", "ai-check-template.mjs");
const PKG_VERSION = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")).version;

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [binPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    ...options,
  });
}

function createFixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-check-template-release-"));
  fs.writeFileSync(path.join(dir, "package.json"), `${JSON.stringify({ name: "fixture", scripts: {} }, null, 2)}\n`);
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

function initScriptsFixture(t) {
  const target = createFixture(t);
  const init = runCli(["init", "--target", target, "--profile", "node-cli", "--ci", "none", "--yes"]);
  assert.equal(init.status, 0, init.stderr);
  return target;
}

// 配布 scripts 3 本の名前（SPEC-0057 FR-01 の対象）
const SCRIPT_NAMES = ["ai-check.sh", "ai-check-fast.sh", "ai-check-secure.sh"];

// scripts から local overlay の source ブロックを抜き出す
// （"# local overlay:" コメントから閉じ "fi" まで — 実装ルール: 3 本同一パターン・同一コメント）
function extractOverlayBlock(content, name) {
  const start = content.indexOf("# local overlay:");
  assert.notEqual(start, -1, `${name} must contain the local overlay block (FR-01)`);
  const end = content.indexOf("\nfi\n", start);
  assert.notEqual(end, -1, `${name} overlay block must close with fi (FR-01)`);
  return content.slice(start, end + "\nfi\n".length);
}

// 委譲先 PM を偽装する実行ファイルを作り、その絶対パスを PM env var として渡す
function createFakePm(t) {
  const binDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-check-template-fakepm-"));
  t.after(() => {
    fs.rmSync(binDir, { recursive: true, force: true });
  });
  const pmPath = path.join(binDir, "fakepm");
  fs.writeFileSync(pmPath, "#!/bin/sh\necho \"fakepm $*\"\n");
  fs.chmodSync(pmPath, 0o755);
  return pmPath;
}

function runScript(target, name, { cwd = target, env = {} } = {}) {
  return spawnSync("bash", [path.join(target, "scripts", name)], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

test("配布 scripts 3 本は同一の ai-check.local.sh source ブロックを持つ", (t) => {
  // AC-02 / FR-01 / OPS-02 / SEC-01: init 後の 3 scripts すべてに同型（byte 一致）の
  // source 機構が存在し、set -euo pipefail は維持される（INV-04 の前提）
  const target = initScriptsFixture(t);
  const blocks = SCRIPT_NAMES.map((name) => {
    const content = fs.readFileSync(path.join(target, "scripts", name), "utf8");
    assert.match(content, /set -euo pipefail/, `${name} must keep set -euo pipefail (INV-04)`);
    assert.match(content, /ai-check\.local\.sh/, `${name} must reference ai-check.local.sh (FR-01)`);
    return extractOverlayBlock(content, name);
  });
  assert.equal(blocks[1], blocks[0], "ai-check-fast.sh overlay block must be byte-identical");
  assert.equal(blocks[2], blocks[0], "ai-check-secure.sh overlay block must be byte-identical");
});

test("ai-check.local.sh は存在すれば source され、無ければ従来どおり動作する", (t) => {
  // AC-02 / FR-01 / INV-03: local 配置で source される（env var 上書きが効く）、
  // 削除すると従来どおり（opt-in 保証）。
  // 想定エラー2: local に実行権限(+x)が無くても source は読み取りのみで成功する
  const target = initScriptsFixture(t);
  const fakePm = createFakePm(t);
  const localPath = path.join(target, "scripts", "ai-check.local.sh");

  for (const name of SCRIPT_NAMES) {
    fs.writeFileSync(localPath, "echo \"local overlay loaded\"\nexport AI_CHECK_LOCAL_MARK=1\n");
    fs.chmodSync(localPath, 0o644); // 実行権限なし（想定エラー2）

    const withLocal = runScript(target, name, { env: { PM: fakePm } });
    assert.equal(withLocal.status, 0, `${name}: ${withLocal.stderr}`);
    assert.match(withLocal.stdout, /local overlay loaded/, `${name} must source ai-check.local.sh (FR-01)`);

    fs.rmSync(localPath);
    const withoutLocal = runScript(target, name, { env: { PM: fakePm } });
    assert.equal(withoutLocal.status, 0, `${name}: ${withoutLocal.stderr}`);
    assert.doesNotMatch(withoutLocal.stdout, /local overlay loaded/, `${name} must run unchanged without local (INV-03)`);
    assert.match(withoutLocal.stdout, /fakepm/, `${name} must still delegate to PM (INV-03)`);
  }
});

test("ai-check.local.sh の解決は cwd ではなく scripts 自身の位置基準である", (t) => {
  // PRE-01 / FR-01: 別 cwd から呼び出しても同ディレクトリの local が source される
  const target = initScriptsFixture(t);
  const fakePm = createFakePm(t);
  fs.writeFileSync(
    path.join(target, "scripts", "ai-check.local.sh"),
    "echo \"local overlay loaded\"\n",
  );
  const otherCwd = fs.mkdtempSync(path.join(os.tmpdir(), "ai-check-template-cwd-"));
  t.after(() => {
    fs.rmSync(otherCwd, { recursive: true, force: true });
  });

  const result = runScript(target, "ai-check.sh", { cwd: otherCwd, env: { PM: fakePm } });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /local overlay loaded/);
});

test("構文エラーの ai-check.local.sh は scripts を非 0 で即終了させる", (t) => {
  // 想定エラー1 / INV-04: set -euo pipefail 下の source 失敗は silent に握りつぶされず、
  // bash 標準のエラーで非 0 終了する
  const target = initScriptsFixture(t);
  const fakePm = createFakePm(t);
  fs.writeFileSync(path.join(target, "scripts", "ai-check.local.sh"), "if [ broken\n");

  const result = runScript(target, "ai-check.sh", { env: { PM: fakePm } });

  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.stdout, /fakepm/, "PM delegation must not run after a failed source (INV-04)");
});

function readPackageJson(target) {
  return JSON.parse(fs.readFileSync(path.join(target, "package.json"), "utf8"));
}

function writePackageJson(target, packageJson) {
  fs.writeFileSync(path.join(target, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`);
}

test("release readiness lifecycle covers init, doctor, update, and strict doctor", (t) => {
  const target = createFixture(t);

  const init = runCli([
    "init",
    "--target",
    target,
    "--profile",
    "node-cli",
    "--ci",
    "none",
    "--yes",
  ]);
  assert.equal(init.status, 0, init.stderr);

  const firstDoctor = runCli(["doctor", "--target", target, "--json"]);
  assert.equal(firstDoctor.status, 0, firstDoctor.stderr);
  assert.equal(JSON.parse(firstDoctor.stdout).status, "pass");

  const packageJson = readPackageJson(target);
  packageJson.scripts["ai:check"] = "custom";
  writePackageJson(target, packageJson);
  fs.writeFileSync(path.join(target, "scripts", "ai-check.sh"), "changed\n");

  const driftedDoctor = runCli(["doctor", "--target", target, "--json"]);
  assert.notEqual(driftedDoctor.status, 0);
  assert.equal(JSON.parse(driftedDoctor.stdout).status, "fail");

  const update = runCli(["update", "--target", target, "--yes", "--json"]);
  assert.equal(update.status, 0, update.stderr);
  const updateOutput = JSON.parse(update.stdout);
  assert.equal(updateOutput.status, "updated");
  assert.equal(updateOutput.operations.some(
    (operation) => operation.action === "update" && operation.path === "package.json",
  ), true);
  // AC-03 / FR-02 / INV-01: baseline から改変された managed ファイルは
  // デフォルトの update では上書きされず skip-modified になる
  assert.equal(updateOutput.operations.some(
    (operation) => operation.action === "skip-modified" && operation.path === "scripts/ai-check.sh",
  ), true);
  assert.equal(fs.readFileSync(path.join(target, "scripts", "ai-check.sh"), "utf8"), "changed\n");

  // FR-06: 改変ファイルが残る間、strict doctor は modified-local warning で失敗する
  const modifiedStrictDoctor = runCli(["doctor", "--target", target, "--strict", "--json"]);
  assert.notEqual(modifiedStrictDoctor.status, 0);
  assert.equal(JSON.parse(modifiedStrictDoctor.stdout).warnings.some(
    (warning) => warning.code === "modified-local" && warning.path === "scripts/ai-check.sh",
  ), true);

  // AC-04 / FR-03: --force-managed で上書きし .bak-<version> を生成して解消する
  const forced = runCli(["update", "--target", target, "--force-managed", "--yes", "--json"]);
  assert.equal(forced.status, 0, forced.stderr);
  assert.equal(JSON.parse(forced.stdout).operations.some(
    (operation) => operation.action === "overwrite-forced" && operation.path === "scripts/ai-check.sh",
  ), true);
  assert.equal(fs.readFileSync(path.join(target, "scripts", `ai-check.sh.bak-${PKG_VERSION}`), "utf8"), "changed\n");

  const strictDoctor = runCli(["doctor", "--target", target, "--strict", "--json"]);
  assert.equal(strictDoctor.status, 0, strictDoctor.stderr);
  const strictOutput = JSON.parse(strictDoctor.stdout);
  assert.equal(strictOutput.status, "pass");
  assert.equal(strictOutput.strict, true);
  assert.equal(strictOutput.issues.length, 0);
  assert.equal(strictOutput.warnings.length, 0);
});
