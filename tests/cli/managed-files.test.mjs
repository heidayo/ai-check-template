import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  collectManagedFileHashes,
  getManagedFiles,
  hashContent,
  managedFileStateKey,
} from "../../src/cli/managed-files.mjs";
import {
  DIRECT_CI_FILES,
  isManagedCiWorkflowContent,
  renderedCiWorkflow,
} from "../../src/cli/ci-workflows.mjs";

const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn", "bun"];

// SPEC-0056 unit tests for the single managed-file listing module (INV-03).
// Expected values are derived from the SPEC (scope bullet: shell scripts,
// CI workflows, Claude hooks/rules, review templates, profile docs), not
// from reading the implementation internals.

function createTempDir(t, prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

test("hashContent は sha256:<64hex> 形式のハッシュを返す", () => {
  // INV-02 / schema v2 契約: managedFiles の hash は sha256:<64hex>
  const hash = hashContent("hello\n");

  assert.match(hash, /^sha256:[0-9a-f]{64}$/);
  assert.equal(hash, `sha256:${createHash("sha256").update("hello\n").digest("hex")}`);
});

test("getManagedFiles は shell script / profile doc / CI / Claude rule / review template を列挙する", () => {
  // SPEC-0056 スコープ: 管理対象ファイル（shell scripts、CI workflow、
  // Claude hooks/rules、review templates、profile docs）を列挙する（INV-03）
  const files = getManagedFiles({
    profile: "react-nextjs",
    packageManager: "pnpm",
    ci: "direct",
    claudeHooks: true,
    reviewTemplates: true,
  });
  const paths = files.map((file) => managedFileStateKey(file.relativePath));

  for (const expected of [
    "scripts/ai-check.sh",
    "scripts/ai-check-fast.sh",
    "scripts/ai-check-secure.sh",
    ".github/workflows/ai-check.yml",
    ".github/workflows/ai-check-fast.yml",
    ".claude/rules/test-rules.md",
    ".github/PULL_REQUEST_TEMPLATE.md",
    "worksheet/ai-code-understanding.md",
  ]) {
    assert.equal(paths.includes(expected), true, `missing managed file: ${expected}`);
  }
  assert.equal(paths.some((filePath) => filePath.startsWith("docs/ai-check-template/")), true);
});

test("getManagedFiles はオプション無効時に該当ファイルを含めない", () => {
  // INV-03: 列挙はオプション（ci / claudeHooks / reviewTemplates）に従う
  const paths = getManagedFiles({
    profile: "node-cli",
    ci: "none",
    claudeHooks: false,
    reviewTemplates: false,
  }).map((file) => managedFileStateKey(file.relativePath));

  assert.equal(paths.some((filePath) => filePath.startsWith(".github/workflows/")), false);
  assert.equal(paths.includes(".claude/rules/test-rules.md"), false);
  assert.equal(paths.includes(".github/PULL_REQUEST_TEMPLATE.md"), false);
});

test("getManagedFiles はいかなる profile / オプション組合せでも local overlay パスを含まない", () => {
  // SPEC-0057 AC-07 / FR-02 / INV-01: `ai-check.local.sh` と `.claude/rules/local/`
  // 配下は installer 不干渉の overlay 領域であり、managed 一覧に決して現れない
  // （リスク3 の回帰ガード。全 profile / オプション組合せを網羅する）
  const profiles = [
    "react-nextjs",
    "react-vanilla",
    "node-cli",
    "expo-rn",
    "react-nextjs+supabase-rls",
    "react-vanilla+supabase-rls",
    "node-cli+supabase-rls",
    "expo-rn+supabase-rls",
  ];
  const ciModes = ["none", "direct", "reusable"];

  for (const profile of profiles) {
    for (const ci of ciModes) {
      for (const claudeHooks of [false, true]) {
        for (const reviewTemplates of [false, true]) {
          const combo = `profile=${profile} ci=${ci} claudeHooks=${claudeHooks} reviewTemplates=${reviewTemplates}`;
          const paths = getManagedFiles({
            profile,
            packageManager: "pnpm",
            ci,
            claudeHooks,
            reviewTemplates,
          }).map((file) => managedFileStateKey(file.relativePath));

          // INV-01: ai-check.local.sh はどのディレクトリ配下でも managed にしない
          assert.equal(
            paths.some((filePath) => filePath.endsWith("ai-check.local.sh")),
            false,
            `ai-check.local.sh must not be managed (${combo})`,
          );
          // INV-01: .claude/rules/local/ 配下（README.md 含む）を managed にしない
          assert.equal(
            paths.some((filePath) => filePath.startsWith(".claude/rules/local/") || filePath === ".claude/rules/local"),
            false,
            `.claude/rules/local/* must not be managed (${combo})`,
          );
          // SPEC-0058 AC-08 / FR-08 / INV-01: `.ai-check.yaml` / `.ai-check.json` は
          // ユーザー所有・installer 非管理の config であり、いかなる profile /
          // オプション組合せでも managed 一覧に現れない（リスク4 の回帰ガード）
          assert.equal(
            paths.some((filePath) => filePath.endsWith(".ai-check.yaml") || filePath.endsWith(".ai-check.json")),
            false,
            `.ai-check.yaml / .ai-check.json must not be managed (${combo})`,
          );
        }
      }
    }
  }
});

test("各 managed ファイルの render は文字列内容を返す", async () => {
  // FR-02 の前提: 3-way 比較に使う upstream 内容がレンダリング可能であること
  for (const file of getManagedFiles({ profile: "react-nextjs", packageManager: "pnpm", ci: "direct" })) {
    const content = await file.render();
    assert.equal(typeof content, "string");
    assert.equal(content.length > 0, true, `empty render: ${file.relativePath}`);
  }
});

test("isManagedCiWorkflowContent は更新後 CI テンプレの 4 PM 変種を managed と判定する", async () => {
  // SPEC-0062 AC-05 / FR-06 / INV-03: SARIF/paths/matrix コメント雛形を追加した
  // 更新後テンプレでも、4 PM（pnpm/npm/yarn/bun）× 2 direct file の描画結果は
  // すべて managed と判定される（未改変利用者の auto-follow の前提）
  for (const fileName of DIRECT_CI_FILES) {
    for (const packageManager of PACKAGE_MANAGERS) {
      const content = await renderedCiWorkflow(fileName, packageManager);
      assert.equal(
        await isManagedCiWorkflowContent(fileName, content),
        true,
        `${fileName} (${packageManager}) が managed と判定されない`,
      );
    }
  }
});

test("collectManagedFileHashes は実内容の SHA-256 を記録し欠落ファイルは省略する", async (t) => {
  // INV-02: 各 hash は対応ファイルの実内容の SHA-256 と一致する
  // 異常系1 の前提: 存在しないファイルは managedFiles に記録されない
  const dir = createTempDir(t, "ai-check-template-managed-");
  const content = "#!/bin/sh\necho local\n";
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(dir, "scripts", "ai-check.sh"), content);

  const managedFiles = await collectManagedFileHashes(dir, {
    profile: "node-cli",
    ci: "none",
    claudeHooks: false,
    reviewTemplates: false,
  });

  assert.equal(
    managedFiles["scripts/ai-check.sh"].hash,
    `sha256:${createHash("sha256").update(content).digest("hex")}`,
  );
  assert.equal(Object.hasOwn(managedFiles, "scripts/ai-check-fast.sh"), false);
  for (const entry of Object.values(managedFiles)) {
    assert.match(entry.hash, /^sha256:[0-9a-f]{64}$/);
  }
});
