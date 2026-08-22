import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/tenant";
import { hasPermission } from "@/lib/permissions";

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!hasPermission(user.role, "TEAM_READ")) redirect("/dashboard");
  return children;
}
