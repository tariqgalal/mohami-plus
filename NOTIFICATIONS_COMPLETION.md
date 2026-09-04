# تقرير إنجاز نظام الإشعارات — محامي بلس

**التاريخ:** 4 سبتمبر 2026
**الحالة العامة:** ✅ المهام 1 → 9 مكتملة، والبناء ناجح (`npm run build`).

> **ملاحظة عن الترقيم:** ملف الخطة `NOTIFICATIONS_SYSTEM.md` غير موجود في المستودع (لم يُحفظ على القرص)،
> لذلك أُعيد بناء ترقيم المهام 1→9 من الكود الفعلي الموجود في شجرة العمل. المضمون مطابق لما نُفّذ،
> لكن ترتيب العناوين قد يختلف قليلاً عن الخطة الأصلية.

---

## 📋 حالة المهام

### ✅ 1 — قاعدة البيانات (Prisma Schema + Migration)

- إعادة بناء موديل `Notification` بالكامل: `tenantId`, `userId`, `type`, `title`, `body`, `link`,
  `isRead`, `relatedId`, `relatedType`, مع علاقات حقيقية لـ `Tenant` و `User` و `onDelete: Cascade`.
- إضافة enum `NotificationType` بـ 19 نوعاً (مهام، جلسات، قضايا، فواتير، مراسلات، وكالات، إجازات، استشارات، اجتماعات).
- موديل جديد `PushSubscription` (`endpoint` فريد + `p256dh` + `auth` + `userAgent`).
- حقل `notificationPreferences Json?` على `User`.
- فهارس: `[userId, isRead]`, `[tenantId]`, `[createdAt]`, `[relatedId, type]`.
- **Migration:** `prisma/migrations/20260904000000_notifications_and_push/` — ✅ مطبَّقة على قاعدة البيانات
  (`prisma migrate deploy` يقول: *No pending migrations to apply*).

### ✅ 2 — طبقة الخدمة (`src/services/notification-service.ts`)

- `createNotification` / `createNotificationForMany` — إنشاء إشعار لمستخدم أو لمجموعة.
- `listUserNotifications` / `countUserNotifications` / `getUnreadCount`.
- `markAsRead` / `markAllAsRead` / `deleteNotification`.
- `findAlreadyNotifiedUserIds` — منع تكرار نفس الإشعار لنفس العنصر.
- `filterByPreferences` — يستبعد المستخدمين الذين عطّلوا التصنيف قبل الإنشاء.
- `runInBackground` + `safely` — أي فشل في الإشعار **لا يُسقِط** العملية الأصلية (إنشاء المهمة/الفاتورة… إلخ).
- تصنيفات الإشعارات: `tasks`, `sessions`, `cases`, `messages`, `invoices`, `leaves` مع تسميات عربية.

### ✅ 3 — واجهات الـ API

| المسار | الطريقة | الوظيفة |
|---|---|---|
| `/api/notifications` | GET | قائمة الإشعارات + `unreadCount` (مع pagination) |
| `/api/notifications/unread-count` | GET | العدّاد فقط — يُستخدم في الـ polling الخفيف |
| `/api/notifications/[id]` | DELETE | حذف إشعار |
| `/api/notifications/[id]/read` | PATCH | تعليم إشعار كمقروء |
| `/api/notifications/read-all` | PATCH | تعليم الكل كمقروء |
| `/api/notifications/preferences` | GET / PUT | قراءة وحفظ تفضيلات المستخدم (دمج جزئي آمن) |
| `/api/push/subscribe` | POST | حفظ اشتراك المتصفح (upsert على `endpoint`) |
| `/api/push/unsubscribe` | POST | حذف الاشتراك |

كلها تمر عبر `getCurrentUser()` / `getTenantId()` والتحقق بـ Zod، والأخطاء عبر `handleApiError`.

### ✅ 4 — ربط المحفّزات بكل الموديولات

| الخدمة | الإشعارات المُطلَقة |
|---|---|
| `task-service` | `notifyTaskAssigned`, `notifyTaskCompleted` |
| `session-service` | `notifySessionCreated` |
| `case-service` | `notifyCaseAssigned`, `notifyCaseStatusChanged` |
| `invoice-service` | `notifyInvoiceCreated` |
| `correspondence-service` | `notifyMessageReceived` |
| `consultation-service` | `notifyConsultationCreated` |
| `meeting-service` | `notifyMeetingCreated` |
| `power-of-attorney-service` | `notifyPoaCreated` |
| `employee-leave-service` | `notifyLeaveRequested`, `notifyLeaveDecision` |

بالإضافة إلى `scanAndNotifyOverdueInvoices` المربوطة بـ cron يومي
(`/api/cron/check-overdue-invoices` الساعة 8 صباحاً في `vercel.json`).

### ✅ 5 — جرس الإشعارات في الهيدر (`notification-bell.tsx`)

- عدّاد أحمر فوق الجرس، polling كل 30 ثانية على `unread-count` فقط (خفيف).
- قائمة منسدلة بآخر 20 إشعاراً مع أيقونة ولون لكل نوع، ووقت نسبي بالعربية.
- تعليم إشعار واحد كمقروء عند الضغط (optimistic update)، وزر «تعليم الكل كمقروء».
- إغلاق تلقائي عند الضغط خارج القائمة، ورابط «عرض كل الإشعارات».

### ✅ 6 — صفحة الإشعارات الكاملة (`/dashboard/notifications`)

- إعادة كتابتها كـ Client Component (`notifications-client.tsx`) بدل الصفحة القديمة.
- حُذف `mark-all-read-button.tsx` القديم (استُبدل بمنطق داخل الـ client).
- تحتوي على `PushSettingsCard compact` لتفعيل إشعارات المتصفح مباشرة من الصفحة.

### ✅ 7 — إشعارات المتصفح (Web Push / PWA)

- `src/lib/push.ts` — إعداد VAPID كسول (lazy)، و`sendPushToUser` لا يرمي أخطاء أبداً،
  ويحذف الاشتراكات المنتهية تلقائياً عند رد `410`/`404`.
- **إن لم تُضبط مفاتيح VAPID، يُعطَّل الـ Push بهدوء وتظل الإشعارات الداخلية تعمل طبيعي.**
- `public/sw.js` — Service Worker يستقبل `push` ويعرض إشعاراً بالعربية (`dir: rtl`)،
  و`notificationclick` يركّز التبويب المفتوح أو يفتح تبويباً جديداً على الرابط الصحيح.
- `public/manifest.json` + أيقونات `public/icons/` (192×192 و badge 72×72)، ومربوطة في `src/app/layout.tsx`
  عبر `metadata.manifest` و `viewport.themeColor`.
- `src/hooks/use-push-notifications.ts` — تسجيل الـ SW وطلب الإذن والاشتراك/إلغاء الاشتراك.
- `scripts/generate-vapid-keys.ts` — توليد المفاتيح مرة واحدة.
- الحزم المضافة: `web-push` + `@types/web-push`.

### ✅ 8 — الإعدادات وتفضيلات المستخدم

- `notification-preferences-form.tsx` — تبويب «الإشعارات» الجديد في `/dashboard/settings`،
  فيه 6 مفاتيح تصنيف (مهام / جلسات / قضايا / مراسلات / فواتير / إجازات).
- `push-settings-card.tsx` — تفعيل وإيقاف إشعارات المتصفح، ويظهر داخل الإعدادات وصفحة الإشعارات.
- `push-permission-banner.tsx` — شريط تنبيه أعلى لوحة التحكم يعرض طلب الإذن، مضاف في `dashboard/layout.tsx`.

### ✅ 9 — عنصر الإشعارات في القائمة الجانبية مع عدّاد غير المقروء

- عنصر «الإشعارات» أُضيف في `sidebar.tsx` وفي `mobile-nav.tsx` مباشرة بعد «الرئيسية».
- شارة حمراء بعدد غير المقروء بجانب العنصر، تعرض `99+` عند التجاوز.
- **أُنجز في هذه الجلسة:** استُخرج عدّاد غير المقروء إلى hook مشترك
  `src/hooks/use-unread-count.ts` (بدلاً من نسخة محلية داخل `sidebar.tsx`)،
  وأُضيفت نفس الشارة إلى قائمة الموبايل — مع `enabled: open` بحيث لا يعمل الـ polling
  إلا والقائمة مفتوحة (جرس الهيدر يتكفّل بالتنبيه المستمر على الموبايل).

---

## 🔑 متغيرات البيئة المطلوبة في Vercel

يجب على المالك إضافة التالي في **Vercel → Project → Settings → Environment Variables**
لبيئتَي **Production** و **Preview**:

| المتغير | مطلوب؟ | القيمة |
|---|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ✅ نعم (لتشغيل Push) | المفتاح العام الناتج من السكربت |
| `VAPID_PRIVATE_KEY` | ✅ نعم (لتشغيل Push) | المفتاح الخاص — **سرّي، لا يُشارك** |
| `VAPID_SUBJECT` | ⬜ اختياري | مثال: `mailto:admin@mohamiplus.sa` (الافتراضي لو تُرك فارغاً) |

### كيفية توليد المفاتيح (مرة واحدة فقط):

```bash
npx tsx scripts/generate-vapid-keys.ts
```

سيطبع السكربت سطرين جاهزين للنسخ:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=B...
VAPID_PRIVATE_KEY=...
```

تُضاف نفس القيم في `.env.local` محلياً **وفي Vercel**.

> ⚠️ **تنبيه مهم:** المفاتيح تُولَّد مرة واحدة فقط. تغييرها لاحقاً يُبطل كل اشتراكات
> المتصفحات المسجَّلة، وسيحتاج كل مستخدم لإعادة تفعيل الإشعارات من جديد.

> ℹ️ **بدون هذه المتغيرات النظام يعمل بشكل كامل** — الإشعارات داخل التطبيق (الجرس،
> الصفحة، الشارة في القائمة) تعمل طبيعي، ويُعطَّل إشعار المتصفح فقط مع تحذير في الـ logs.

**لا توجد متغيرات بيئة أخرى جديدة.** `CRON_SECRET` و `DATABASE_URL` مضبوطة مسبقاً من مراحل سابقة.

---

## ⚙️ خطوات ما بعد النشر

1. إضافة متغيرات VAPID الثلاثة في Vercel ثم إعادة النشر (Redeploy) — المتغيرات
   `NEXT_PUBLIC_*` تُحقن وقت البناء ولن تظهر بدون إعادة نشر.
2. الـ migration تُطبَّق تلقائياً — أمر البناء هو
   `prisma generate && prisma migrate deploy && next build`.
3. اختبار سريع بعد النشر: فتح `/dashboard/settings` ← تبويب «الإشعارات» ← تفعيل إشعارات المتصفح ←
   إنشاء مهمة وإسنادها لمستخدم آخر والتأكد من وصول الإشعار.

---

## 🔭 نواقص معروفة (خارج نطاق المهام 1→9)

هذه الأنواع معرَّفة في الـ enum ولها أيقونات وألوان جاهزة، لكن **لا يوجد كود يُطلقها بعد**
لأنها تحتاج cron jobs مجدولة لم تُبنَ ضمن هذه المرحلة:

- `TASK_DUE_SOON` / `TASK_OVERDUE` — تذكير بالمهام قبل/بعد موعد الاستحقاق.
- `SESSION_TOMORROW` / `SESSION_REMINDER` — تذكير بجلسة الغد.
- `POA_EXPIRING` — تنبيه قرب انتهاء الوكالة.

المطلوب لإكمالها: إضافة `/api/cron/daily-reminders` ودالة فحص في `notification-service`،
ثم تسجيل الـ cron في `vercel.json`. لا يؤثر غيابها على أي وظيفة قائمة.

---

## ✅ نتيجة البناء

```
✓ Compiled successfully in 50s
✓ Finished TypeScript — بدون أخطاء
✓ Generating static pages (101/101)
```

Next.js 16.2.9 (Turbopack) — البناء ناجح بالكامل، لا أخطاء ولا تحذيرات TypeScript.
