import { CliError } from "./utils.mjs";

const BASE_PROFILES = new Set([
  "react-nextjs",
  "react-vanilla",
  "expo-rn",
  "node-cli",
]);

const ADDON_PROFILES = new Set(["supabase-rls"]);

export const supportedProfiles = [
  ...BASE_PROFILES,
  ...ADDON_PROFILES,
];

export function parseProfiles(input = "react-nextjs") {
  const names = input
    .split(/[,+]/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (names.length === 0) {
    throw invalidProfile(input);
  }

  const uniqueNames = new Set(names);
  if (uniqueNames.size !== names.length) {
    throw new CliError(`Duplicate profile in --profile: ${input}`);
  }

  const unknown = names.filter(
    (name) => !BASE_PROFILES.has(name) && !ADDON_PROFILES.has(name),
  );
  if (unknown.length > 0) {
    throw invalidProfile(unknown.join(", "));
  }

  const baseProfiles = names.filter((name) => BASE_PROFILES.has(name));
  if (baseProfiles.length !== 1) {
    throw new CliError(
      `--profile must include exactly one base profile. Supported base profiles: ${[
        ...BASE_PROFILES,
      ].join(", ")}`,
    );
  }

  return {
    base: baseProfiles[0],
    addons: names.filter((name) => ADDON_PROFILES.has(name)),
    all: names,
  };
}

function invalidProfile(value) {
  return new CliError(
    `Invalid profile: ${value}. Supported profiles: ${supportedProfiles.join(", ")}`,
  );
}
