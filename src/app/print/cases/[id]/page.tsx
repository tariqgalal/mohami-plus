import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCase } from "@/services/case-service";
import { CasePrint } from "@/components/print/case-print";
import { PrintToolbar } from "@/components/print/print-toolbar";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PrintCasePage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.tenantId) notFound();

  const item = await getCase(session.user.tenantId, id);
  if (!item) notFound();

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: {
      name: true,
      licenseNumber: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      logo: true,
    },
  });
  if (!tenant) notFound();

  return (
    <>
      <PrintToolbar caseNumber={item.caseNumber} />
      <CasePrint
        tenant={tenant}
        client={{
          name: item.client.name,
          phone: item.client.phone,
          email: item.client.email,
          city: item.client.city,
          address: item.client.address,
        }}
        caseData={{
          caseNumber: item.caseNumber,
          title: item.title,
          description: item.description,
          caseType: item.caseType,
          court: item.court,
          courtCity: item.courtCity,
          status: item.status,
          priority: item.priority,
          value: item.value ? Number(item.value) : null,
          filingDate: item.filingDate,
          closingDate: item.closingDate,
          result: item.result,
          notes: item.notes,
          createdAt: item.createdAt,
          lawyers: item.lawyers.map((l) => ({
            name: l.user.name,
            isPrimary: l.isPrimary,
          })),
          opponents: item.opponents.map((o) => ({
            name: o.name,
            type: o.type,
            lawyer: o.lawyer,
            phone: o.phone,
            notes: o.notes,
          })),
          sessions: item.sessions.map((s) => ({
            id: s.id,
            date: s.date,
            time: s.time,
            court: s.court,
            hall: s.hall,
            sessionType: s.sessionType,
            status: s.status,
            result: s.result,
          })),
          documents: item.documents.map((d) => ({
            id: d.id,
            name: d.name,
            fileType: d.fileType,
            createdAt: d.createdAt,
          })),
          activities: item.activities.map((a) => ({
            id: a.id,
            action: a.action,
            userName: a.user.name,
            createdAt: a.createdAt,
          })),
          invoices: item.invoices.map((inv) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            totalAmount: Number(inv.totalAmount),
            paidAmount: Number(inv.paidAmount),
            status: inv.status,
            dueDate: inv.dueDate,
          })),
        }}
      />
    </>
  );
}
