import { notFound } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { getMeeting } from "@/services/meeting-service";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { MeetingForm } from "@/components/meetings/meeting-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMeetingPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const m = await getMeeting(tenantId, id);
  if (!m) notFound();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الاجتماعات", href: "/dashboard/meetings" },
          { label: m.title, href: `/dashboard/meetings/${id}` },
          { label: "تعديل" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">تعديل الاجتماع</h1>
      </div>
      <MeetingForm
        mode="edit"
        initial={{
          id: m.id,
          title: m.title,
          date: m.date.toISOString().slice(0, 10) as never,
          time: m.time,
          duration: m.duration,
          meetingType: m.meetingType,
          location: m.location,
          isVirtual: m.isVirtual,
          meetingLink: m.meetingLink,
          notes: m.notes,
          status: m.status,
          attendees: m.attendees.map((a) => ({
            userId: a.userId,
            externalName: a.externalName,
            externalEmail: a.externalEmail,
          })),
          minutesUrl: m.minutesUrl,
          minutesName: m.minutesName,
        }}
      />
    </div>
  );
}
