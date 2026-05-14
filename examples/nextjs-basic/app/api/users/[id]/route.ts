import { NextResponse } from "next/server";
import { getPublicUser, hasUser, isValidUserId } from "../../../../lib/users";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!isValidUserId(id)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  if (!hasUser(id)) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const user = getPublicUser(id);
  return NextResponse.json({ user });
}
