import { parseProfiles } from "./profile.mjs";
import { fromTemplates } from "./utils.mjs";

const TARGET_ROOT = "docs/ai-check-template";

const COMMON_DOC_FILES = [
  ["docs/test-design-template.md", `${TARGET_ROOT}/docs/test-design-template.md`],
  ["docs/ac-test-matrix.schema.json", `${TARGET_ROOT}/docs/ac-test-matrix.schema.json`],
  ["docs/ac-test-matrix.example.json", `${TARGET_ROOT}/docs/ac-test-matrix.example.json`],
  ["docs/ac-test-matrix.example.yaml", `${TARGET_ROOT}/docs/ac-test-matrix.example.yaml`],
  ["docs/philosophy/formal-name-match.md", `${TARGET_ROOT}/docs/philosophy/formal-name-match.md`],
  ["docs/philosophy/given-when-then.md", `${TARGET_ROOT}/docs/philosophy/given-when-then.md`],
  ["docs/philosophy/qa-techniques.md", `${TARGET_ROOT}/docs/philosophy/qa-techniques.md`],
  ["docs/philosophy/test-pyramid.md", `${TARGET_ROOT}/docs/philosophy/test-pyramid.md`],
  ["prompts/diagnostic-repair.md", `${TARGET_ROOT}/prompts/diagnostic-repair.md`],
  ["profiles/README.md", `${TARGET_ROOT}/profiles/README.md`],
];

export function getProfileDocFiles(input = "react-nextjs") {
  const profile = typeof input === "string" ? parseProfiles(input) : input;
  const files = [...COMMON_DOC_FILES];

  for (const profileName of [profile.base, ...(profile.addons ?? [])]) {
    files.push([
      `profiles/${profileName}/README.md`,
      `${TARGET_ROOT}/profiles/${profileName}/README.md`,
    ]);
  }

  return files.map(([sourceRelativePath, targetRelativePath]) => ({
    sourcePath: fromTemplates(...sourceRelativePath.split("/")),
    relativePath: targetRelativePath,
  }));
}
