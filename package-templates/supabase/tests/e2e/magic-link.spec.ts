import { expect, test } from "@playwright/test";

const mailApiUrl = process.env.SUPABASE_LOCAL_MAIL_API_URL ?? "http://127.0.0.1:54324/api/v1";
const testEmail = process.env.SUPABASE_TEST_EMAIL ?? "user@example.test";

test("@smoke local Magic Link sign-in works", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(testEmail);
  await page.getByRole("button", { name: /sign in|send magic link/i }).click();

  const magicLink = await fetchLatestMagicLink(testEmail);
  await page.goto(magicLink);

  await expect(page.getByRole("main")).toBeVisible();
});

async function fetchLatestMagicLink(email: string) {
  const messagesResponse = await fetch(`${mailApiUrl}/messages`);

  if (!messagesResponse.ok) {
    throw new Error(`Local mail capture request failed: ${messagesResponse.status}`);
  }

  const messages = await messagesResponse.json();
  const serialized = JSON.stringify(messages);

  if (!serialized.includes(email)) {
    throw new Error(`No local Magic Link message found for ${email}`);
  }

  const match = serialized.match(/https?:\/\/[^"'\\\s]+/);

  if (!match) {
    throw new Error("No Magic Link URL found in local mail capture response");
  }

  return match[0];
}
