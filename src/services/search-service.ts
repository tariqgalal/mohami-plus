import { prisma } from "@/lib/prisma";

export interface SearchResult {
  id: string;
  type: "case" | "client" | "session" | "team";
  title: string;
  subtitle?: string;
  href: string;
}

export async function globalSearch(
  tenantId: string,
  query: string,
  perBucket = 5,
): Promise<{ results: SearchResult[]; counts: Record<string, number> }> {
  const q = query.trim();
  if (!q) {
    return {
      results: [],
      counts: { case: 0, client: 0, session: 0, team: 0 },
    };
  }

  const [cases, clients, sessions, team] = await Promise.all([
    prisma.case.findMany({
      where: {
        tenantId,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { caseNumber: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: perBucket,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        caseNumber: true,
        title: true,
        client: { select: { name: true } },
      },
    }),
    prisma.client.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { nationalId: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: perBucket,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        city: true,
      },
    }),
    prisma.courtSession.findMany({
      where: {
        tenantId,
        OR: [
          { court: { contains: q, mode: "insensitive" } },
          { judge: { contains: q, mode: "insensitive" } },
          { case: { title: { contains: q, mode: "insensitive" } } },
          { case: { caseNumber: { contains: q, mode: "insensitive" } } },
        ],
      },
      take: perBucket,
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        time: true,
        court: true,
        case: { select: { title: true, caseNumber: true } },
      },
    }),
    prisma.user.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { specialization: { contains: q, mode: "insensitive" } },
        ],
      },
      take: perBucket,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    }),
  ]);

  const results: SearchResult[] = [
    ...cases.map((c) => ({
      id: c.id,
      type: "case" as const,
      title: `${c.caseNumber} — ${c.title}`,
      subtitle: c.client?.name ?? "",
      href: `/dashboard/cases/${c.id}`,
    })),
    ...clients.map((c) => ({
      id: c.id,
      type: "client" as const,
      title: c.name,
      subtitle: [c.phone, c.city].filter(Boolean).join(" · "),
      href: `/dashboard/clients/${c.id}`,
    })),
    ...sessions.map((s) => ({
      id: s.id,
      type: "session" as const,
      title: s.case.title,
      subtitle: `${s.court} · ${s.time}`,
      href: `/dashboard/sessions/${s.id}`,
    })),
    ...team.map((u) => ({
      id: u.id,
      type: "team" as const,
      title: u.name,
      subtitle: u.email,
      href: `/dashboard/team/${u.id}`,
    })),
  ];

  return {
    results,
    counts: {
      case: cases.length,
      client: clients.length,
      session: sessions.length,
      team: team.length,
    },
  };
}
