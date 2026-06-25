-- =====================================================================
-- إعداد bucket التخزين لملفات محامي بلس
-- المالك: شغّل ده مرّة واحدة في Supabase Dashboard → SQL Editor
-- =====================================================================
--
-- المعمارية:
-- - كل ملف يتخزّن تحت `mohami-files/{tenantId}/{module}/{rand}-{name}`
-- - عزل المكاتب بيتم على مستوى الـ API (الكود في src/lib/storage.ts و
--   src/app/api/upload/route.ts بيستخدم service_role key بتاع Supabase
--   ويتأكد قبل أي عملية إن المستخدم يتبع لنفس الـ tenantId)
-- - عملاء الواجهة ما عندهمش وصول مباشر للـ bucket؛ كل عمليات الرفع/
--   التحميل بتمر عبر الـ API ويتم توقيعها بـ signed URLs مؤقتة (1 ساعة)
--
-- ولذلك المطلوب هنا بسيط جداً:
-- 1. إنشاء الـ bucket كـ private
-- 2. حذف أي policies تسمح بوصول anonymous/authenticated مباشر للـ bucket
--    (الـ service_role دايماً بيتجاوز RLS فبيقدر يقرأ/يكتب)
-- =====================================================================

-- 1) إنشاء الـ bucket private
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mohami-files',
  'mohami-files',
  false,
  10485760,  -- 10 MB كحد أقصى للملف
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2) حذف أي policies قديمة على الـ bucket بنفس الأسماء (لو الـ SQL ده اشتغل قبل كده)
DROP POLICY IF EXISTS "mohami_files_block_anon_read" ON storage.objects;
DROP POLICY IF EXISTS "mohami_files_block_anon_write" ON storage.objects;
DROP POLICY IF EXISTS "mohami_files_block_anon_delete" ON storage.objects;

-- 3) منع أي وصول من anonymous أو authenticated مباشرة على الـ bucket
-- (service_role بيتجاوز RLS تلقائياً، فالـ API بتاع التطبيق فقط هو اللي
-- بيقدر يتعامل مع الملفات)

CREATE POLICY "mohami_files_block_anon_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id <> 'mohami-files');

CREATE POLICY "mohami_files_block_anon_write"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id <> 'mohami-files');

CREATE POLICY "mohami_files_block_anon_delete"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id <> 'mohami-files');

-- =====================================================================
-- تحقق سريع بعد التشغيل:
-- SELECT id, name, public FROM storage.buckets WHERE id = 'mohami-files';
-- المفروض ترجع صف واحد بـ public = false
-- =====================================================================
