import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { isValidWorkspaceStatePath, resolveWorkspace } from "../../src/cli/workspace.mjs";
import { workspaceScriptCommand } from "../../src/cli/package-manager.mjs";
import { loadInstallState } from "../../src/cli/install-state.mjs";
import { CliError } from "../../src/cli/utils.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const binPath = path.join(repoRoot, "bin", "ai-check-template.mjs");

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [binPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    ...options,
  });
}

function createTempDir(t, prefix = "ai-check-template-workspace-") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

// pnpm-workspace.yaml is only existence-checked (NFR-02), so its content is irrelevant.
function createWorkspaceFixture(t, { rootMarker = "pnpm-workspace.yaml", packageName = "@fixture/app" } = {}) {
  const dir = createTempDir(t);
  const rootPackageJson = { name: "root-fixture", private: true, scripts: {} };

  if (rootMarker === "workspaces-array") {
    rootPackageJson.workspaces = ["packages/*"];
  } else if (rootMarker === "workspaces-object") {
    rootPackageJson.workspaces = { packages: ["packages/*"] };
  } else if (rootMarker === "pnpm-workspace.yaml") {
    fs.writeFileSync(path.join(dir, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n");
  }

  fs.writeFileSync(path.join(dir, "package.json"), `${JSON.stringify(rootPackageJson, null, 2)}\n`);
  fs.mkdirSync(path.join(dir, "packages", "app"), { recursive: true });
  if (packageName !== null) {
    fs.writeFileSync(
      path.join(dir, "packages", "app", "package.json"),
      `${JSON.stringify({ name: packageName, scripts: {} }, null, 2)}\n`,
    );
  }
  return dir;
}

async function assertCliError(promise, messagePattern) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof CliError, `expected CliError, got ${error?.constructor?.name}: ${error?.message}`);
    if (messagePattern) {
      assert.match(error.message, messagePattern);
    }
    return true;
  });
}

// --- resolveWorkspace: FR-02 (a) workspace root detection -------------------

// AC-06 / FR-02(a) 成功 / NFR-04 分岐(1)
test("resolveWorkspace は pnpm-workspace.yaml のあるルートで {dir, name} を返す", async (t) => {
  const dir = createWorkspaceFixture(t, { rootMarker: "pnpm-workspace.yaml" });
  assert.deepEqual(await resolveWorkspace(dir, "packages/app"), { dir: "packages/app", name: "@fixture/app" });
});

// AC-06 / FR-02(a) 成功（workspaces 配列）
test("resolveWorkspace は package.json の workspaces 配列でルート判定する", async (t) => {
  const dir = createWorkspaceFixture(t, { rootMarker: "workspaces-array" });
  assert.deepEqual(await resolveWorkspace(dir, "packages/app"), { dir: "packages/app", name: "@fixture/app" });
});

// AC-06 / FR-02(a) 成功（workspaces { packages: [...] } 形式）
test("resolveWorkspace は workspaces の { packages: [...] } 形式でもルート判定する", async (t) => {
  const dir = createWorkspaceFixture(t, { rootMarker: "workspaces-object" });
  assert.deepEqual(await resolveWorkspace(dir, "packages/app"), { dir: "packages/app", name: "@fixture/app" });
});

// AC-06(a) 失敗 / FR-02(a) / 想定エラー3: エラーメッセージが 2 検出手段を明記する
test("resolveWorkspace は workspace ルートでない target で CliError になる", async (t) => {
  const dir = createWorkspaceFixture(t, { rootMarker: "none" });
  await assertCliError(resolveWorkspace(dir, "packages/app"), /pnpm-workspace\.yaml.*workspaces/s);
});

// --- resolveWorkspace: FR-02 (b) package directory ---------------------------

// AC-06(b) 失敗 / 想定エラー1: pkg-dir と target を含む CliError / NFR-04 分岐(2)
test("resolveWorkspace は pkg-dir 不在で CliError になる", async (t) => {
  const dir = createWorkspaceFixture(t);
  await assertCliError(resolveWorkspace(dir, "packages/ghost"), /packages\/ghost/);
});

// AC-06(b) 失敗: pkg-dir がディレクトリでなくファイル
test("resolveWorkspace は pkg-dir がファイルの場合 CliError になる", async (t) => {
  const dir = createWorkspaceFixture(t);
  fs.writeFileSync(path.join(dir, "packages", "file-not-dir"), "");
  await assertCliError(resolveWorkspace(dir, "packages/file-not-dir"), /does not exist/);
});

// --- resolveWorkspace: FR-02 (c) package.json / name -------------------------

// AC-06(c) 失敗 / 想定エラー2 / NFR-04 分岐(3)
test("resolveWorkspace は pkg-dir に package.json が無い場合 CliError になる", async (t) => {
  const dir = createWorkspaceFixture(t, { packageName: null });
  await assertCliError(resolveWorkspace(dir, "packages/app"), /non-empty "name"/);
});

// AC-06(c) 失敗: name が空文字列
test("resolveWorkspace は name が空文字列の場合 CliError になる", async (t) => {
  const dir = createWorkspaceFixture(t, { packageName: "" });
  await assertCliError(resolveWorkspace(dir, "packages/app"), /non-empty "name"/);
});

// AC-06(c) 失敗: name が非文字列
test("resolveWorkspace は name が非文字列の場合 CliError になる", async (t) => {
  const dir = createWorkspaceFixture(t);
  fs.writeFileSync(
    path.join(dir, "packages", "app", "package.json"),
    `${JSON.stringify({ name: 42 }, null, 2)}\n`,
  );
  await assertCliError(resolveWorkspace(dir, "packages/app"), /non-empty "name"/);
});

// --- resolveWorkspace: SEC-01 / SEC-02 / 境界ケース2 --------------------------

// AC-07 / SEC-01: ".." セグメントはパストラバーサルとして拒否
test("resolveWorkspace は ../outside を CliError にする", async (t) => {
  const dir = createWorkspaceFixture(t);
  await assertCliError(resolveWorkspace(dir, "../outside"));
});

// AC-07 / SEC-01: 途中の ".." も拒否
test("resolveWorkspace は packages/../../outside を CliError にする", async (t) => {
  const dir = createWorkspaceFixture(t);
  await assertCliError(resolveWorkspace(dir, "packages/../../outside"));
});

// AC-07 / SEC-01: 絶対パスは拒否
test("resolveWorkspace は絶対パスを CliError にする", async (t) => {
  const dir = createWorkspaceFixture(t);
  await assertCliError(resolveWorkspace(dir, path.join(dir, "packages", "app")), /absolute/);
});

// AC-07 / SEC-02: シェルメタ文字入り pkg-dir は拒否
test("resolveWorkspace はシェルメタ文字入り pkg-dir を CliError にする", async (t) => {
  const dir = createWorkspaceFixture(t);
  for (const pkgDir of ["packages/app;rm -rf /", "packages/app|x", "packages/$(x)", "packages/a b", "packages/a&b"]) {
    await assertCliError(resolveWorkspace(dir, pkgDir), /metacharacters/);
  }
});

// AC-07 / SEC-02 / INV-04: 対象パッケージの不正 name（メタ文字入り）は埋め込み前に拒否
test("resolveWorkspace は不正な package name を CliError にする", async (t) => {
  for (const badName of ["bad name", "app;rm", "a$(x)", "a|b"]) {
    const dir = createWorkspaceFixture(t, { packageName: badName });
    await assertCliError(resolveWorkspace(dir, "packages/app"), /cannot be embedded/);
  }
});

// 境界ケース2: "--workspace ." は target 自身の指定なので CliError
test("resolveWorkspace は '.' を CliError にする", async (t) => {
  const dir = createWorkspaceFixture(t);
  await assertCliError(resolveWorkspace(dir, "."), /drop --workspace/);
});

// --- resolveWorkspace: SEC-02 / SEC-WS-01 先頭ダッシュ拒否 --------------------

// SEC-02 / SEC-WS-01: 対象パッケージ name が "-" 始まりだと `pnpm --filter <name>`
// でフラグ誤認されるため、埋め込み前に拒否する
test("resolveWorkspace は '-' 始まりの package name を CliError にする", async (t) => {
  for (const badName of ["--evil", "-x"]) {
    const dir = createWorkspaceFixture(t, { packageName: badName });
    await assertCliError(resolveWorkspace(dir, "packages/app"), /must not start with "-"/);
  }
});

// SEC-02 / SEC-WS-01: 正当な @scope/pkg 名（先頭は "@"）は先頭ダッシュ拒否に
// 巻き込まれず成功し続ける明示ケース
test("resolveWorkspace は正当な @scope/pkg 名を成功させ続ける", async (t) => {
  const dir = createWorkspaceFixture(t, { packageName: "@scope/pkg" });
  assert.deepEqual(await resolveWorkspace(dir, "packages/app"), { dir: "packages/app", name: "@scope/pkg" });
});

// SEC-WS-01: pkg-dir のセグメントが "-" 始まりだと `--filter <dir>` でフラグ
// 誤認されるため、normalizeWorkspaceDir（resolveWorkspace 経由）で拒否する
test("resolveWorkspace は '-' 始まりの pkg-dir セグメントを CliError にする", async (t) => {
  const dir = createWorkspaceFixture(t);
  for (const pkgDir of ["-x/app", "packages/-hidden"]) {
    await assertCliError(resolveWorkspace(dir, pkgDir), /must not start with "-"/);
  }
});

// FR-05: dir は "/" 区切りに正規化される（冗長セグメントの除去）
test("resolveWorkspace は ./packages//app/ を packages/app に正規化する", async (t) => {
  const dir = createWorkspaceFixture(t);
  assert.deepEqual(await resolveWorkspace(dir, "./packages//app/"), { dir: "packages/app", name: "@fixture/app" });
});

// --- workspaceScriptCommand: AC-02 / FR-03 / NFR-04 分岐(4) -------------------
// 実 PM バイナリは実行せず invocation 文字列の組み立てのみを検証する。
// PM 公式ドキュメント照合済み（2026-07-03）:
// - pnpm: `pnpm --filter <name> <script>` (pnpm.io/filtering)
// - npm:  `npm run <script> --workspace <dir>` (docs.npmjs.com/cli/using-npm/workspaces)
// - yarn: `yarn workspace <name> <script>` (yarnpkg.com/cli/workspace)
// - bun:  `bun run --filter <name> <script>` — --filter は bun v1.1.4 以降でサポート
//   (bun.sh/docs/cli/filter)。それ以前の bun では動作しない点をここに記録する（AC-02）。

const WORKSPACE = { dir: "packages/app", name: "@fixture/app" };

// AC-02 / FR-03: pnpm invocation
test("workspaceScriptCommand は pnpm で --filter <name> 形を返す", () => {
  assert.equal(workspaceScriptCommand("pnpm", WORKSPACE, "typecheck"), "pnpm --filter @fixture/app typecheck");
});

// AC-02 / FR-03: npm invocation（<pkg-dir> を使う）
test("workspaceScriptCommand は npm で run <step> --workspace <dir> 形を返す", () => {
  assert.equal(workspaceScriptCommand("npm", WORKSPACE, "typecheck"), "npm run typecheck --workspace packages/app");
});

// AC-02 / FR-03: yarn invocation（<name> を使う）
test("workspaceScriptCommand は yarn で workspace <name> <step> 形を返す", () => {
  assert.equal(workspaceScriptCommand("yarn", WORKSPACE, "typecheck"), "yarn workspace @fixture/app typecheck");
});

// AC-02 / FR-03: bun invocation（bun v1.1.4+ の --filter、上記コメント参照）
test("workspaceScriptCommand は bun で run --filter <name> <step> 形を返す", () => {
  assert.equal(workspaceScriptCommand("bun", WORKSPACE, "typecheck"), "bun run --filter @fixture/app typecheck");
});

// --- isValidWorkspaceStatePath: FR-05 / INV-05 --------------------------------

// AC-03 / FR-05: state の workspace は valid 相対パスか欠落の 2 状態のみ（INV-05）
test("isValidWorkspaceStatePath は相対パスのみ valid にする", () => {
  assert.equal(isValidWorkspaceStatePath("packages/app"), true);
  assert.equal(isValidWorkspaceStatePath("app"), true);
  // null / 空文字 / 非文字列 / 絶対パス / ".." / メタ文字は invalid
  assert.equal(isValidWorkspaceStatePath(null), false);
  assert.equal(isValidWorkspaceStatePath(""), false);
  assert.equal(isValidWorkspaceStatePath(42), false);
  assert.equal(isValidWorkspaceStatePath("/abs/path"), false);
  assert.equal(isValidWorkspaceStatePath("packages/../outside"), false);
  assert.equal(isValidWorkspaceStatePath("packages/a b"), false);
});

// BC-06: isValidWorkspaceStatePath の受理集合。"." / "./"（target 自身）と
// "-x/app"（先頭ダッシュ）/ "packages/../outside"（traversal）は false、
// "packages/app" / "app" は true
test("isValidWorkspaceStatePath は '.' '-x/app' 'traversal' を false、'packages/app' 'app' を true にする", () => {
  assert.equal(isValidWorkspaceStatePath("."), false);
  assert.equal(isValidWorkspaceStatePath("./"), false);
  assert.equal(isValidWorkspaceStatePath("-x/app"), false);
  assert.equal(isValidWorkspaceStatePath("packages/../outside"), false);
  assert.equal(isValidWorkspaceStatePath("packages/app"), true);
  assert.equal(isValidWorkspaceStatePath("app"), true);
});

// BC-06: normalizeWorkspaceDir と isValidWorkspaceStatePath は同一の受理集合を
// 共有する（isAcceptableWorkspacePath）。代表入力で「両者の判定が揃う」ことを
// 確認する。normalizeWorkspaceDir は非公開なので、resolveWorkspace 経由で
// pkg-dir 検証段階の受理/拒否が isValidWorkspaceStatePath と一致することを見る。
// resolveWorkspace は受理後さらに FS 存在チェックへ進むため、拒否側は必ず
// CliError、受理側は「pkg-dir 検証を通過して FS 段階のエラーになる（= 受理集合
// では拒否されない）」ことで一致を確認する。
test("BC-06: resolveWorkspace の pkg-dir 検証と isValidWorkspaceStatePath の判定が代表入力で揃う", async (t) => {
  const dir = createWorkspaceFixture(t);

  // 拒否される入力: isValidWorkspaceStatePath=false かつ resolveWorkspace=CliError
  for (const rejected of [".", "./", "-x/app", "packages/../outside"]) {
    assert.equal(isValidWorkspaceStatePath(rejected), false, `${rejected} は state path として invalid のはず`);
    await assertCliError(resolveWorkspace(dir, rejected));
  }

  // 受理される入力: isValidWorkspaceStatePath=true。pkg-dir 検証を通過するので
  // resolveWorkspace は受理集合では拒否せず、FS 存在チェック段階まで到達する
  // （"packages/app" は fixture に存在するので成功、"app" は不在で "does not
  // exist" になる = 受理集合ではねられていない証拠）。
  assert.equal(isValidWorkspaceStatePath("packages/app"), true);
  assert.deepEqual(await resolveWorkspace(dir, "packages/app"), { dir: "packages/app", name: "@fixture/app" });

  assert.equal(isValidWorkspaceStatePath("app"), true);
  await assertCliError(resolveWorkspace(dir, "app"), /does not exist/);
});

// --- install state round-trip: AC-03 / FR-05 / 想定エラー5 --------------------

function tamperState(dir, mutate) {
  const statePath = path.join(dir, ".ai-check-template.json");
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  mutate(state);
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

// AC-03: workspace 付き state は loadInstallState で valid、欠落も valid（FR-03 相当の state 検証）
test("loadInstallState は workspace 付き state を valid、欠落 state も valid にする", async (t) => {
  const dir = createWorkspaceFixture(t);
  const result = runCli(["init", "--target", dir, "--workspace", "packages/app", "--ci", "none", "--yes"]);
  assert.equal(result.status, 0, result.stderr);

  const loaded = await loadInstallState(dir);
  assert.equal(loaded.error, null);
  assert.equal(loaded.state.workspace, "packages/app");
  assert.equal(loaded.state.schemaVersion, 2);

  // workspace キー欠落 = 単一パッケージとして valid（INV-05）
  tamperState(dir, (state) => {
    delete state.workspace;
  });
  const withoutWorkspace = await loadInstallState(dir);
  assert.equal(withoutWorkspace.error, null);
  assert.equal("workspace" in withoutWorkspace.state, false);
});

// AC-03 / 想定エラー5: null / 空文字 / 絶対パス / ".." 入りの workspace は invalid-install-state
test("loadInstallState は不正な workspace を invalid-install-state にする", async (t) => {
  const dir = createWorkspaceFixture(t);
  const result = runCli(["init", "--target", dir, "--workspace", "packages/app", "--ci", "none", "--yes"]);
  assert.equal(result.status, 0, result.stderr);

  for (const badValue of [null, "", "/abs/path", "packages/../outside", 42]) {
    tamperState(dir, (state) => {
      state.workspace = badValue;
    });
    const loaded = await loadInstallState(dir);
    assert.equal(loaded.error?.code, "invalid-install-state", `workspace=${JSON.stringify(badValue)} should be invalid`);
    assert.equal(loaded.state, null);
  }
});
