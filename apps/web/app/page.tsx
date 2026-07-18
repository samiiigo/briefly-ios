import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>Briefly Web</h1>
      <p>Authenticated product surface for dashboard, library, search, and settings.</p>
      <nav className="nav" aria-label="Primary">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/library">Library</Link>
        <Link href="/settings">Settings</Link>
        <Link href="/login">Sign in</Link>
      </nav>
    </main>
  );
}
