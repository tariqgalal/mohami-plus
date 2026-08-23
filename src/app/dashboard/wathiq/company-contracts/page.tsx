import type { Metadata } from "next";
import { WathiqComingSoon } from "@/components/wathiq/coming-soon";

export const metadata: Metadata = { title: "عقود الشركات" };

export default function CompanyContractsPage() {
  return (
    <WathiqComingSoon
      title="عقود الشركات"
      description="الاطلاع على عقود تأسيس الشركات عبر منصة وثائق"
    />
  );
}
