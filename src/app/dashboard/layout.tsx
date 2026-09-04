import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { PushPermissionBanner } from "@/components/layout/push-permission-banner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.tenantId) redirect("/admin");

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [tenant, todaySessions, todayMeetings, dueInvoices] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { name: true, status: true },
    }),
    prisma.courtSession.count({
      where: {
        tenantId: session.user.tenantId,
        status: "SCHEDULED",
        date: { gte: startOfToday, lt: endOfToday },
      },
    }),
    prisma.meeting.count({
      where: {
        tenantId: session.user.tenantId,
        status: "SCHEDULED",
        date: { gte: startOfToday, lt: endOfToday },
      },
    }),
    prisma.invoice.count({
      where: {
        tenantId: session.user.tenantId,
        status: { in: ["SENT", "PARTIAL", "OVERDUE"] },
        dueDate: { gte: startOfToday, lt: endOfToday },
      },
    }),
  ]);

  const todayTasksCount = todaySessions + todayMeetings + dueInvoices;

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          user={{
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
          }}
          tenantName={tenant?.name}
          todayTasksCount={todayTasksCount}
        />
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in-page">
          <PushPermissionBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
