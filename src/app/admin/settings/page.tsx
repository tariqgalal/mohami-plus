import { Settings } from "lucide-react";
import { getPlatformSettings } from "@/services/admin-service";
import { PlatformSettingsForm } from "./platform-settings-form";

export default async function AdminSettingsPage() {
  const stored = await getPlatformSettings();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="size-7 text-amber-600" />
          إعدادات المنصة
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          أسعار الباقات، فترة التجربة، ضريبة القيمة المضافة، ورسالة الترحيب
        </p>
      </div>

      <PlatformSettingsForm initial={stored} />
    </div>
  );
}
