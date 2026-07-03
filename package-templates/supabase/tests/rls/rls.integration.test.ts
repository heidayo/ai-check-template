import { createClient } from "@supabase/supabase-js";
import { describe, expect, test } from "vitest";

// --- 設定変数（環境に合わせて編集 / env で注入）---
// Edit these defaults to match your schema, or override with the matching
// environment variables (RLS_TABLE / RLS_OWNER_COLUMN). Unset env falls back
// to the defaults below, keeping the original behavior.
const TABLE = process.env.RLS_TABLE ?? "app_items";
const OWNER = process.env.RLS_OWNER_COLUMN ?? "owner_id";

const supabaseUrl = requireEnv("SUPABASE_URL");
const supabaseAnonKey = requireEnv("SUPABASE_ANON_KEY");

describe("RLS integration", () => {
  test("user can read own rows and cannot read another user's rows", async () => {
    const userA = createUserClient("SUPABASE_TEST_USER_A_SESSION");

    const ownRows = await userA
      .from(TABLE)
      .select(`id, ${OWNER}`)
      .eq(OWNER, requireEnv("SUPABASE_TEST_USER_A_ID"));

    expect(ownRows.error).toBeNull();
    expect(ownRows.data?.length).toBeGreaterThan(0);

    const otherRows = await userA
      .from(TABLE)
      .select(`id, ${OWNER}`)
      .eq(OWNER, requireEnv("SUPABASE_TEST_USER_B_ID"));

    expect(otherRows.error).toBeNull();
    expect(otherRows.data).toEqual([]);
  });

  test("user cannot update another user's row", async () => {
    const userA = createUserClient("SUPABASE_TEST_USER_A_SESSION");

    const updateResult = await userA
      .from(TABLE)
      .update({ updated_at: new Date().toISOString() })
      .eq(OWNER, requireEnv("SUPABASE_TEST_USER_B_ID"))
      .select("id");

    expect(updateResult.error).toBeNull();
    expect(updateResult.data).toEqual([]);
  });
});

function createUserClient(sessionEnvName: string) {
  const session = JSON.parse(requireEnv(sessionEnvName));

  // service-role bypass warning: do not use a privileged server key here.
  // RLS correctness must be checked with the same user-level authorization
  // path that the application uses.
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  });
}

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment value: ${name}`);
  }

  return value;
}
