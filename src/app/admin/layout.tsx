import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.isSuperAdmin) redirect("/dashboard");

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      <AdminSidebar userName={session.user.name ?? "المدير"} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
