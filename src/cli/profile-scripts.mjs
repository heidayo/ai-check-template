import { parseProfiles } from "./profile.mjs";

const BASE_PROFILE_SCRIPTS = {
  "react-nextjs": {
    "ai:check": "pnpm typecheck && pnpm lint && pnpm doctor && pnpm deadcode && pnpm test && pnpm test:e2e:smoke",
    "ai:check:fast": "pnpm typecheck && pnpm lint && pnpm test:unit",
    doctor: "npx -y react-doctor@latest . --fail-on warning",
    deadcode: "knip",
  },
  "react-vanilla": {
    "ai:check": "pnpm typecheck && pnpm lint && pnpm deadcode && pnpm test",
    "ai:check:fast": "pnpm typecheck && pnpm lint && pnpm test:unit",
    deadcode: "knip",
  },
  "expo-rn": {
    "ai:check": "pnpm typecheck && pnpm lint && pnpm deadcode && pnpm test && pnpm test:e2e:smoke",
    "ai:check:fast": "pnpm typecheck && pnpm lint && pnpm test:unit",
    deadcode: "knip",
    "test:e2e:smoke": "maestro test .maestro/smoke.yaml",
  },
  "node-cli": {
    "ai:check": "pnpm typecheck && pnpm lint && pnpm deadcode && pnpm test",
    "ai:check:fast": "pnpm typecheck && pnpm lint && pnpm test:unit",
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
  "supabase-rls": ["pnpm test:db", "pnpm test:integration:rls"],
};

export function getProfileScripts(input = "react-nextjs") {
  const profile = typeof input === "string" ? parseProfiles(input) : input;
  const scripts = { ...BASE_PROFILE_SCRIPTS[profile.base] };

  for (const addon of profile.addons) {
    Object.assign(scripts, ADDON_PROFILE_SCRIPTS[addon] ?? {});
    for (const step of ADDON_CHECK_STEPS[addon] ?? []) {
      scripts["ai:check"] = appendScriptStep(scripts["ai:check"], step);
    }
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
