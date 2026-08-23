import type { Metadata } from "next";
import { WathiqComingSoon } from "@/components/wathiq/coming-soon";

export const metadata: Metadata = { title: "معلومات الموظف" };

export default function EmployeeInfoPage() {
  return (
    <WathiqComingSoon
      title="معلومات الموظف"
      description="الاستعلام عن بيانات الموظفين عبر منصة وثائق"
    />
  );
}
