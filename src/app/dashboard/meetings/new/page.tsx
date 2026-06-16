import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { MeetingForm } from "@/components/meetings/meeting-form";

export default function NewMeetingPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الاجتماعات", href: "/dashboard/meetings" },
          { label: "اجتماع جديد" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">اجتماع جديد</h1>
        <p className="text-sm text-slate-500 mt-1">
          جدولة اجتماع جديد مع الموكلين أو الفريق
        </p>
      </div>
      <MeetingForm mode="create" />
    </div>
  );
}
