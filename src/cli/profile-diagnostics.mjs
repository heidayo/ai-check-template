const CHECK_SCRIPT_NAMES = ["ai:check", "ai:check:fast"];

const SCRIPT_REFERENCE_PATTERNS = [
  /\b(?:pnpm|yarn)\s+([A-Za-z0-9:_-]+)/g,
  /\b(?:npm|bun)\s+run\s+([A-Za-z0-9:_-]+)/g,
];

const PACKAGE_MANAGER_SUBCOMMANDS = new Set([
  "add",
  "audit",
  "cache",
  "config",
  "create",
  "dlx",
  "exec",
  "help",
  "init",
  "install",
  "link",
  "outdated",
  "pack",
  "publish",
  "remove",
  "run",
  "store",
  "unlink",
  "update",
  "upgrade",
  "version",
  "why",
]);

export function diagnoseProfileScripts(profile, packageJson) {
  const scripts = packageJson?.scripts && typeof packageJson.scripts === "object"
    ? packageJson.scripts
    : {};
  const warnings = [];
  const base = profile?.base;
  const addons = new Set(profile?.addons ?? []);

  if (base === "react-nextjs") {
    if (!hasScriptOrCommand(scripts, "doctor")) {
      warnings.push(profileWarning("React Next.js profile recommends a React Doctor check."));
    }
    if (!hasScriptOrCommand(scripts, "test:e2e:smoke")) {
      warnings.push(profileWarning("React Next.js profile recommends a Playwright smoke E2E script."));
    }
  }

  if (base === "react-vanilla" && hasCommandToken(scripts, "next lint")) {
    warnings.push(profileWarning("React vanilla profile should avoid Next.js-specific lint scripts."));
  }

  if (base === "expo-rn") {
    if (hasCommandToken(scripts, "playwright")) {
      warnings.push(profileWarning("Expo React Native profile recommends Maestro or Detox instead of Playwright."));
    }
    if (hasCommandToken(scripts, "react-doctor")) {
      warnings.push(profileWarning("Expo React Native profile does not support React Doctor as a merge gate."));
    }
  }

  if (base === "node-cli") {
    if (hasScriptOrCommand(scripts, "test:e2e") || hasCommandToken(scripts, "playwright")) {
      warnings.push(profileWarning("Node CLI profile usually replaces UI E2E checks with CLI integration tests."));
    }
  }

  if (addons.has("supabase-rls")) {
    if (!hasScriptName(scripts, "test:db")) {
      warnings.push(addonWarning("Supabase RLS addon recommends a test:db script for pgTAP or DB-level tests."));
    }
    if (!hasScriptName(scripts, "test:integration:rls")) {
      warnings.push(addonWarning("Supabase RLS addon recommends a test:integration:rls script."));
    }
  }

  warnings.push(...missingReferencedScriptWarnings(scripts));

  return warnings;
}

function profileWarning(message) {
  return {
    code: "profile-advice",
    path: "package.json",
    message,
  };
}

function addonWarning(message) {
  return {
    code: "profile-addon-advice",
    path: "package.json",
    message,
  };
}

function scriptWarning(message) {
  return {
    code: "script-advice",
    path: "package.json",
    message,
  };
}

function hasScriptName(scripts, name) {
  return Object.hasOwn(scripts, name);
}

function hasScriptOrCommand(scripts, token) {
  return hasScriptName(scripts, token) || hasCommandToken(scripts, token);
}

function hasCommandToken(scripts, token) {
  const normalizedToken = token.toLowerCase();
  return Object.values(scripts).some(
    (command) => typeof command === "string" && command.toLowerCase().includes(normalizedToken),
  );
}

function missingReferencedScriptWarnings(scripts) {
  return [...missingReferencedScripts(scripts)].map((scriptName) => (
    scriptWarning(`ai:check references missing package script: ${scriptName}`)
  ));
}

function missingReferencedScripts(scripts) {
  const referenced = new Set();

  for (const scriptName of CHECK_SCRIPT_NAMES) {
    for (const reference of referencedScriptsInCommand(scripts[scriptName])) {
      referenced.add(reference);
    }
  }

  return new Set([...referenced].filter((scriptName) => !hasScriptName(scripts, scriptName)));
}

function referencedScriptsInCommand(command) {
  if (typeof command !== "string") {
    return [];
  }

  const references = [];
  for (const pattern of SCRIPT_REFERENCE_PATTERNS) {
    for (const match of command.matchAll(pattern)) {
      const scriptName = match[1];
      if (!isPackageManagerSubcommand(scriptName)) {
        references.push(scriptName);
      }
    }
  }

  return references;
}

function isPackageManagerSubcommand(scriptName) {
  return PACKAGE_MANAGER_SUBCOMMANDS.has(scriptName);
}
