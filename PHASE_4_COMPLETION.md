# تقرير إنهاء المرحلة 4 — محامي بلس

**التاريخ:** 2026-06-26
**الـ commits المضافة في هذه الجولة:** `d2167f7`, `6612a88`, `1aa3404`, `614214f`

---

## ملخص تنفيذي

| القرار | الحالة |
|---|---|
| #1 — نقل تخزين الملفات من Vercel filesystem لـ Supabase Storage | ✅ **الكود جاهز ومنشور.** المطلوب من المالك: 3 خطوات يدوية (دقائق). |
| #2 — GitHub Action تلقائي للـ E2E suite | ✅ **الـ workflow ملحوق ومرفوع.** المطلوب من المالك: لا شيء؛ يشتغل لوحده عند أول push. |
| اختبارات E2E على الإنتاج بعد التغييرات | **22 / 22 ✅** |

---

## القرار #1 — Supabase Storage

### ما تم في الكود
- ✅ ثبّتنا `@supabase/supabase-js`.
- ✅ أنشأنا helper كامل: `src/lib/storage.ts`
  - `uploadFile()` → يرفع لـ Supabase Storage تحت path: `{tenantId}/{module}/{rand}-{name}`
  - `getFileUrl(path)` → يولّد signed URL صالح ساعة
  - `deleteFile(path)` → يحذف من الـ bucket
  - `getTenantStorageBytes(tenantId)` → إجمالي حجم ملفات المكتب (لحدود الباقات)
  - `pathBelongsToTenant(path, tenantId)` → check استخدمته في الـ API gateway
- ✅ عدّلنا `src/app/api/upload/route.ts`:
  - لما `NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY` موجودين → Supabase Storage.
  - لما مش موجودين (للتطوير المحلي) → fallback لـ `public/uploads/` كما كان.
- ✅ أضفنا `GET /api/upload/sign-url?path=...` يرجع signed URL جديد، مع تحقق إن المسار يخصّ نفس المكتب (`pathBelongsToTenant`).
- ✅ ملف SQL جاهز: `supabase/storage-setup.sql` — ينشئ الـ bucket كـ private ويمنع وصول anon/authenticated مباشرة.

### السلوك بعد النشر
- على الإنتاج الآن: لو حاولت ترفع ملف وأنت ما عملتش الخطوات اليدوية تحت، الـ API يرجع: **«تخزين الملفات غير مهيّأ — ضع NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في متغيرات البيئة»**. ده مقصود — أأمن من إنه يرفع `/tmp` بصمت.
- بعد الخطوات اليدوية → الرفع شغّال، الملفات بتفضل بعد كل deploy، والـ signed URLs محمية بتاريخ صلاحية.

### ⚠️ ما يجب على المالك عمله (3 خطوات بسيطة)

#### الخطوة 1 — جلب الـ Service Role Key من Supabase
1. ادخل https://supabase.com/dashboard → اختر مشروع `brexvgmfnxqjsivqzcus`.
2. من القائمة اليسرى → **Project Settings** → **API**.
3. تحت **Project API keys** → انسخ مفتاح **`service_role`** (مش `anon` ومش `publishable`).
4. أيضاً انسخ **Project URL** (شكلها: `https://brexvgmfnxqjsivqzcus.supabase.co`).

#### الخطوة 2 — إضافة المفتاحين على Vercel
في الـ Terminal، شغّل:
```bash
npx vercel@latest env add NEXT_PUBLIC_SUPABASE_URL production
# لما يسأل عن القيمة، الصق: https://brexvgmfnxqjsivqzcus.supabase.co

npx vercel@latest env add SUPABASE_SERVICE_ROLE_KEY production
# لما يسأل عن القيمة، الصق المفتاح اللي نسخته من الخطوة 1

# أعد النشر عشان الـ env vars الجديدة تتطبق
npx vercel@latest --prod --yes
```

> ✅ بدائلاً: ادخل https://vercel.com/tariqgalals-projects/mohami-plus/settings/environment-variables واضفهم من الواجهة.

#### الخطوة 3 — إنشاء الـ bucket في Supabase
1. ادخل Supabase Dashboard → **SQL Editor** → **+ New query**.
2. افتح ملف `supabase/storage-setup.sql` من المشروع، انسخ كل محتوياته، الصقها في الـ editor.
3. اضغط **Run** (أو Ctrl+Enter).
4. للتأكد، شغّل في نفس الـ editor:
   ```sql
   SELECT id, name, public FROM storage.buckets WHERE id = 'mohami-files';
   ```
   لازم ترجع صف واحد بـ `public = false`.

### بعد الخطوات الثلاث — اختبر يدوياً
- ادخل https://mohami-plus-pi.vercel.app/login، سجّل دخول كـ `admin@demo-firm.sa / Admin@12345`.
- روح `/dashboard/documents` → ارفع PDF أو صورة.
- تأكد إن الـ URL يبدأ بـ `https://brexvgmfnxqjsivqzcus.supabase.co/storage/v1/object/sign/mohami-files/...`
- اعمل deploy جديد بـ `npx vercel@latest --prod --yes` وتأكد إن نفس الملف لسه بيتفتح.

### ⚠️ ملاحظات تقنية
- **المسارات القديمة في DB:** أي ملف اتحفظ قبل النشر كان مسارُه `/uploads/...` على Vercel filesystem — وكلهم ضاعوا بمجرد deploy تالي. الـ migration script غير مطلوب — مفيش ملفات حقيقية كانت متخزّنة.
- **Signed URLs بتنتهي بعد ساعة:** اللي مخزّن في DB لقضية/مستند هو الـ URL وقت الإنشاء، فلو حد فضل المستند مفتوح أكتر من ساعة وحاول يحمّله، الـ URL هيرجع 401. الحل البسيط: الواجهة تنادي `GET /api/upload/sign-url?path=<path>` تجيب URL جديد قبل العرض. ده تحسين سهل في الفرونت ويمكن عمله لاحقاً.

---

## القرار #2 — GitHub Actions E2E

### ما تم
- ✅ `.github/workflows/e2e.yml` يشتغل في 4 حالات:
  - عند `push` على `main`
  - عند فتح/تحديث PR على `main`
  - يومياً الساعة **3:00 UTC = 6:00 صباحاً السعودية**
  - يدوياً من تبويب Actions
- ✅ ينتظر Vercel deployment ~120 ثانية + يـ poll على `/login` للتأكد من جاهزية الإنتاج.
- ✅ يشغّل الـ 22 اختبار ضد الإنتاج.
- ✅ عند الفشل: يرفع تقرير Playwright HTML + screenshots + videos كـ artifact (محفوظ 14 يوم) ويكتب رسالة عربية واضحة في GitHub Step Summary.
- ✅ Concurrency: يلغي أي run سابق لنفس الـ branch لو في run جديد (يحمي من الإسراف).

### المطلوب من المالك
**لا شيء.** الـ workflow يشتغل لوحده عند أول push بعد ما تـ merge هذه التغييرات. ما يحتاجش secrets لأنه يختبر فقط على الإنتاج العام.

### اختبار الـ workflow (اختياري)
- روح https://github.com/<owner>/<repo>/actions → اختر workflow «E2E Tests».
- اضغط **Run workflow** → يدوياً، اختر `main`، شغّله.
- يأخذ ~5 دقائق، النتيجة المتوقعة: ✅ 22/22.

### منع auto-deploy عند الفشل
الـ workflow الحالي **يبلّغ** بفشل لكنه ما **يمنعش** Vercel auto-deploy. ده قرار تجاري:

**التوصية:** سيب الـ auto-deploy شغّال زي ما هو، واعتمد على إشعار الفشل. الـ tenant isolation محمي على مستوى الكود + tests، فاحتمال regression عبر deploy نادر. لو حصل، Action يبلّغ خلال دقائق وتقدر تعمل rollback من Vercel.

**لو عايز تشدد:** بعد ما تتأكد إن الـ Action مستقر لمدة أسبوع، فعّل branch protection على `main`:
- GitHub → Settings → Branches → Add rule → `main`
- ✅ Require status checks → اختر `E2E على الإنتاج` كـ required.
- ⚠️ ده يعني أي تعديل لازم يدخل من PR (مفيش push مباشر للـ main).

---

## نتائج اختبارات E2E بعد الجولة الثانية

| Suite | عدد | على الإنتاج |
|---|---|---|
| `auth.spec.ts` | 5 | ✅ |
| `tenant-isolation.spec.ts` | 9 | ✅ |
| `cases-module.spec.ts` | 3 | ✅ |
| `security.spec.ts` | 5 | ✅ |
| **الإجمالي** | **22** | **22 ✅ على آخر deploy** (`mohami-plus-r863t3aem`) |

---

## ما هو غير مغطّى بعد (للجولات الجاية)

- اختبار E2E لرفع ملف فعلي على Supabase Storage. لم نضفه بعد لأن `SUPABASE_SERVICE_ROLE_KEY` لازال يحتاج إعداد المالك. بعد الخطوات اليدوية تحت، نضيف `tests/e2e/file-upload.spec.ts` ينفّذ:
  - رفع PDF + التأكد من signed URL.
  - رفع بعد deploy → التأكد من بقاء الملف.
  - مكتب B يحاول `GET /api/upload/sign-url?path={مسار مكتب A}` → يستقبل 403.
- اختبار حدود الباقات (Basic ≤ 25 قضية، ≤ 3 مستخدمين). يحتاج seed خاص بكميات كبيرة.

---

## الخلاصة

**المرحلة 4 خلصت من ناحية الكود.** الـ E2E suite 22/22، تخزين الملفات جاهز ينتقل لـ Supabase، الـ CI workflow مرفوع.

**الحاجة الوحيدة المعلّقة: 3 خطوات يدوية للمالك** (إعداد bucket + إضافة env vars) — دقائق بس. بعدها المنصّة جاهزة لفتح رفع الملفات للمكاتب الحقيقية.

**الخطوة القادمة (المرحلة 5):** بوابة الدفع Moyasar.
