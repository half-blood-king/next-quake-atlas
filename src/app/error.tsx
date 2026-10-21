'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="error-box">
      <h1>The ground shook a little too hard.</h1>
      <p>{error.message || 'Could not reach the USGS feed.'}</p>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
