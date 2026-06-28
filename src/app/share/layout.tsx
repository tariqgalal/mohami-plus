// Public share layout — no auth, no sidebar. Used for token-protected resources.
export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">{children}</div>
  );
}
