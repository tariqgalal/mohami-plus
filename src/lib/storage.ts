import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const STORAGE_BUCKET = "mohami-files";

// التوقيت الافتراضي لصلاحية الرابط الموقَّع (ساعة واحدة)
const DEFAULT_SIGNED_URL_TTL_SEC = 60 * 60;

let cachedClient: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      "تخزين الملفات غير مهيّأ — ضع NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في متغيرات البيئة",
    );
  }
  if (!cachedClient) {
    cachedClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cachedClient;
}

export function isStorageConfigured(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

export type StorageModule =
  | "cases"
  | "documents"
  | "clients"
  | "sessions"
  | "meetings"
  | "team"
  | "invoices"
  | "settings"
  | "misc";

function sanitizeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-\u0600-\u06FF]+/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 80);
}

function buildPath(
  tenantId: string,
  module: StorageModule,
  originalName: string,
): string {
  const safe = sanitizeName(originalName) || "file";
  const rand = randomBytes(8).toString("hex");
  return `${tenantId}/${module}/${rand}-${safe}`;
}

export interface UploadResult {
  /** المسار الكامل داخل البكت (مثلاً `tenantId/module/abc-file.pdf`). يُخزَّن في DB. */
  path: string;
  /** رابط موقَّع جاهز للعرض الفوري (ينتهي بعد ساعة افتراضياً). */
  signedUrl: string;
  /** الحجم بالبايت. */
  size: number;
  /** نوع الـ MIME. */
  contentType: string | null;
}

export async function uploadFile(opts: {
  tenantId: string;
  module: StorageModule;
  file: File;
}): Promise<UploadResult> {
  const supabase = getClient();
  const path = buildPath(opts.tenantId, opts.module, opts.file.name);

  const bytes = new Uint8Array(await opts.file.arrayBuffer());
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, bytes, {
      contentType: opts.file.type || undefined,
      upsert: false,
    });
  if (error) throw new Error(`فشل رفع الملف: ${error.message}`);

  const { data, error: urlError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, DEFAULT_SIGNED_URL_TTL_SEC);
  if (urlError || !data?.signedUrl) {
    throw new Error(`فشل توليد رابط الملف: ${urlError?.message ?? "unknown"}`);
  }

  return {
    path,
    signedUrl: data.signedUrl,
    size: opts.file.size,
    contentType: opts.file.type || null,
  };
}

/** يرجع signed URL جديد لمسار محفوظ سابقاً. استخدمه عند العرض. */
export async function getFileUrl(
  path: string,
  ttlSeconds = DEFAULT_SIGNED_URL_TTL_SEC,
): Promise<string> {
  const supabase = getClient();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, ttlSeconds);
  if (error || !data?.signedUrl) {
    throw new Error(`فشل توليد رابط الملف: ${error?.message ?? "unknown"}`);
  }
  return data.signedUrl;
}

export async function deleteFile(path: string): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path]);
  if (error) throw new Error(`فشل حذف الملف: ${error.message}`);
}

/** إجمالي حجم ملفات المكتب بالبايت — للتحقق من حدود الباقة. */
export async function getTenantStorageBytes(tenantId: string): Promise<number> {
  const supabase = getClient();
  let total = 0;
  let offset = 0;
  const pageSize = 100;

  // نمشي على الأقسام الفرعية كلها داخل folder الـ tenant
  const modules: StorageModule[] = [
    "cases",
    "documents",
    "clients",
    "sessions",
    "meetings",
    "team",
    "invoices",
    "settings",
    "misc",
  ];

  for (const m of modules) {
    offset = 0;
    while (true) {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(`${tenantId}/${m}`, {
          limit: pageSize,
          offset,
        });
      if (error || !data || data.length === 0) break;
      for (const f of data) {
        const size = (f.metadata as { size?: number } | null)?.size ?? 0;
        total += size;
      }
      if (data.length < pageSize) break;
      offset += pageSize;
    }
  }
  return total;
}

/** يتحقق إن مسار ما يتبع لمكتب معيّن (حماية API gateway). */
export function pathBelongsToTenant(path: string, tenantId: string): boolean {
  return path.startsWith(`${tenantId}/`);
}
