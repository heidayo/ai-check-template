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
