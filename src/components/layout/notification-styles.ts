import {
  Bell,
  Briefcase,
  Gavel,
  Wallet,
  Mail,
  ClipboardList,
  ShieldCheck,
  CalendarDays,
  Palmtree,
  MessageSquareText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

export interface NotificationStyle {
  icon: typeof Bell;
  color: string;
  label: string;
}

/** أيقونة + لون + تسمية عربية لكل نوع إشعار */
export const NOTIFICATION_STYLES: Record<string, NotificationStyle> = {
  TASK_ASSIGNED: {
    icon: ClipboardList,
    color: "bg-blue-50 text-blue-600",
    label: "مهمة جديدة",
  },
  TASK_DUE_SOON: {
    icon: ClipboardList,
    color: "bg-amber-50 text-amber-600",
    label: "مهمة قريبة",
  },
  TASK_OVERDUE: {
    icon: AlertTriangle,
    color: "bg-rose-50 text-rose-600",
    label: "مهمة متأخرة",
  },
  TASK_COMPLETED: {
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-600",
    label: "مهمة مكتملة",
  },
  SESSION_REMINDER: {
    icon: Gavel,
    color: "bg-amber-50 text-amber-600",
    label: "تذكير جلسة",
  },
  SESSION_TOMORROW: {
    icon: Gavel,
    color: "bg-amber-50 text-amber-600",
    label: "جلسة غداً",
  },
  SESSION_CREATED: {
    icon: Gavel,
    color: "bg-amber-50 text-amber-600",
    label: "جلسة جديدة",
  },
  CASE_ASSIGNED: {
    icon: Briefcase,
    color: "bg-blue-50 text-blue-600",
    label: "قضية جديدة",
  },
  CASE_STATUS_CHANGED: {
    icon: Briefcase,
    color: "bg-violet-50 text-violet-600",
    label: "تحديث قضية",
  },
  INVOICE_CREATED: {
    icon: Wallet,
    color: "bg-emerald-50 text-emerald-600",
    label: "فاتورة جديدة",
  },
  INVOICE_DUE: {
    icon: Wallet,
    color: "bg-rose-50 text-rose-600",
    label: "فاتورة مستحقة",
  },
  MESSAGE_RECEIVED: {
    icon: Mail,
    color: "bg-sky-50 text-sky-600",
    label: "رسالة داخلية",
  },
  POA_EXPIRING: {
    icon: ShieldCheck,
    color: "bg-amber-50 text-amber-600",
    label: "وكالة تنتهي قريباً",
  },
  LEAVE_REQUEST: {
    icon: Palmtree,
    color: "bg-teal-50 text-teal-600",
    label: "طلب إجازة",
  },
  LEAVE_APPROVED: {
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-600",
    label: "إجازة مقبولة",
  },
  LEAVE_REJECTED: {
    icon: AlertTriangle,
    color: "bg-rose-50 text-rose-600",
    label: "إجازة مرفوضة",
  },
  CONSULTATION_NEW: {
    icon: MessageSquareText,
    color: "bg-indigo-50 text-indigo-600",
    label: "استشارة جديدة",
  },
  MEETING_REMINDER: {
    icon: CalendarDays,
    color: "bg-purple-50 text-purple-600",
    label: "اجتماع",
  },
  GENERAL: {
    icon: Sparkles,
    color: "bg-slate-50 text-slate-600",
    label: "عام",
  },
};

export function notificationStyle(type: string): NotificationStyle {
  return NOTIFICATION_STYLES[type] ?? NOTIFICATION_STYLES.GENERAL;
}
