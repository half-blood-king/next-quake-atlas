import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="error-box">
      <h1>No such quake.</h1>
      <p>That event ID isn&apos;t in the USGS catalogue.</p>
      <Link href="/">Back to the atlas</Link>
    </main>
  );
}
