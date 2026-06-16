import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { TeamForm } from "@/components/team/team-form";

export const metadata: Metadata = { title: "عضو جديد" };

export default function NewTeamMemberPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الفريق", href: "/dashboard/team" },
          { label: "عضو جديد" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">عضو جديد</h1>
        <p className="text-sm text-slate-500 mt-1">
          أضف عضو جديد لفريقك. سيستخدم البريد وكلمة المرور للدخول.
        </p>
      </div>
      <TeamForm mode="create" />
    </div>
  );
}
