import { notFound } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { getSession } from "@/services/session-service";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SessionForm } from "@/components/sessions/session-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSessionPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const s = await getSession(tenantId, id);
  if (!s) notFound();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الجلسات", href: "/dashboard/sessions" },
          { label: s.case.title, href: `/dashboard/sessions/${id}` },
          { label: "تعديل" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">تعديل الجلسة</h1>
        <p className="text-sm text-slate-500 mt-1 font-mono">
          {s.case.caseNumber}
        </p>
      </div>
      <SessionForm
        mode="edit"
        initial={{
          id: s.id,
          caseId: s.caseId,
          lawyerId: s.lawyerId,
          date: s.date.toISOString().slice(0, 10) as never,
          time: s.time,
          court: s.court,
          hall: s.hall,
          judge: s.judge,
          sessionType: s.sessionType,
          status: s.status,
          notes: s.notes,
          reminder: s.reminder,
        }}
      />
    </div>
  );
}
