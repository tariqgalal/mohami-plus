/* Service Worker — إشعارات محامي بلس */

self.addEventListener("install", function () {
  // فعّل النسخة الجديدة فوراً بدل انتظار إغلاق كل التبويبات
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", function (event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const options = {
    body: data.body || "إشعار جديد",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    dir: "rtl",
    lang: "ar",
    tag: data.tag || "default",
    data: {
      url: data.url || "/dashboard",
    },
    vibrate: [200, 100, 200],
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "محامي بلس", options),
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const url = (event.notification.data && event.notification.data.url) || "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        // لو الموقع مفتوح بالفعل — ركّز عليه وانتقل للصفحة
        for (const client of clientList) {
          if (client.url.includes("/dashboard") && "focus" in client) {
            client.focus();
            if ("navigate" in client) client.navigate(url);
            return;
          }
        }
        // غير مفتوح — افتح تبويب جديد
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});
