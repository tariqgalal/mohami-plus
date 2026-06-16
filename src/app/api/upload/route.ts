import { NextRequest } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/tenant";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXT = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "svg",
]);

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

function sanitizeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-\u0600-\u06FF]+/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  try {
    await getCurrentUser();

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return apiError("لم يتم اختيار ملف", 400);
    }

    if (file.size === 0) {
      return apiError("الملف فارغ", 400);
    }
    if (file.size > MAX_SIZE) {
      return apiError("حجم الملف يتجاوز 10 ميجابايت", 413);
    }

    const originalName = sanitizeName(file.name || "file");
    const ext = (originalName.split(".").pop() ?? "").toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return apiError("نوع الملف غير مسموح. المسموح: PDF, DOCX, JPG, PNG", 415);
    }
    if (file.type && !ALLOWED_MIME.has(file.type)) {
      return apiError("نوع الملف (MIME) غير مسموح", 415);
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const folder = path.join(process.cwd(), "public", "uploads", `${yyyy}-${mm}`);
    await mkdir(folder, { recursive: true });

    const rand = randomBytes(8).toString("hex");
    const finalName = `${rand}-${originalName}`;
    const filePath = path.join(folder, finalName);

    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, bytes);

    const url = `/uploads/${yyyy}-${mm}/${finalName}`;
    return apiSuccess({
      url,
      name: originalName,
      size: file.size,
      type: ext,
      mime: file.type || null,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
