import { parseProfiles } from "./profile.mjs";
import { DEFAULT_PACKAGE_MANAGER, scriptCommand, workspaceScriptCommand } from "./package-manager.mjs";
import { CliError } from "./utils.mjs";

const SECURITY_CHECK_STEPS = [
  "security:secrets",
  "security:deps",
  "security:supply-chain",
  "security:sast",
];

const BASE_PROFILE_SCRIPTS = {
  "react-nextjs": {
    "ai:check": "pnpm typecheck && pnpm lint && pnpm doctor && pnpm deadcode && pnpm test && pnpm test:e2e:smoke",
    "ai:check:fast": "pnpm typecheck && pnpm lint && pnpm test:unit",
    "ai:check:secure": securityCheckScript("pnpm"),
    doctor: "npx -y react-doctor@latest . --fail-on warning",
    deadcode: "knip",
  },
  "react-vanilla": {
    "ai:check": "pnpm typecheck && pnpm lint && pnpm deadcode && pnpm test",
    "ai:check:fast": "pnpm typecheck && pnpm lint && pnpm test:unit",
    "ai:check:secure": securityCheckScript("pnpm"),
    deadcode: "knip",
  },
  "expo-rn": {
    "ai:check": "pnpm typecheck && pnpm lint && pnpm doctor && pnpm deadcode && pnpm test && pnpm test:e2e:smoke",
    "ai:check:fast": "pnpm typecheck && pnpm lint && pnpm test:unit",
    "ai:check:secure": securityCheckScript("pnpm"),
    doctor: "npx -y react-doctor@latest . --fail-on warning",
    deadcode: "knip",
    "test:e2e:smoke": "maestro test .maestro/smoke.yaml",
  },
  "node-cli": {
    "ai:check": "pnpm typecheck && pnpm lint && pnpm deadcode && pnpm test",
    "ai:check:fast": "pnpm typecheck && pnpm lint && pnpm test:unit",
    "ai:check:secure": securityCheckScript("pnpm"),
    deadcode: "knip",
  },
};

const ADDON_PROFILE_SCRIPTS = {
  "supabase-rls": {
    "test:db": "supabase test db",
    "test:integration:rls": "vitest run --dir tests/rls",
  },
};

const ADDON_CHECK_STEPS = {
  "supabase-rls": ["test:db", "test:integration:rls"],
};

const COMMON_SUPPORT_SCRIPTS = {
  typecheck: "tsc --noEmit",
  lint: "eslint .",
  test: "vitest run",
  "test:unit": "vitest run --dir tests/unit",
};

const COMMON_SECURITY_SUPPORT_SCRIPTS = {
  "security:secrets": "npx -y @secretlint/quick-start \"**/*\"",
  "security:sast": "semgrep scan --config auto",
};

const BASE_PROFILE_SUPPORT_SCRIPTS = {
  "react-nextjs": {
    ...COMMON_SUPPORT_SCRIPTS,
    "test:e2e:smoke": "playwright test --grep smoke",
  },
  "react-vanilla": COMMON_SUPPORT_SCRIPTS,
  "expo-rn": COMMON_SUPPORT_SCRIPTS,
  "node-cli": COMMON_SUPPORT_SCRIPTS,
};

// Gate scripts live in the workspace root package.json in workspace mode;
// everything else goes to the target package (SPEC-0061 FR-04). This is the
// single definition of the gate/step split shared by init / update / doctor.
export const GATE_SCRIPT_NAMES = ["ai:check", "ai:check:fast", "ai:check:secure"];

export function splitGateScripts(scripts) {
  const gate = {};
  const step = {};

  for (const [name, command] of Object.entries(scripts)) {
    (GATE_SCRIPT_NAMES.includes(name) ? gate : step)[name] = command;
  }

  return { gate, step };
}

export function getProfileScripts(input = "react-nextjs", options = {}) {
  const profile = typeof input === "string" ? parseProfiles(input) : input;
  const packageManager = options.packageManager ?? DEFAULT_PACKAGE_MANAGER;
  const workspace = options.workspace ?? null;
  const scripts = { ...BASE_PROFILE_SCRIPTS[profile.base] };

  for (const addon of profile.addons) {
    mergeAddonScripts(scripts, ADDON_PROFILE_SCRIPTS[addon] ?? {}, { base: profile.base, addon });
    for (const step of ADDON_CHECK_STEPS[addon] ?? []) {
      // In workspace mode addon steps stay in the canonical `pnpm <step>` form
      // so the gate renderer below builds every step from its name in one pass
      // (SPEC-0061 FR-03: no double regex substitution).
      scripts["ai:check"] = appendScriptStep(
        scripts["ai:check"],
        workspace ? scriptCommand(DEFAULT_PACKAGE_MANAGER, step) : scriptCommand(packageManager, step),
      );
    }
  }

  if (!workspace) {
    return renderPackageManagerScripts(scripts, packageManager);
  }

  // Workspace rendering changes only the gate step invocations; the step set,
  // order, and every non-gate script are identical to single-package mode
  // (SPEC-0061 INV-03 — the SPEC-0060 composition contract is preserved).
  return Object.fromEntries(
    Object.entries(scripts).map(([name, command]) => [
      name,
      GATE_SCRIPT_NAMES.includes(name)
        ? renderWorkspaceGateScript(command, packageManager, workspace)
        : renderScriptCommand(command, packageManager),
    ]),
  );
}

// Rebuilds each `pnpm <step>` part of a gate script directly via
// workspaceScriptCommand instead of layering regex substitutions (FR-03).
function renderWorkspaceGateScript(command, packageManager, workspace) {
  return command
    .split(" && ")
    .map((part) => {
      const match = /^pnpm ([a-zA-Z0-9:_-]+)$/.exec(part.trim());
      if (!match) {
        throw new CliError(`Gate script step is not in canonical form: ${part.trim()}`);
      }
      return workspaceScriptCommand(packageManager, workspace, match[1]);
    })
    .join(" && ");
}

export function getProfileSupportScripts(input = "react-nextjs", options = {}) {
  const profile = typeof input === "string" ? parseProfiles(input) : input;
  const packageManager = options.packageManager ?? DEFAULT_PACKAGE_MANAGER;
  return renderPackageManagerScripts({
    ...BASE_PROFILE_SUPPORT_SCRIPTS[profile.base],
    ...getSecuritySupportScripts(packageManager),
  }, packageManager);
}

function getSecuritySupportScripts(packageManager) {
  return {
    ...COMMON_SECURITY_SUPPORT_SCRIPTS,
    "security:deps": dependencyAuditCommand(packageManager),
    "security:supply-chain": supplyChainCommand(packageManager),
  };
}

function securityCheckScript(packageManager) {
  return SECURITY_CHECK_STEPS.map((step) => scriptCommand(packageManager, step)).join(" && ");
}

// Exported for direct table-injection tests (SPEC-0060 FR-02 (d) / AC-03 (c));
// the public CLI surface is unchanged. Conflicts fail fast instead of being
// silently overwritten, so partially merged scripts never reach callers.
export function mergeAddonScripts(scripts, addonScripts, { base, addon }) {
  for (const key of Object.keys(addonScripts)) {
    if (Object.hasOwn(scripts, key)) {
      throw new CliError(
        `Script key conflict: "${key}" from addon profile "${addon}" already exists in base profile "${base}" or a preceding addon.`,
      );
    }
    scripts[key] = addonScripts[key];
  }
  return scripts;
}

function appendScriptStep(command, step) {
  const parts = command.split(" && ").map((part) => part.trim());
  if (parts.includes(step)) {
    return command;
  }

  return [...parts, step].join(" && ");
}

function renderPackageManagerScripts(scripts, packageManager) {
  return Object.fromEntries(
    Object.entries(scripts).map(([name, command]) => [name, renderScriptCommand(command, packageManager)]),
  );
}

function dependencyAuditCommand(packageManager) {
  if (packageManager === "npm") {
    return "npm audit --audit-level high";
  }

  if (packageManager === "yarn") {
    return "yarn npm audit --severity high";
  }

  if (packageManager === "bun") {
    return "bun audit";
  }

  return "pnpm audit --audit-level high";
}

function supplyChainCommand(packageManager) {
  if (packageManager === "npm") {
    return "npm audit signatures";
  }

  if (packageManager === "yarn") {
    return "yarn npm audit --environment production --severity moderate";
  }

  if (packageManager === "bun") {
    return "bun audit";
  }

  return "pnpm audit --prod --audit-level moderate";
}

function renderScriptCommand(command, packageManager) {
  return command.replace(/\bpnpm ([a-zA-Z0-9:_-]+)/g, (_, scriptName) => (
    scriptCommand(packageManager, scriptName)
  ));
}
