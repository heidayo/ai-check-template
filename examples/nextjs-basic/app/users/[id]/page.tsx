import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicUser, isValidUserId } from "../../../lib/users";

type UserPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function UserPage({ params }: UserPageProps) {
  const { id } = await params;

  if (!isValidUserId(id)) {
    notFound();
  }

  const user = getPublicUser(id);

  if (!user) {
    notFound();
  }

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", margin: "3rem auto", maxWidth: "42rem" }}>
      <Link href="/">Back to example home</Link>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{user.displayName}</h1>
      <p style={{ color: "#2563eb", fontWeight: 700 }}>@{user.handle}</p>
      <p style={{ color: "#334155", lineHeight: 1.7 }}>{user.bio}</p>
      <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.7 }}>
        The page renders only public profile fields. Private record fields are verified in unit
        tests and are not part of the public contract.
      </p>
    </main>
  );
}
