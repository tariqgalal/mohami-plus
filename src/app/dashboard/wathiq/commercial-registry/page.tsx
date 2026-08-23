import type { Metadata } from "next";
import { WathiqComingSoon } from "@/components/wathiq/coming-soon";

export const metadata: Metadata = { title: "السجل التجاري" };

export default function CommercialRegistryPage() {
  return (
    <WathiqComingSoon
      title="السجل التجاري"
      description="التحقق من بيانات السجلات التجارية عبر منصة وثائق"
    />
  );
}
