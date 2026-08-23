import Link from "next/link";
import { notFound } from "next/navigation";
import { Reply, FileText, Eye, Send, Inbox } from "lucide-react";
import {
  getCorrespondence,
  markCorrespondenceViewed,
  type ViewedByEntry,
} from "@/services/correspondence-service";
import { getTenantId, getCurrentUser } from "@/lib/tenant";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DualDateDisplay } from "@/components/shared/dual-date-display";
import {
  CorrespondenceCategoryBadge,
  CorrespondenceDirectionBadge,
} from "@/components/correspondence/correspondence-badges";
import { CORRESPONDENCE_TYPE } from "@/lib/constants";

interface PageProps {
  params: Promise<{ id: string }>;
}

type Attachment = { url: string; name: string; size?: number; type?: string };

function AttachmentList({ attachments }: { attachments: Attachment[] }) {
  if (attachments.length === 0) return null;
  return (
    <ul className="space-y-2">
      {attachments.map((a, i) => (
        <li
          key={`${a.url}-${i}`}
          className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-2"
        >
          <FileText className="size-4 text-slate-500 shrink-0" />
          <a
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className="flex-1 truncate text-sm text-slate-700 hover:underline"
          >
            {a.name}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default async function CorrespondenceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const user = await getCurrentUser();

  // سجّل المشاهدة قبل الجلب النهائي حتى تظهر ضمن "تمت مشاهدتها بواسطة"
  await markCorrespondenceViewed(
    tenantId,
    user.id,
    user.name ?? "مستخدم",
    id,
  );

  const item = await getCorrespondence(tenantId, id);
  if (!item) notFound();

  const recipientNames = Array.isArray(item.recipientNames)
    ? (item.recipientNames as string[])
    : [];
  const viewedBy = Array.isArray(item.viewedBy)
    ? (item.viewedBy as unknown as ViewedByEntry[])
    : [];
  const attachments = Array.isArray(item.attachments)
    ? (item.attachments as unknown as Attachment[])
    : [];

  const listHref =
    item.type === "EMPLOYEE"
      ? "/dashboard/correspondence/employees"
      : "/dashboard/correspondence/clients";
  const listLabel =
    item.type === "EMPLOYEE" ? "مراسلات الموظفين" : "مراسلات العملاء";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "لوحة التحكم", href: "/dashboard" },
          { label: listLabel, href: listHref },
          { label: `مراسلة #${item.serialNumber}` },
        ]}
      />

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm text-slate-400">
              #{item.serialNumber}
            </span>
            <CorrespondenceCategoryBadge category={item.category} />
            <CorrespondenceDirectionBadge direction={item.direction} />
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              {item.direction === "INCOMING" ? (
                <Inbox className="size-3.5" />
              ) : (
                <Send className="size-3.5" />
              )}
              {(CORRESPONDENCE_TYPE as Record<string, string>)[item.type]}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{item.subject}</h1>
        </div>
        <Link href={`/dashboard/correspondence/${item.id}/reply`}>
          <Button>
            <Reply className="size-4" />
            إضافة رد
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">المرسل</p>
              <p className="text-sm font-medium text-slate-900">
                {item.senderName}
              </p>
            </div>
            <div className="text-left">
              <p className="text-xs text-slate-500 mb-1">تاريخ الإرسال</p>
              <DualDateDisplay date={item.date} />
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-2">إلى:</p>
            <div className="flex flex-wrap gap-2">
              {recipientNames.length > 0 ? (
                recipientNames.map((name, i) => (
                  <span
                    key={`${name}-${i}`}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                  >
                    {name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-400">—</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-2">المحتوى</p>
            <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {item.body}
            </p>
          </div>

          {attachments.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">
                المرفقات ({attachments.length})
              </p>
              <AttachmentList attachments={attachments} />
            </div>
          )}

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
              <Eye className="size-3.5" />
              تمت مشاهدتها بواسطة:
            </p>
            {viewedBy.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {viewedBy.map((v) => (
                  <span
                    key={v.id}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
                  >
                    {v.name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-sm text-slate-400">لم يشاهدها أحد بعد</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* thread الردود */}
      {item.replies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>الردود ({item.replies.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {item.replies.map((reply) => {
              const replyAttachments = Array.isArray(reply.attachments)
                ? (reply.attachments as unknown as Attachment[])
                : [];
              return (
                <div
                  key={reply.id}
                  className="rounded-lg border border-slate-200 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {reply.senderName}
                    </p>
                    <DualDateDisplay date={reply.date} />
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {reply.body}
                  </p>
                  {replyAttachments.length > 0 && (
                    <AttachmentList attachments={replyAttachments} />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
