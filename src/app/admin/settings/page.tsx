import { Settings } from "lucide-react";
import { getPlatformSettings } from "@/services/admin-service";
import { PlatformSettingsForm } from "./platform-settings-form";

export default async function AdminSettingsPage() {
  const stored = await getPlatformSettings();

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in-page">
      <div className="flex items-start gap-4">
        <div className="size-14 rounded-2xl bg-admin-gold-gradient text-white grid place-items-center shadow-gold shrink-0">
          <Settings className="size-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إعدادات المنصة</h1>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            تحكم في فترة التجربة، أسعار الباقات، حدود التخزين، وضريبة القيمة
            المضافة
          </p>
        </div>
      </div>

      <PlatformSettingsForm initial={stored} />
    </div>
  );
}
