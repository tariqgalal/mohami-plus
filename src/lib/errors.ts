/**
 * أخطاء تطبيقية برسائل عربية جاهزة للعرض للمستخدم.
 *
 * السبب: `handleApiError` كان يرد "حدث خطأ غير متوقع" (500) على أي خطأ من
 * نوع Error عادي — بما فيها أخطاء مفهومة تماماً مثل "العميل غير موجود" أو
 * "فشل رفع الملف: Bucket not found". النتيجة إن المستخدم يشوف رسالة مبهمة
 * والمطوّر ما يعرفش السبب. الأصناف دي بتخلّي الخطأ يوصل للمستخدم برسالته
 * الحقيقية وبكود HTTP مناسب.
 */

/** خطأ متوقّع رسالته صالحة للعرض للمستخدم مباشرة. */
export class AppError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status = 400, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.details = details;
  }
}

/** سجل مطلوب غير موجود (أو لا يتبع مكتب المستخدم). */
export class NotFoundError extends AppError {
  constructor(message = "السجل غير موجود") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

/** فشل في خدمة خارجية (تخزين الملفات، البريد، بوابة الدفع...). */
export class ServiceUnavailableError extends AppError {
  constructor(message = "الخدمة غير متاحة حالياً", details?: unknown) {
    super(message, 503, details);
    this.name = "ServiceUnavailableError";
  }
}
