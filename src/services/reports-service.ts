import { prisma } from "@/lib/prisma";

export async function getDashboardOverview(tenantId: string) {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    activeCasesCount,
    todaySessionsCount,
    activeClientsCount,
    monthInvoicesAgg,
    upcomingSessions,
    recentCases,
    monthlyInvoices,
    todaySessions,
    todayMeetings,
    todayDueInvoices,
    recentActivities,
    activePoaCount,
    activeExecutionsCount,
    activeConsultationsCount,
    openServiceRequestsCount,
  ] = await Promise.all([
    prisma.case.count({
      where: {
        tenantId,
        status: { in: ["OPEN", "IN_PROGRESS", "APPEALED"] },
        archivedAt: null,
      },
    }),
    prisma.courtSession.count({
      where: {
        tenantId,
        date: { gte: startOfToday, lt: endOfToday },
      },
    }),
    prisma.client.count({
      where: { tenantId, status: "ACTIVE" },
    }),
    prisma.invoice.aggregate({
      where: {
        tenantId,
        issueDate: { gte: startOfMonth, lt: endOfMonth },
      },
      _sum: { totalAmount: true, paidAmount: true },
      _count: true,
    }),
    prisma.courtSession.findMany({
      where: {
        tenantId,
        status: "SCHEDULED",
        date: { gte: startOfToday },
      },
      orderBy: { date: "asc" },
      take: 5,
      include: {
        case: { select: { id: true, caseNumber: true, title: true } },
        lawyer: { select: { id: true, name: true } },
      },
    }),
    prisma.case.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        client: { select: { id: true, name: true } },
      },
    }),
    getMonthlyInvoiceTotals(tenantId, 6),
    prisma.courtSession.findMany({
      where: {
        tenantId,
        date: { gte: startOfToday, lt: endOfToday },
        status: "SCHEDULED",
      },
      orderBy: { date: "asc" },
      include: {
        case: { select: { id: true, caseNumber: true, title: true } },
        lawyer: { select: { id: true, name: true } },
      },
    }),
    prisma.meeting.findMany({
      where: {
        tenantId,
        date: { gte: startOfToday, lt: endOfToday },
        status: "SCHEDULED",
      },
      orderBy: { date: "asc" },
    }),
    prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ["SENT", "PARTIAL", "OVERDUE"] },
        dueDate: { gte: startOfToday, lt: endOfToday },
      },
      include: { client: { select: { id: true, name: true } } },
      take: 10,
    }),
    prisma.activity.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        user: { select: { id: true, name: true } },
        case: { select: { id: true, caseNumber: true, title: true } },
      },
    }),
    // الوكالات السارية
    prisma.powerOfAttorney.count({
      where: { tenantId, status: "ACTIVE" },
    }),
    // طلبات التنفيذ النشطة (قضايا من نوع تنفيذ وغير مؤرشفة)
    prisma.case.count({
      where: {
        tenantId,
        caseType: "EXECUTION",
        archivedAt: null,
        status: { notIn: ["WON", "LOST", "SETTLED", "CLOSED"] },
      },
    }),
    // الاستشارات القائمة
    prisma.consultation.count({
      where: { tenantId, status: "ACTIVE" },
    }),
    // طلبات العملاء المفتوحة (غير المنتهية/المرفوضة)
    prisma.clientServiceRequest.count({
      where: {
        tenantId,
        status: { notIn: ["FINAL_APPROVAL", "REJECTED"] },
      },
    }),
  ]);

  const todayTasks = [
    ...todaySessions.map((s) => ({
      id: s.id,
      kind: "session" as const,
      title: s.case.title,
      meta: `${s.time} · ${s.court}`,
      href: `/dashboard/sessions/${s.id}`,
    })),
    ...todayMeetings.map((m) => ({
      id: m.id,
      kind: "meeting" as const,
      title: m.title,
      meta: `${m.time} · ${m.location ?? "اجتماع"}`,
      href: `/dashboard/meetings`,
    })),
    ...todayDueInvoices.map((i) => ({
      id: i.id,
      kind: "invoice" as const,
      title: `الفاتورة ${i.invoiceNumber}`,
      meta: `${i.client.name} · ${Number(i.totalAmount).toLocaleString("ar-SA")} ر.س`,
      href: `/dashboard/finance/invoices`,
    })),
  ];

  return {
    stats: {
      activeCases: activeCasesCount,
      todaySessions: todaySessionsCount,
      activeClients: activeClientsCount,
      monthRevenue: Number(monthInvoicesAgg._sum.paidAmount ?? 0),
      monthInvoiced: Number(monthInvoicesAgg._sum.totalAmount ?? 0),
      activePoa: activePoaCount,
      activeExecutions: activeExecutionsCount,
      activeConsultations: activeConsultationsCount,
      openServiceRequests: openServiceRequestsCount,
    },
    upcomingSessions,
    todaySessions,
    recentCases,
    monthlyInvoices,
    todayTasks,
    recentActivities,
  };
}

export async function getReportsOverview(tenantId: string) {
  const [
    casesByStatus,
    casesByType,
    upcomingSessions,
    completedSessions,
    monthlyInvoices,
    lawyerPerformance,
  ] = await Promise.all([
    prisma.case.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true,
    }),
    prisma.case.groupBy({
      by: ["caseType"],
      where: { tenantId },
      _count: true,
    }),
    prisma.courtSession.count({
      where: {
        tenantId,
        status: "SCHEDULED",
        date: { gte: new Date() },
      },
    }),
    prisma.courtSession.count({
      where: { tenantId, status: "COMPLETED" },
    }),
    getMonthlyInvoiceTotals(tenantId, 6),
    getLawyerPerformance(tenantId),
  ]);

  return {
    casesByStatus,
    casesByType,
    upcomingSessions,
    completedSessions,
    monthlyInvoices,
    lawyerPerformance,
  };
}

export async function getMonthlyInvoiceTotals(tenantId: string, months: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      issueDate: { gte: start },
    },
    select: {
      issueDate: true,
      totalAmount: true,
      paidAmount: true,
    },
  });

  const buckets: Record<
    string,
    { month: string; total: number; paid: number; count: number }
  > = {};
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets[key] = { month: key, total: 0, paid: 0, count: 0 };
  }

  for (const inv of invoices) {
    const d = inv.issueDate;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (buckets[key]) {
      buckets[key].total += Number(inv.totalAmount);
      buckets[key].paid += Number(inv.paidAmount);
      buckets[key].count += 1;
    }
  }

  return Object.values(buckets);
}

async function getLawyerPerformance(tenantId: string) {
  const lawyers = await prisma.user.findMany({
    where: { tenantId, isActive: true },
    select: {
      id: true,
      name: true,
      role: true,
      _count: {
        select: {
          assignedCases: true,
          sessions: true,
        },
      },
    },
    take: 20,
  });

  return lawyers
    .map((l) => ({
      id: l.id,
      name: l.name,
      role: l.role,
      caseCount: l._count.assignedCases,
      sessionCount: l._count.sessions,
    }))
    .sort((a, b) => b.caseCount - a.caseCount);
}
