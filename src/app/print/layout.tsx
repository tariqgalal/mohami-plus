// Thin layout for print/preview pages — no sidebar, no header, just the body.
export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">{children}</div>
  );
}
