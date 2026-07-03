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

test("各 managed ファイルの render は文字列内容を返す", async () => {
  // FR-02 の前提: 3-way 比較に使う upstream 内容がレンダリング可能であること
  for (const file of getManagedFiles({ profile: "react-nextjs", packageManager: "pnpm", ci: "direct" })) {
    const content = await file.render();
    assert.equal(typeof content, "string");
    assert.equal(content.length > 0, true, `empty render: ${file.relativePath}`);
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
