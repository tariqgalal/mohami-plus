/**
 * توليد مفاتيح VAPID لإشعارات الويب (Web Push).
 * يُشغَّل مرة واحدة فقط: npx tsx scripts/generate-vapid-keys.ts
 * ثم تُضاف المخرجات في .env و .env.local وفي Vercel → Environment Variables.
 */
import webPush from "web-push";

const vapidKeys = webPush.generateVAPIDKeys();

console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=" + vapidKeys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + vapidKeys.privateKey);
