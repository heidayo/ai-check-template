import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { ciWorkflowFiles, ciWorkflowRelativePath, renderedCiWorkflow } from "./ci-workflows.mjs";
import { getProfileDocFiles } from "./profile-docs.mjs";
import { fromTemplates, pathExists } from "./utils.mjs";

// Single source of truth for template-managed files (SPEC-0056 INV-03).
// init / update / doctor must import the listing from this module and must
// not hardcode managed file paths themselves.

const SCRIPT_FILES = ["ai-check.sh", "ai-check-fast.sh", "ai-check-secure.sh"];

export function hashContent(content) {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

export function managedFileStateKey(relativePath) {
  return relativePath.split(path.sep).join("/");
}

export function getManagedFiles({
  profile = "react-nextjs",
  packageManager,
  ci = "direct",
  claudeHooks = false,
  reviewTemplates = false,
} = {}) {
  const files = [];

  for (const fileName of SCRIPT_FILES) {
    files.push(staticManagedFile("script", fromTemplates("scripts", fileName), path.join("scripts", fileName)));
  }

  for (const file of getProfileDocFiles(profile)) {
    files.push(staticManagedFile("profile-doc", file.sourcePath, file.relativePath, "profile doc"));
  }

  for (const fileName of ciWorkflowFiles(ci)) {
    files.push({
      kind: "ci-workflow",
      relativePath: ciWorkflowRelativePath(fileName),
      render: () => renderedCiWorkflow(fileName, packageManager),
    });
  }

  if (claudeHooks) {
    files.push(
      staticManagedFile(
        "claude-rule",
        fromTemplates(".claude", "rules", "test-rules.md"),
        path.join(".claude", "rules", "test-rules.md"),
      ),
    );
  }

  if (reviewTemplates) {
    files.push(
      staticManagedFile(
        "review-template",
        fromTemplates(".github", "PULL_REQUEST_TEMPLATE.md"),
        path.join(".github", "PULL_REQUEST_TEMPLATE.md"),
        "review PR template",
      ),
    );
    files.push(
      staticManagedFile(
        "review-template",
        fromTemplates("worksheet", "ai-code-understanding.md"),
        path.join("worksheet", "ai-code-understanding.md"),
        "review worksheet",
      ),
    );
  }

  return files;
}

export async function collectManagedFileHashes(targetDir, options) {
  const managedFiles = {};

  for (const file of getManagedFiles(options)) {
    const targetPath = path.join(targetDir, file.relativePath);

    if (!(await pathExists(targetPath))) {
      continue;
    }

    managedFiles[managedFileStateKey(file.relativePath)] = {
      hash: hashContent(await fs.readFile(targetPath, "utf8")),
    };
  }

  return managedFiles;
}

function staticManagedFile(kind, sourcePath, relativePath, detail = undefined) {
  return {
    kind,
    relativePath,
    sourcePath,
    ...(detail ? { detail } : {}),
    render: () => fs.readFile(sourcePath, "utf8"),
  };
}
