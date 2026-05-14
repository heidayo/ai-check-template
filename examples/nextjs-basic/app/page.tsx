import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", margin: "3rem auto", maxWidth: "42rem" }}>
      <p style={{ color: "#2563eb", fontSize: "0.875rem", fontWeight: 700, margin: 0 }}>
        ai-check-template example
      </p>
      <h1 style={{ fontSize: "2rem", lineHeight: 1.2, margin: "0.5rem 0 1rem" }}>
        Next.js basic Before / After
      </h1>
      <p style={{ color: "#334155", lineHeight: 1.7 }}>
        This example shows a small AI-generated user profile endpoint that should not be trusted
        until acceptance criteria, tests, and an ai:check loop verify the behavior.
      </p>
      <ul style={{ lineHeight: 1.8 }}>
        <li>
          <Link href="/users/ada">View Ada Lovelace</Link>
        </li>
        <li>
          <Link href="/users/grace">View Grace Hopper</Link>
        </li>
        <li>
          <Link href="/api/users/ada">Inspect API response</Link>
        </li>
      </ul>
    </main>
  );
}
