export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-brand text-4xl font-bold text-cyan animate-fade-up">kha.blog</h1>
      <p className="mt-4 font-mono text-mono-lg text-ts">
        <span className="text-grn">$</span> apps/web scaffold OK
        <span className="ml-1 inline-block w-2 h-4 bg-cyan animate-blink align-middle" />
      </p>
      <pre className="mt-8 rounded-lg border border-b2 bg-surf p-4 font-mono text-mono text-tm shadow-glow-cyan-sm">
{`// next steps
- T-005 ✅ scaffold vite + react 19 + router v7
- T-006   eslint + prettier + husky
- T-010   prisma entities + migration
- T-050+  layout components (TopBar, StatusBar, ...)`}
      </pre>
    </main>
  );
}
