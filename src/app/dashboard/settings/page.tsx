import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";
import { TenantForm } from "@/components/settings/tenant-form";
import { SubscriptionCard } from "@/components/settings/subscription-card";
import { NotificationPreferencesForm } from "@/components/settings/notification-preferences-form";
import { getCurrentUser } from "@/lib/tenant";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const isFirmAdmin = user.role === "FIRM_ADMIN";

  return (
    <div className="space-y-6 max-w-4xl">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: "الإعدادات" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">الإعدادات</h1>
        <p className="text-sm text-slate-500 mt-1">
          إدارة بيانات الملف الشخصي والإشعارات والمكتب والاشتراك
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
          {isFirmAdmin && <TabsTrigger value="firm">المكتب</TabsTrigger>}
          {isFirmAdmin && <TabsTrigger value="subscription">الاشتراك</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm />
        </TabsContent>

        <TabsContent value="security">
          <PasswordForm />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationPreferencesForm />
        </TabsContent>

        {isFirmAdmin && (
          <TabsContent value="firm">
            <TenantForm canEdit />
          </TabsContent>
        )}

        {isFirmAdmin && (
          <TabsContent value="subscription">
            <SubscriptionCard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
