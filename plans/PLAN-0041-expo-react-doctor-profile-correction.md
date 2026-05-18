# PLAN-0041: Expo React Doctor profile correction

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0041 |
| SPEC-ID   | SPEC-0041 |
| ステータス | Completed |
| 作成日    | 2026-05-18 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller
- [ ] usecase
- [ ] domain
- [x] infrastructure
- [ ] frontend
- [x] infra
- [x] test
- [x] docs

## 影響範囲

- CLI profile scripts and profile diagnostics
- CLI tests for `expo-rn`
- README / README-ja / docs/cli / profile docs
- Makefile structural validation
- SAGE SPEC / PLAN / TASK status and scoring

## 実装方針

公式 React Doctor README の React Native 対応を根拠に、`expo-rn` profile の「React Doctor 非対応」表現を削除する。CLI では `expo-rn` の `ai:check` に `doctor` step を追加し、support script として `npx -y react-doctor@latest . --fail-on warning` を生成する。mobile E2E は引き続き Maestro / Detox とし、React Doctor は React / RN code quality diagnostics として位置付ける。

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0152 | expo-rn CLI profile and diagnostics correction | Implementation | 25m | none | Yes |
| TASK-0153 | README / profile / CLI docs and Makefile guard | Docs | 25m | TASK-0152 | No |
| TASK-0154 | CLI tests for expo React Doctor generation | Test | 20m | TASK-0152 | No |
| TASK-0155 | AC 検証、採点、SAGE status 更新、commit / PR | Verify | 25m | TASK-0152, TASK-0153, TASK-0154 | No |

## File Scope by Task

| TASK-ID | 変更許可ファイル |
|---|---|
| TASK-0152 | `src/cli/profile-scripts.mjs`, `src/cli/profile-diagnostics.mjs` |
| TASK-0153 | `README.md`, `README-ja.md`, `docs/cli.md`, `package-templates/profiles/README.md`, `package-templates/profiles/expo-rn/README.md`, `Makefile` |
| TASK-0154 | `tests/cli/init.test.mjs`, `tests/cli/doctor.test.mjs` |
| TASK-0155 | `specs/SPEC-0041-expo-react-doctor-profile-correction.md`, `plans/PLAN-0041-expo-react-doctor-profile-correction.md`, `tasks/TASK-0152-expo-react-doctor-cli.md`, `tasks/TASK-0153-expo-react-doctor-docs.md`, `tasks/TASK-0154-expo-react-doctor-tests.md`, `tasks/TASK-0155-verify-expo-react-doctor-correction.md` |

## 必要な検証

- [x] grep: `expo-rn` profile generated script includes `doctor`
- [x] grep: docs mention React Doctor support for React Native / Expo
- [x] CLI tests: `node --test tests/cli/*.test.mjs`
- [x] validation: `make validate`
- [x] SAGE validation: `bash scripts/sage-validate.sh`
- [x] security scan: secret / private URL grep
- [x] architecture boundary check: File Scope / protected file check

## リスク

- リスク1: React Doctor support wording becomes overconfident → cite official support and keep config tuning caveat
- リスク2: E2E guidance gets confused with code diagnostics → keep Maestro / Detox wording unchanged
- リスク3: Existing Expo users see new profile drift → `update --yes` can migrate managed scripts

## 採点

- SPEC-0041: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）
- PLAN-0041: 100/S++（6軸: Codified Rules 20 / Atomic Decomposition 20 / Spec-Driven 20 / Observable 20 / Knowledge 15 / Gradual Adoption 5）
