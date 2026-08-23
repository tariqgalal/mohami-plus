import type { Metadata } from "next";
import { WathiqComingSoon } from "@/components/wathiq/coming-soon";

export const metadata: Metadata = { title: "التحقق من الوكالة" };

export default function VerifyPoaPage() {
  return (
    <WathiqComingSoon
      title="التحقق من الوكالة"
      description="التحقق من صحة الوكالات الشرعية عبر منصة وثائق"
    />
  );
}
