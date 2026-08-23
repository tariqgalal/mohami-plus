import type { Metadata } from "next";
import { WathiqComingSoon } from "@/components/wathiq/coming-soon";

export const metadata: Metadata = { title: "العنوان الوطني" };

export default function NationalAddressPage() {
  return (
    <WathiqComingSoon
      title="العنوان الوطني"
      description="الاستعلام عن العناوين الوطنية عبر منصة وثائق"
    />
  );
}
