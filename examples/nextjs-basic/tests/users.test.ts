import { describe, expect, it } from "vitest";
import { getPublicUser, hasUser, isValidUserId, toPublicUser, type UserRecord } from "../lib/users";

describe("public user contract", () => {
  it("returns only public fields for known users", () => {
    const user = getPublicUser("ada");

    expect(user).toEqual({
      id: "ada",
      displayName: "Ada Lovelace",
      handle: "ada",
      bio: "Writes careful acceptance criteria before implementation."
    });
    expect(user).not.toHaveProperty("email");
    expect(user).not.toHaveProperty("role");
    expect(user).not.toHaveProperty("internalNotes");
    expect(user).not.toHaveProperty("createdAt");
  });

  it("rejects invalid ids before lookup, matching the API route 400 behavior", () => {
    expect(isValidUserId("../ada")).toBe(false);
    expect(isValidUserId("A")).toBe(false);
    expect(isValidUserId("ada")).toBe(true);
  });

  it("detects unknown users, matching the API route 404 behavior", () => {
    expect(hasUser("unknown-user")).toBe(false);
    expect(getPublicUser("unknown-user")).toBeNull();
  });

  it("keeps the allowlist explicit when records gain private fields", () => {
    const record: UserRecord = {
      id: "test-user",
      displayName: "Test User",
      handle: "test-user",
      bio: "Used to prove public projection.",
      email: "test@example.invalid",
      role: "member",
      internalNotes: "This field must not leave the server boundary.",
      createdAt: "2026-05-14T00:00:00.000Z"
    };

    expect(Object.keys(toPublicUser(record)).sort()).toEqual(["bio", "displayName", "handle", "id"]);
  });
});
