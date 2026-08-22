import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/tenant";
import { hasPermission } from "@/lib/permissions";

export default async function BillingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!hasPermission(user.role, "BILLING_MANAGE")) redirect("/dashboard");
  return children;
}
