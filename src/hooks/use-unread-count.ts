"use client";

import { useCallback, useEffect, useState } from "react";

/** فاصل تحديث عدّاد غير المقروء */
const POLL_MS = 30_000;

/**
 * عدّاد الإشعارات غير المقروءة.
 * `enabled: false` يوقف الجلب تماماً — تُستخدم في القوائم المخفية
 * (قائمة الموبايل مثلاً) حتى لا تعمل دورة polling بلا داعٍ.
 */
export function useUnreadCount({ enabled = true }: { enabled?: boolean } = {}) {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count", {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success) setCount(json.data.count);
    } catch {
      // تجاهل — تُعاد المحاولة في الدورة التالية
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void fetchCount();
    const id = window.setInterval(fetchCount, POLL_MS);
    return () => window.clearInterval(id);
  }, [enabled, fetchCount]);

  return count;
}
