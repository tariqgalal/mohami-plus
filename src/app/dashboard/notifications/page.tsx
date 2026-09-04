import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { NotificationsClient } from "./notifications-client";
import { PushSettingsCard } from "@/components/settings/push-settings-card";

export const metadata: Metadata = {
  title: "الإشعارات",
};

export default function NotificationsPage() {
  return (
    <div className="space-y-6 animate-fade-in-page">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الإشعارات" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">الإشعارات</h1>
        <p className="text-slate-500 mt-1">
          كل الإشعارات والتنبيهات الخاصة بك
        </p>
      </div>

      <PushSettingsCard compact />

      <NotificationsClient />
    </div>
  );
}
