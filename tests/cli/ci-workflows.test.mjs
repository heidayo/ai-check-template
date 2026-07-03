import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  DIRECT_CI_FILES,
  isManagedCiWorkflowContent,
  renderedCiWorkflow,
} from "../../src/cli/ci-workflows.mjs";

// SPEC-0062 unit tests for the CI workflow templates（monorepo paths/matrix + Semgrep SARIF opt-in）。
// 期待値は SPEC-0062 の契約節・AC-01〜AC-04 / FR-01〜FR-06 / INV-02 / INV-03 / NFR-03 / NFR-04
// から導出する（AP-07 対策）。実装内部を読んで期待値を作らない。
//
// 観測面（NFR-05）: CI テンプレは配布物であり GitHub Actions runner では回さない。
// observable なのは「テンプレ YAML の内容」なので、テストは静的検証
// （YAML パース可能性 + 要素存在の grep + PM 別描画の active 構造不変）に限る。

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn", "bun"];

const CI_SOURCE_DIR = path.join(
  repoRoot,
  "package-templates",
  "ci-examples",
  "github-actions",
);

function readCiSource(fileName) {
  return fs.readFileSync(path.join(CI_SOURCE_DIR, fileName), "utf8");
}

// Makefile validate-yaml と同じ手段（ruby -ryaml）で YAML をパースする。
// 外部 npm 依存を増やさない（NFR-02 / NFR-03）。ruby 不在環境では
// validate-yaml と同様に SKIPPED 扱いにし、パース以外の静的検証は継続する。
let rubyAvailable = null;
function hasRuby() {
  if (rubyAvailable === null) {
    rubyAvailable = spawnSync("ruby", ["--version"], { encoding: "utf8" }).status === 0;
  }
  return rubyAvailable;
}

// ruby で YAML.load_file し、active な on: / jobs: 構造を JSON で書き出す。
// パース失敗（status != 0）は呼び出し側で assert する。
function rubyLoadYaml(t, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-check-template-yaml-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const yamlPath = path.join(dir, "workflow.yml");
  fs.writeFileSync(yamlPath, content);
  // on: は YAML 1.1 で boolean true にパースされうる（GitHub Actions の既知挙動）。
  // ここでは「パース可能であること」と jobs 構造の active 部分だけを検証するため、
  // トップレベルは keys の存在のみ、jobs は job 名 / step の run/uses を取り出す。
  const script = `
require "yaml"
require "json"
doc = YAML.load_file(ARGV[0])
job_name = doc["jobs"].keys.first
steps = doc["jobs"][job_name]["steps"]
runs = steps.map { |s| s["run"] }.compact
uses = steps.map { |s| s["uses"] }.compact
print JSON.generate({
  "topKeys" => doc.keys.map(&:to_s).sort,
  "jobNames" => doc["jobs"].keys,
  "permissions" => doc["permissions"],
  "stepCount" => steps.length,
  "runs" => runs,
  "uses" => uses,
})
`;
  const result = spawnSync("ruby", ["-e", script, yamlPath], { encoding: "utf8" });
  return result;
}

// 本 SPEC 適用後の active job 構造（追加はコメントのみ = PRE-01 / INV-01）。
// PM 別に install / check の run コマンドが決まる。ここを固定することで
// 「コメント追加が active 構造を変えていない」ことを機械検証する（AC-01）。
const EXPECTED_ACTIVE = {
  "ai-check.yml": {
    jobName: "ai-check",
    pnpm: ["pnpm install --frozen-lockfile", "pnpm ai:check"],
    npm: ["npm ci", "npm run ai:check"],
    yarn: ["corepack enable", "yarn install --immutable", "yarn ai:check"],
    bun: ["bun install --frozen-lockfile", "bun run ai:check"],
  },
  "ai-check-fast.yml": {
    jobName: "ai-check-fast",
    pnpm: ["pnpm install --frozen-lockfile", "pnpm ai:check:fast"],
    npm: ["npm ci", "npm run ai:check:fast"],
    yarn: ["corepack enable", "yarn install --immutable", "yarn ai:check:fast"],
    bun: ["bun install --frozen-lockfile", "bun run ai:check:fast"],
  },
};

// --- AC-01: YAML 妥当性 + PM 別描画の active 構造不変 -------------------------

test("AC-01: 2 direct file の source が YAML としてパース可能である", (t) => {
  // NFR-03 / INV-03: 追加したコメント雛形（SARIF / paths / matrix）を含む
  // source テンプレがコメント状態のまま YAML パーサで妥当である
  if (!hasRuby()) {
    t.skip("ruby not found (validate-yaml と同じく SKIPPED)");
    return;
  }
  for (const fileName of DIRECT_CI_FILES) {
    const result = rubyLoadYaml(t, readCiSource(fileName));
    assert.equal(result.status, 0, `${fileName} failed to parse: ${result.stderr}`);
  }
});

test("AC-01: renderedCiWorkflow の 4 PM × 2 file 全変種が YAML としてパース可能である", async (t) => {
  // NFR-03 / INV-03 / FR-05: 4 PM 別描画（PM 置換適用後）でも YAML 妥当。
  // コメント例に PM 別置換対象文字列を置いていないため誤置換で壊れない（異常系3）
  if (!hasRuby()) {
    t.skip("ruby not found (validate-yaml と同じく SKIPPED)");
    return;
  }
  for (const fileName of DIRECT_CI_FILES) {
    for (const packageManager of PACKAGE_MANAGERS) {
      const content = await renderedCiWorkflow(fileName, packageManager);
      const result = rubyLoadYaml(t, content);
      assert.equal(
        result.status,
        0,
        `${fileName} (${packageManager}) failed to parse: ${result.stderr}`,
      );
    }
  }
});

test("AC-01: 4 PM × 2 file の active な job 構造（job 名・step 実行コマンド）が本 SPEC 期待値と一致する", async (t) => {
  // AC-01 / NFR-01 / PRE-01 / INV-01: 追加はコメント雛形のみで active 挙動は不変。
  // active な on: トリガー / job 名 / 実行コマンド列を PM 別に固定する
  if (!hasRuby()) {
    t.skip("ruby not found (validate-yaml と同じく SKIPPED)");
    return;
  }
  for (const fileName of DIRECT_CI_FILES) {
    const expected = EXPECTED_ACTIVE[fileName];
    for (const packageManager of PACKAGE_MANAGERS) {
      const content = await renderedCiWorkflow(fileName, packageManager);
      const result = rubyLoadYaml(t, content);
      assert.equal(result.status, 0, `${fileName} (${packageManager}): ${result.stderr}`);
      const parsed = JSON.parse(result.stdout);
      // active な単一 job 構成が保たれる（matrix 例はコメントなので job は 1 つ）
      assert.deepEqual(
        parsed.jobNames,
        [expected.jobName],
        `${fileName} (${packageManager}) job names`,
      );
      // active な permission は contents: read のまま（SARIF は opt-in コメント = SEC-01 / INV-04）
      assert.deepEqual(
        parsed.permissions,
        { contents: "read" },
        `${fileName} (${packageManager}) active permissions must stay contents: read`,
      );
      // active な実行コマンド列が PM 別期待値と一致（コメント雛形は run に現れない）
      assert.deepEqual(
        parsed.runs,
        expected[packageManager],
        `${fileName} (${packageManager}) active run commands`,
      );
    }
  }
});

// --- AC-02: SARIF opt-in 3 要素の存在（full）/ 不在（fast）------------------

test("AC-02: ai-check.yml に SARIF opt-in の 3 要素が 4 PM 描画いずれでも存在する", async () => {
  // FR-01 / NFR-04: (a) semgrep scan --sarif / (b) upload-sarif / (c) security-events: write
  // の 3 要素が存在する（既定コメント状態のためコメント行ヒットで可）。
  // PM 別置換後も要素が残ることを 4 PM で確認する（FR-05: コメントは置換対象外）
  for (const packageManager of PACKAGE_MANAGERS) {
    const content = await renderedCiWorkflow("ai-check.yml", packageManager);
    assert.match(content, /semgrep scan --sarif/, `(a) scan step missing (${packageManager})`);
    assert.match(
      content,
      /github\/codeql-action\/upload-sarif/,
      `(b) upload-sarif step missing (${packageManager})`,
    );
    assert.match(
      content,
      /security-events: write/,
      `(c) security-events: write permission missing (${packageManager})`,
    );
  }
});

test("AC-02: ai-check-fast.yml には SARIF 要素が 4 PM 描画いずれでも存在しない", async () => {
  // FR-01 / 境界ケース1: fast の軽量性を保つため SARIF を追加しない。
  // sarif / upload-sarif / security-events: write のいずれもヒットしない
  for (const packageManager of PACKAGE_MANAGERS) {
    const content = await renderedCiWorkflow("ai-check-fast.yml", packageManager);
    assert.doesNotMatch(content, /sarif/i, `SARIF must be absent in fast (${packageManager})`);
    assert.doesNotMatch(
      content,
      /security-events: write/,
      `security-events must be absent in fast (${packageManager})`,
    );
  }
});

// --- AC-03: security:sast = semgrep scan --config auto の無変更 --------------

test("AC-03: package.scripts.fragment.json と profile-scripts.mjs の security:sast が無変更である", () => {
  // FR-02 / INV-02 / SPEC-0051 FR-02: SARIF 経路は CI テンプレ側の別ステップで、
  // package script（security:sast = semgrep scan --config auto）を変えない。
  // 両ファイルに当該行が存在し続けることを検証する（TASK-0224 補記: 両方実在）
  const fragmentPath = path.join(
    repoRoot,
    "package-templates",
    "package.scripts.fragment.json",
  );
  const fragment = JSON.parse(fs.readFileSync(fragmentPath, "utf8"));
  assert.equal(
    fragment.scripts["security:sast"],
    "semgrep scan --config auto",
    "fragment.json の security:sast が変更されている",
  );

  const profileScriptsSource = fs.readFileSync(
    path.join(repoRoot, "src", "cli", "profile-scripts.mjs"),
    "utf8",
  );
  assert.match(
    profileScriptsSource,
    /"security:sast":\s*"semgrep scan --config auto"/,
    "profile-scripts.mjs の security:sast が変更されている",
  );
});

// --- AC-04: paths filter 例 / matrix 例 / OPS-02 案内の存在 ------------------

test("AC-04: ai-check.yml / ai-check-fast.yml に paths filter 例と workspace glob 例が存在する", async () => {
  // FR-03 / NFR-04: 変更パッケージのみで起動する paths filter のコメント雛形と、
  // SPEC-0061 の workspace 対象ディレクトリ（例: packages/app/**）の glob 例が両ファイルに存在する
  for (const fileName of DIRECT_CI_FILES) {
    const content = await renderedCiWorkflow(fileName, "pnpm");
    assert.match(content, /paths:/, `${fileName} に paths filter 例がない`);
    assert.match(
      content,
      /packages\/app\/\*\*/,
      `${fileName} に workspace ディレクトリ glob 例がない`,
    );
  }
});

test("AC-04: paths filter で全スキップ時に required check が pending にならない工夫の案内が存在する", async () => {
  // FR-03 / OPS-02 / 異常系2: 全 job スキップで required status check が never-run の
  // pending になる問題への案内（fallback job 等）が両ファイルに存在する
  for (const fileName of DIRECT_CI_FILES) {
    const content = await renderedCiWorkflow(fileName, "pnpm");
    assert.match(content, /required/, `${fileName} に required check 案内がない`);
    assert.match(content, /pending/, `${fileName} に pending 問題の言及がない`);
  }
});

test("AC-04: ai-check.yml に matrix 例が存在し ai-check-fast.yml には存在しない", async () => {
  // FR-04 / 境界ケース1: matrix 例（strategy: / matrix:）は full 側のみ。
  // fast の軽量性を保つため fast には matrix を置かない
  const full = await renderedCiWorkflow("ai-check.yml", "pnpm");
  assert.match(full, /strategy:/, "ai-check.yml に strategy: 例がない");
  assert.match(full, /matrix:/, "ai-check.yml に matrix: 例がない");

  const fast = await renderedCiWorkflow("ai-check-fast.yml", "pnpm");
  assert.doesNotMatch(fast, /strategy:/, "ai-check-fast.yml に matrix を置かない");
});

// --- FR-05: PM 別置換との非干渉（コメントに置換対象文字列を置かない）--------

test("FR-05: コメント雛形が pnpm 以外の描画で pnpm 固有の置換対象文字列を残さない", async () => {
  // FR-05 / 異常系3: renderDirectWorkflow は PNPM_SETUP_BLOCK と `pnpm ai:check` を置換する。
  // コメント例にこれらを含めていないため、npm/yarn/bun 描画では `pnpm ai:check` が
  // 残らない（active コマンドも置換される）。誤置換の回帰ガード
  for (const fileName of DIRECT_CI_FILES) {
    for (const packageManager of ["npm", "yarn", "bun"]) {
      const content = await renderedCiWorkflow(fileName, packageManager);
      assert.doesNotMatch(
        content,
        /pnpm ai:check/,
        `${fileName} (${packageManager}) に pnpm ai:check が残存（置換漏れ or コメントに混入）`,
      );
    }
  }
});

// --- AC-05: isManagedCiWorkflowContent が更新後 4 変種を managed と判定する ----

test("AC-05: isManagedCiWorkflowContent が更新後テンプレの 4 PM 変種を managed と判定する", async () => {
  // FR-06 / INV-03 / POST-01: テンプレ変更後も 4 PM 変種は managed 判定され、
  // 未改変利用者の update は local == baseline 経路で auto-follow できる
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

test("AC-05: 未知内容（利用者改変）は managed と判定されない", async () => {
  // FR-06 / INV-03: 4 PM 変種以外の内容は managed でない（改変済み判定の前提）
  assert.equal(await isManagedCiWorkflowContent("ai-check.yml", "name: custom\n"), false);
});
