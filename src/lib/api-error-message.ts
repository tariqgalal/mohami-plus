/**
 * يبني رسالة خطأ مفهومة من رد الـ API لعرضها في الـ toast.
 *
 * ردود التحقق (422) بترجع `error: "بيانات غير صحيحة"` مع `details` فيها
 * أخطاء كل حقل. من غير الـ details المستخدم بيشوف رسالة عامة ما تقولش
 * إيه الحقل الناقص، فبنضم أول رسائل الحقول للرسالة الأساسية.
 */
export function apiErrorMessage(json: {
  error?: string;
  details?: unknown;
}): string {
  const base = json.error || "حدث خطأ";

  const details = json.details;
  if (details && typeof details === "object" && !Array.isArray(details)) {
    const messages: string[] = [];
    for (const value of Object.values(details as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        for (const m of value) if (typeof m === "string") messages.push(m);
      } else if (typeof value === "string") {
        messages.push(value);
      }
    }
    // نعرض حتى 3 رسائل حتى لا يطول الـ toast
    if (messages.length) {
      const shown = messages.slice(0, 3).join("، ");
      const more = messages.length > 3 ? ` (+${messages.length - 3})` : "";
      return `${base}: ${shown}${more}`;
    }
  }

  return base;
}
