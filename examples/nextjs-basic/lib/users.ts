export type UserRecord = {
  id: string;
  displayName: string;
  handle: string;
  bio: string;
  email: string;
  role: "admin" | "member";
  internalNotes: string;
  createdAt: string;
};

export type PublicUser = {
  id: string;
  displayName: string;
  handle: string;
  bio: string;
};

const users: UserRecord[] = [
  {
    id: "ada",
    displayName: "Ada Lovelace",
    handle: "ada",
    bio: "Writes careful acceptance criteria before implementation.",
    email: "ada@example.invalid",
    role: "admin",
    internalNotes: "Prefers explicit contracts over self-reported completion.",
    createdAt: "2026-05-14T00:00:00.000Z"
  },
  {
    id: "grace",
    displayName: "Grace Hopper",
    handle: "grace",
    bio: "Debugs the gap between generated code and verified behavior.",
    email: "grace@example.invalid",
    role: "member",
    internalNotes: "Checks edge cases before accepting generated output.",
    createdAt: "2026-05-14T00:00:00.000Z"
  }
];

export function isValidUserId(id: string): boolean {
  return /^[a-z][a-z0-9-]{1,31}$/.test(id);
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    displayName: user.displayName,
    handle: user.handle,
    bio: user.bio
  };
}

export function getPublicUser(id: string): PublicUser | null {
  if (!isValidUserId(id)) {
    return null;
  }

  const user = users.find((item) => item.id === id);
  return user ? toPublicUser(user) : null;
}

export function hasUser(id: string): boolean {
  return users.some((user) => user.id === id);
}
