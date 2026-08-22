import { notFound } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { getTeamMember } from "@/services/team-service";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { TeamForm } from "@/components/team/team-form";
import { getCurrentUser } from "@/lib/tenant";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTeamMemberPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!hasPermission(user.role, "TEAM_MANAGE")) redirect("/dashboard/team");
  const { id } = await params;
  const tenantId = await getTenantId();
  const m = await getTeamMember(tenantId, id);
  if (!m) notFound();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الفريق", href: "/dashboard/team" },
          { label: m.name, href: `/dashboard/team/${id}` },
          { label: "تعديل" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">تعديل بيانات العضو</h1>
        <p className="text-sm text-slate-500 mt-1">{m.name}</p>
      </div>
      <TeamForm
        mode="edit"
        initial={{
          id: m.id,
          name: m.name,
          email: m.email,
          phone: m.phone,
          role: m.role,
          specialization: m.specialization,
          isActive: m.isActive,
          avatar: m.avatar,
          password: "placeholder1",
        }}
      />
    </div>
  );
}
