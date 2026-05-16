import { scriptCommand, validatePackageManager } from "./package-manager.mjs";

const MANAGED_COMMANDS = new Map([
  ["pnpm ai:check:fast", "ai:check:fast"],
  ["pnpm ai:check", "ai:check"],
]);

const MANAGED_SCRIPT_COMMANDS = new Set(
  ["pnpm", "npm", "yarn", "bun"].flatMap((packageManager) => [
    scriptCommand(packageManager, "ai:check:fast"),
    scriptCommand(packageManager, "ai:check"),
  ]),
);

export function renderClaudeHookSettings(fragment, packageManager) {
  const validatedPackageManager = validatePackageManager(packageManager);

  return {
    ...fragment,
    hooks: Object.fromEntries(
      Object.entries(fragment.hooks ?? {}).map(([name, entries]) => [
        name,
        renderHookEntries(entries, validatedPackageManager),
      ]),
    ),
  };
}

export function mergeRenderedClaudeHookEntries(currentEntries, expectedEntries) {
  if (!Array.isArray(currentEntries)) {
    return expectedEntries;
  }

  const customEntries = currentEntries
    .map((entry) => customHookEntry(entry))
    .filter(Boolean);

  return [...expectedEntries, ...customEntries];
}

function renderHookEntries(entries, packageManager) {
  if (!Array.isArray(entries)) {
    return entries;
  }

  return entries.map((entry) => ({
    ...entry,
    hooks: Array.isArray(entry.hooks)
      ? entry.hooks.map((hook) => renderHookCommand(hook, packageManager))
      : entry.hooks,
  }));
}

function renderHookCommand(hook, packageManager) {
  if (!hook || typeof hook !== "object" || hook.type !== "command") {
    return hook;
  }

  const scriptName = MANAGED_COMMANDS.get(hook.command);
  if (!scriptName) {
    return { ...hook };
  }

  return {
    ...hook,
    command: scriptCommand(packageManager, scriptName),
  };
}

function customHookEntry(entry) {
  if (!entry || typeof entry !== "object" || !Array.isArray(entry.hooks)) {
    return null;
  }

  const hooks = entry.hooks.filter((hook) => !isManagedCommandHook(hook));
  if (hooks.length === 0) {
    return null;
  }

  return {
    ...entry,
    hooks,
  };
}

function isManagedCommandHook(hook) {
  return (
    hook &&
    typeof hook === "object" &&
    hook.type === "command" &&
    typeof hook.command === "string" &&
    MANAGED_SCRIPT_COMMANDS.has(hook.command)
  );
}
