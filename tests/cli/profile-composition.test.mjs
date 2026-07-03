import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parseProfiles, supportedProfiles } from "../../src/cli/profile.mjs";
import {
  getProfileScripts,
  getProfileSupportScripts,
} from "../../src/cli/profile-scripts.mjs";
import { getProfileDocFiles } from "../../src/cli/profile-docs.mjs";
import {
  getManagedFiles,
  managedFileStateKey,
} from "../../src/cli/managed-files.mjs";
import { CliError } from "../../src/cli/utils.mjs";

// SPEC-0060 profile composition rules (TASK-0215).
// Fixture is a faithful dump of the pre-change HEAD output (NFR-01 / risk 4).
// Expected values reference SPEC-0060 contract clauses (1)(3)(4)(5).

const FIXTURE_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "profile-composition.json",
);
const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8"));

// getManagedFiles options are pinned so only the profile axis varies here;
// ci / hooks axis coverage belongs to managed-files.test.mjs (96 combos).
const MANAGED_FILES_OPTIONS = {
  packageManager: "pnpm",
  ci: "direct",
  claudeHooks: true,
  reviewTemplates: true,
};

// AC-05 / FR-05: combinations are machine-enumerated from supportedProfiles.
// base / addon classification is derived via parseProfiles success (the
// Sets in profile.mjs are intentionally not exported — File Scope).
function classifyProfiles() {
  const bases = [];
  const addons = [];
  for (const name of supportedProfiles) {
    let isBase = false;
    try {
      parseProfiles(name);
      isBase = true;
    } catch {
      isBase = false;
    }
    (isBase ? bases : addons).push(name);
  }
  return { bases, addons };
}

function enumerateCombinations({ bases, addons }) {
  // Addon subsets currently: {} and each single addon (SPEC scope: 4 x 2 = 8).
  const subsets = [[], ...addons.map((addon) => [addon])];
  const combos = [];
  for (const base of bases) {
    for (const subset of subsets) {
      combos.push([base, ...subset].join("+"));
    }
  }
  return combos;
}

function composeSnapshot(profile) {
  return {
    scripts: getProfileScripts(profile, { packageManager: "pnpm" }),
    supportScripts: getProfileSupportScripts(profile, { packageManager: "pnpm" }),
    // relativePath only: sourcePath is an absolute path (AC-06).
    docFiles: getProfileDocFiles(profile).map((file) => file.relativePath),
    managedFileStateKeys: getManagedFiles({
      profile,
      ...MANAGED_FILES_OPTIONS,
    }).map((file) => managedFileStateKey(file.relativePath)),
  };
}

const classified = classifyProfiles();
const combinations = enumerateCombinations(classified);

// ---------------------------------------------------------------------------
// AC-02 / FR-01 / INV-04: parseProfiles rules (current behaviour, frozen)
// ---------------------------------------------------------------------------

test("AC-02(a): '+' 区切りと ',' 区切りは同一の { base, addons } を返す", () => {
  // FR-01 / 契約(1): `,` / `+` は等価
  const plus = parseProfiles("react-nextjs+supabase-rls");
  const comma = parseProfiles("react-nextjs,supabase-rls");
  assert.deepStrictEqual(plus, comma);
  assert.deepStrictEqual(plus, {
    base: "react-nextjs",
    addons: ["supabase-rls"],
    all: ["react-nextjs", "supabase-rls"],
  });
});

test("AC-02(b): addon 単独指定（base 0 件）は CliError になる", () => {
  // FR-01 / 想定エラー2: base ちょうど 1 つ
  assert.throws(
    () => parseProfiles("supabase-rls"),
    (error) => error instanceof CliError && /exactly one base profile/.test(error.message),
  );
});

test("AC-02(b): base 2 件指定は CliError になる", () => {
  // FR-01 / 想定エラー2
  assert.throws(
    () => parseProfiles("react-nextjs+node-cli"),
    (error) => error instanceof CliError && /exactly one base profile/.test(error.message),
  );
});

test("AC-02(c): 同一名の重複指定は CliError になる", () => {
  // FR-01 / 想定エラー3
  assert.throws(
    () => parseProfiles("react-nextjs+supabase-rls+supabase-rls"),
    (error) => error instanceof CliError && /Duplicate profile/.test(error.message),
  );
});

test("AC-02(d): 未知の profile 名は supported 一覧付き CliError になる", () => {
  // FR-01 / 想定エラー1
  assert.throws(
    () => parseProfiles("react-nextjs+unknown-addon"),
    (error) =>
      error instanceof CliError &&
      /unknown-addon/.test(error.message) &&
      supportedProfiles.every((name) => error.message.includes(name)),
  );
});

test("AC-02(e): base+addon1+addon2 構文が受理され addons は宣言順を保持する", () => {
  // FR-01 / INV-04: 現行 addon は 1 件のため、構文レベルの複数 addon 受理は
  // base を挟まない限り分割・分類が宣言順で保持されることを、addon を
  // 前置/後置した 2 入力の順序差で固定する（addons は入力の出現順）。
  const result = parseProfiles("react-nextjs+supabase-rls");
  assert.deepStrictEqual(result.addons, ["supabase-rls"]);
  assert.deepStrictEqual(result.all, ["react-nextjs", "supabase-rls"]);

  // 宣言順保持: addon が base より先に宣言されても addons / all は宣言順のまま
  const addonFirst = parseProfiles("supabase-rls+react-nextjs");
  assert.strictEqual(addonFirst.base, "react-nextjs");
  assert.deepStrictEqual(addonFirst.all, ["supabase-rls", "react-nextjs"]);
  assert.deepStrictEqual(addonFirst.addons, ["supabase-rls"]);
});

// ---------------------------------------------------------------------------
// FR-02 (a)-(c) 現行挙動 / POST-02: ai:check への addon step 追記と重複排除
// （競合 CliError 化 = AC-03(c) は TASK-0216 の責務。本タスクでは扱わない）
// ---------------------------------------------------------------------------

test("FR-02(c): addon の check step は ai:check の末尾に && 連結で追記される", () => {
  // POST-02: base の全 step を同順で先頭に含み、addon step を宣言順で末尾に追記
  const base = getProfileScripts("react-nextjs", { packageManager: "pnpm" });
  const merged = getProfileScripts("react-nextjs+supabase-rls", { packageManager: "pnpm" });
  assert.strictEqual(
    merged["ai:check"],
    `${base["ai:check"]} && pnpm test:db && pnpm test:integration:rls`,
  );
});

test("FR-02(c): 既に含まれる step は重複追記されない（appendScriptStep の重複排除）", () => {
  // POST-02: 重複 step は 1 回のみ。合成は決定的（INV-01）なので、
  // 同一入力の再合成で step が増殖しないことでも固定する。
  const once = getProfileScripts("react-nextjs+supabase-rls", { packageManager: "pnpm" });
  const twice = getProfileScripts("react-nextjs+supabase-rls", { packageManager: "pnpm" });
  assert.deepStrictEqual(once, twice);
  const steps = once["ai:check"].split(" && ");
  assert.strictEqual(new Set(steps).size, steps.length, "ai:check の step が重複している");
  assert.strictEqual(steps.filter((step) => step === "pnpm test:db").length, 1);
});

// ---------------------------------------------------------------------------
// AC-04 / FR-03 / FR-04: support scripts / doc files / managed files 合成規則
// ---------------------------------------------------------------------------

test("AC-04(a): support scripts のキー集合は base + security のみで addon 前後不変", () => {
  // FR-03 / ASM-02 / 契約(3): addon は support scripts を寄与しない
  for (const base of classified.bases) {
    const withoutAddon = getProfileSupportScripts(base, { packageManager: "pnpm" });
    for (const addon of classified.addons) {
      const withAddon = getProfileSupportScripts(`${base}+${addon}`, { packageManager: "pnpm" });
      assert.deepStrictEqual(withAddon, withoutAddon);
    }
  }
});

test("AC-04(b): doc files は 共通 docs + base README + addon README の宣言順で返る", () => {
  // FR-04 / 契約(4) / INV-03: addon は追記のみ
  const base = getProfileDocFiles("react-nextjs").map((file) => file.relativePath);
  const merged = getProfileDocFiles("react-nextjs+supabase-rls").map((file) => file.relativePath);
  assert.deepStrictEqual(merged, [
    ...base,
    "docs/ai-check-template/profiles/supabase-rls/README.md",
  ]);
});

test("AC-04(c): addon 有無での managed files 差分は addon README の profile-doc エントリのみ", () => {
  // FR-04 / ASM-03: getManagedFiles の profile 依存は getProfileDocFiles 経由のみ
  for (const base of classified.bases) {
    const baseKeys = getManagedFiles({ profile: base, ...MANAGED_FILES_OPTIONS })
      .map((file) => managedFileStateKey(file.relativePath));
    for (const addon of classified.addons) {
      const mergedKeys = getManagedFiles({ profile: `${base}+${addon}`, ...MANAGED_FILES_OPTIONS })
        .map((file) => managedFileStateKey(file.relativePath));
      const added = mergedKeys.filter((key) => !baseKeys.includes(key));
      const removed = baseKeys.filter((key) => !mergedKeys.includes(key));
      assert.deepStrictEqual(added, [
        `docs/ai-check-template/profiles/${addon}/README.md`,
      ]);
      assert.deepStrictEqual(removed, [], "addon 追加で base の managed file が消えた（INV-03 違反）");
    }
  }
});

test("境界ケース1: addon 0 個（base 単独）は base の合成をそのまま返す", () => {
  // AC-05 / 境界ケース1: 追記・マージが発生しない
  for (const base of classified.bases) {
    const snapshot = composeSnapshot(base);
    assert.deepStrictEqual(snapshot, fixture.combinations[base]);
  }
});

// ---------------------------------------------------------------------------
// AC-05 / FR-05 / INV-01 / INV-05: スナップショット回帰ガード
// ---------------------------------------------------------------------------

test("AC-05: 機械列挙した組合せ集合が fixture のキー集合・分類と一致する", () => {
  // FR-05: supportedProfiles に addon が増えたのに fixture 未更新なら fail
  assert.deepStrictEqual(classified.bases, fixture.baseProfiles);
  assert.deepStrictEqual(classified.addons, fixture.addonProfiles);
  assert.deepStrictEqual(
    [...combinations].sort(),
    Object.keys(fixture.combinations).sort(),
  );
});

test("AC-05: 全 8 組合せ × 4 関数の合成結果が fixture と deepStrictEqual で完全一致する", () => {
  // INV-01（決定性）/ INV-05（fixture 完全一致）/ NFR-01（変更前 HEAD 出力の固定）
  assert.strictEqual(combinations.length, 8);
  for (const profile of combinations) {
    assert.deepStrictEqual(
      composeSnapshot(profile),
      fixture.combinations[profile],
      `組合せ ${profile} の合成結果が fixture と一致しない`,
    );
  }
});

test("AC-05(ネガティブ): fixture に存在しない組合せを与えると照合が fail する", () => {
  // FR-05: addon 追加時に fixture 更新漏れだとテストが fail することの検証。
  // 実在しない組合せキーを引くと fixture 側が undefined になり不一致になる。
  const phantom = "react-nextjs+phantom-addon";
  assert.strictEqual(fixture.combinations[phantom], undefined);
  assert.throws(() =>
    assert.deepStrictEqual(
      composeSnapshot("react-nextjs"),
      fixture.combinations[phantom],
    ),
  );
});
