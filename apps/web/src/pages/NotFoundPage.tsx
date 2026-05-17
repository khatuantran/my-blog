import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-brand text-3xl font-bold text-red">404</h1>
      <p className="mt-4 font-mono text-mono-lg text-ts">
        <span className="text-red">ERR</span> route not found
      </p>
      <Link to="/" className="mt-6 inline-block font-mono text-mono text-cyan hover:underline">
        ← back to /
      </Link>
    </main>
  );
}
