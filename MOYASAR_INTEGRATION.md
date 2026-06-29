# تكامل بوابة الدفع Moyasar — محامي بلس

> هذا الملف هو دليلك أنت (مدير المنصة) للأمور اليدوية اللي محتاجة تتنفذ من خارج الكود.
> الكود نفسه جاهز ومتشغل في **Test Mode**.

---

## ١. ملخص ما تم تنفيذه

| المكون | المسار / الملف | الحالة |
|--------|----------------|--------|
| متغيرات بيئة Moyasar | `.env.example` | ✅ |
| موديلات قاعدة البيانات الجديدة | `prisma/schema.prisma` (Subscription, PlatformInvoice, WebhookEvent, PlatformInvoiceCounter) | ✅ |
| طبقة Moyasar الخدمية | `src/lib/moyasar.ts` (createPayment / verifyPayment / chargeToken / verifyWebhookPayload) | ✅ |
| طبقة الفوترة + الضريبة | `src/lib/billing.ts` (هللات + VAT 15% + رقم فاتورة MP-YYYY-NNNNNN) | ✅ |
| خدمة الاشتراكات | `src/services/subscription-service.ts` | ✅ |
| API checkout | `src/app/api/billing/checkout/route.ts` | ✅ |
| API verify (السيرفر) | `src/app/api/billing/verify/route.ts` | ✅ |
| API subscription state | `src/app/api/billing/subscription/route.ts` | ✅ |
| Webhook receiver | `src/app/api/webhooks/moyasar/route.ts` (idempotent) | ✅ |
| Cron مهام الفوترة | `src/app/api/cron/billing/route.ts` + `src/services/billing-cron-service.ts` | ✅ |
| `vercel.json` بجدول الـ Cron | الجذر | ✅ |
| واجهة العميل | `/dashboard/billing` + Moyasar.js inline + callback | ✅ |
| صفحة الدفع العامة (للفواتير اليدوية) | `/pay/[token]` | ✅ |
| Super Admin endpoint | `/api/admin/platform-billing` | ✅ |
| اختبارات Playwright | `tests/e2e/billing-moyasar.spec.ts` | ✅ |

---

## ٢. متغيرات البيئة (لازم تضبطها قبل التشغيل)

أضف هذه إلى `.env.local` (للتطوير) وإلى **Vercel → Settings → Environment Variables** (للنشر):

```env
# اختبار فقط — مفاتيح Test Mode من https://dashboard.moyasar.com → API Keys
MOYASAR_PUBLISHABLE_KEY_TEST=pk_test_xxxxxxxxxxxxxxxx
MOYASAR_SECRET_KEY_TEST=sk_test_xxxxxxxxxxxxxxxx

# الـ shared_secret اللي بتختاره أنت لما تنشئ الـ webhook في لوحة Moyasar
# Moyasar بترسله مع كل webhook في حقل secret_token داخل الـ JSON body
MOYASAR_WEBHOOK_SECRET=any-long-random-string-you-choose

# اتركها "false" لحد ما Moyasar تفعّل ميزة Tokenization على حسابك
MOYASAR_TOKENIZATION_ENABLED=false
```

**ملاحظات أمنية:**
- ✋ **ممنوع تماماً** كتابة هذه المفاتيح في الكود أو الـ commits.
- المفتاح `MOYASAR_SECRET_KEY_TEST` للسيرفر فقط — لا تحطه في أي ملف يتقرأ من المتصفح.
- لما تنتقل للإنتاج، أنشئ نسخ منفصلة باسم `_LIVE` (راجع قسم "الإنتاج" تحت).

---

## ٣. ما يجب أن تنفذه أنت بنفسك (Manual Steps)

### ٣.١ تطبيق الـ schema الجديد على قاعدة البيانات

من جهازك:

```bash
npm run db:push
```

سيضيف هذا الجداول والحقول الجديدة دون أي حذف لبيانات قائمة. **مفيش بيانات هتتمسح** — كل التغييرات إضافية.

### ٣.٢ الحصول على مفاتيح Test وحفظها

1. سجّل دخول على https://dashboard.moyasar.com
2. اذهب لـ **Settings → API Keys**
3. تأكد إنت في **Test Mode** (شريط أعلى الصفحة)
4. انسخ:
   - **Publishable Key (Test)** → `MOYASAR_PUBLISHABLE_KEY_TEST`
   - **Secret Key (Test)** → `MOYASAR_SECRET_KEY_TEST`

### ٣.٣ تسجيل الـ Webhook في لوحة Moyasar

1. في لوحة Moyasar اذهب لـ **Settings → Webhooks → Create Webhook**
2. **URL**: `https://YOUR_DOMAIN/api/webhooks/moyasar` (في التطوير المحلي استخدم ngrok أو vercel preview)
3. **HTTP Method**: POST
4. **Shared Secret**: اختر سلسلة عشوائية طويلة (≥ 32 محرف). نفس القيمة دي حطها في متغير `MOYASAR_WEBHOOK_SECRET`
5. **Events**: اختر:
   - `payment_paid`
   - `payment_failed`
   - `payment_refunded`
6. احفظ.

> **تذكير**: Moyasar بترسل الـ `shared_secret` كحقل JSON اسمه `secret_token` داخل جسم الـ webhook (وليس كـ header). الكود عندنا يقارن هذه القيمة بـ `MOYASAR_WEBHOOK_SECRET` بمقارنة timing-safe (راجع `src/lib/moyasar.ts → verifyWebhookPayload`).

### ٣.٤ متابعة طلب تفعيل Tokenization

- ابعت لـ Moyasar طلب بتفعيل **Tokenization** على حسابك (مطلوب للتجديد التلقائي AUTO_RENEW).
- لما يفعّلوها، غيّر `MOYASAR_TOKENIZATION_ENABLED` لـ `"true"` في Vercel وأعد النشر.
- بدون التفعيل، خيار "تجديد تلقائي" بيظهر للمستخدم كـ **"قريباً"** ومسار الفاتورة اليدوية وحده هو اللي يشتغل.

### ٣.٥ Vercel Cron (مطلوب Vercel Pro للإنتاج)

- خطة Vercel Hobby (المجانية) عندها قيود على الـ Cron. للإنتاج الحقيقي:
  - **إما** ترقّي لـ **Vercel Pro**
  - **أو** تستخدم scheduler خارجي (مثلاً cron-job.org أو GitHub Actions) ينادي:
    ```
    POST https://YOUR_DOMAIN/api/cron/billing
    Authorization: Bearer YOUR_CRON_SECRET
    ```
    يومياً الساعة 9 صباحاً بتوقيت السعودية.
- جدول الـ cron الحالي في `vercel.json`: يومياً 9:00 UTC.

### ٣.٦ التحويل من Test Mode إلى Production

**لا تنفّذ هذه الخطوة إلا بعد**:
- اختبار كامل في Test Mode (كل السيناريوهات في الجدول تحت ✅)
- إعداد المستندات القانونية (شروط الاستخدام، سياسة الخصوصية، استرجاع الأموال)
- التحقق من حساب البنك المرتبط بـ Moyasar
- التواصل مع صاحب المشروع للموافقة الصريحة

عند التحويل:
1. أنشئ مفاتيح Live في Moyasar.
2. أضف متغيرات بيئة جديدة (مثلاً `MOYASAR_PUBLISHABLE_KEY_LIVE`) في Vercel.
3. في الكود يحتاج تعديل بسيط لاختيار المفاتيح حسب `NODE_ENV` أو متغير `MOYASAR_MODE=live`.
4. أنشئ webhook منفصل لـ Live URL بـ shared_secret جديد.

---

## ٤. منطق الفوترة والضريبة (مهم تفهمه)

| الباقة | السعر الأساسي | الضريبة 15% | الإجمالي | بالهللة (يُرسل لـ Moyasar) |
|--------|---------------|--------------|----------|----------------------------|
| BASIC | 199.00 ر.س | 29.85 ر.س | 228.85 ر.س | **22885** |
| PROFESSIONAL | 499.00 ر.س | 74.85 ر.س | 573.85 ر.س | **57385** |
| ENTERPRISE | 999.00 ر.س | 149.85 ر.س | 1148.85 ر.س | **114885** |

- كل الحسابات بالهللات (integers) لتجنب أخطاء التقريب.
- الفاتورة عند العميل تعرض 3 أسطر: قبل الضريبة + الضريبة + الإجمالي (شرط ZATCA Phase 1).
- ZATCA Phase 2 (الفوترة الإلكترونية المنظومية) خارج نطاق هذه المرحلة، لكن البنية مهيأة للتوسعة.

---

## ٥. سياسة التجديد ومحاولات إعادة الدفع

- **التجربة المجانية**: 14 يوم، بدون كارت. تذكيرات قبل 3 أيام + يوم واحد. عند الانتهاء بدون دفع → `EXPIRED` + تقييد الوصول.
- **AUTO_RENEW**: 3 محاولات خصم — يوم 0 (الأصلي) ثم بعد 3 أيام ثم بعد 4 أيام إضافية = إجمالي **7 أيام فترة سماح**.
- **MANUAL**: فاتورة تُنشأ قبل نهاية الفترة بـ 3 أيام، تُرسل بإيميل + رابط `wa.me`. فترة السماح بعد الاستحقاق = 7 أيام.
- بعد انتهاء فترة السماح: Subscription → `EXPIRED` + Tenant → `SUSPENDED`.

---

## ٦. جدول نتائج الاختبارات

| السيناريو | الحالة | ملاحظات |
|------------|--------|----------|
| دفع ناجح بكارت اختبار creditcard | 🔲 يدوي | استخدم كرت اختبار من https://docs.moyasar.com/guides/card-payments/test-cards |
| دفع ناجح بـ مدى | 🔲 يدوي | |
| دفع فاشل (كارت اختبار للفشل) | 🔲 يدوي | رسالة خطأ عربية واضحة |
| تدفق 3D Secure | 🔲 يدوي | متاح في كروت الاختبار |
| حساب الضريبة (199→22885) | ✅ آلي | E2E test `billing-moyasar.spec.ts` |
| رقم فاتورة MP-YYYY-NNNNNN فريد | ✅ آلي | E2E + Prisma counter |
| رفض الـ webhook بـ secret خطأ | ✅ آلي | E2E test |
| Idempotency للـ webhook | ✅ آلي | E2E test (نفس event id) |
| عزل بين المكاتب (Subscription + PlatformInvoice) | ✅ آلي | E2E test |
| Tokenization معطّل → AUTO_RENEW يظهر "قريباً" | ✅ آلي | E2E test |
| AUTO_RENEW يدوياً (يحتاج Tokenization) | 🔲 يدوي | بعد تفعيل Moyasar للميزة |
| Cron يُنشئ فاتورة MANUAL ويرسلها | 🔲 يدوي | `curl POST /api/cron/billing` |
| انتهاء التجربة بدون دفع → EXPIRED + تقييد | 🔲 يدوي | اضبط `trialEndsAt` لتاريخ سابق ثم استدعِ الـ cron |

تشغيل الاختبارات الآلية:
```bash
npm run test:e2e -- billing-moyasar.spec.ts
```

---

## ٧. قرارات معتمدة (للرجوع لاحقاً)

- **الفترة التجريبية**: 14 يوم. *(مصدر: محادثة الاعتماد)*
- **فترة السماح بعد فشل الخصم**: 7 أيام، محاولات يوم 0/3/7. *(السبب: المكتب بيعتمد على النظام يومياً — عدم الإسراع في تعليق العملاء الدافعين)*
- **التحقق من الـ webhook**: مقارنة `secret_token` داخل JSON body بـ `MOYASAR_WEBHOOK_SECRET` (الطريقة الرسمية لـ Moyasar).
- **رقم الفاتورة**: `MP-YYYY-NNNNNN`، تسلسلي على مستوى المنصة، مخزّن في `PlatformInvoiceCounter`.
- **التجربة بدون كارت**: لا توجد بطاقة دفع مطلوبة عند التسجيل.
- **Resend**: graceful degradation — لو `RESEND_API_KEY` غير موجود، الإيميل بيتسجّل في الكونسول وما يفشلش الكود.
- **واتساب**: `wa.me/<phone>?text=<encoded>` (مش API رسمي) — كافي للمرحلة الحالية.

---

## ٨. قرارات تحتاج تدخل صاحب المشروع لاحقاً

- [ ] الموافقة على تحويل المفاتيح من Test إلى Live.
- [ ] الموافقة على ترقية Vercel لـ Pro (لتشغيل الـ Cron الإنتاجي) أو ترتيب scheduler خارجي.
- [ ] تأكيد طريقة تعريف الفاتورة لـ ZATCA Phase 2 (لما تكون مطلوبة قانونياً للحجم الحالي).
- [ ] صياغة قوالب الإيميلات (الحالية أساسية — قد تحتاج لمسة تسويقية).

---

*آخر تحديث: يونيو 2026*
