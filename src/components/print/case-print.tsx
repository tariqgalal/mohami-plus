import { formatCurrency, formatDate } from "@/lib/format";
import { CASE_TYPES } from "@/lib/constants";

interface PrintTenant {
  name: string;
  licenseNumber: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string;
  logo: string | null;
}

interface PrintClient {
  name: string;
  phone: string;
  email: string | null;
  city: string;
  address: string | null;
}

interface PrintOpponent {
  name: string;
  type: string | null;
  lawyer: string | null;
  phone: string | null;
  notes: string | null;
}

interface PrintLawyer {
  name: string;
  isPrimary: boolean;
}

interface PrintSession {
  id: string;
  date: Date | string;
  time: string;
  court: string;
  hall: string | null;
  sessionType: string;
  status: string;
  result: string | null;
}

interface PrintDocument {
  id: string;
  name: string;
  fileType: string;
  createdAt: Date | string;
}

interface PrintActivity {
  id: string;
  action: string;
  userName: string;
  createdAt: Date | string;
}

interface PrintInvoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number | string;
  paidAmount: number | string;
  status: string;
  dueDate: Date | string;
}

interface PrintCase {
  caseNumber: string;
  title: string;
  description: string | null;
  caseType: string;
  court: string;
  courtCity: string | null;
  status: string;
  priority: string;
  value: number | string | null;
  filingDate: Date | string | null;
  closingDate: Date | string | null;
  result: string | null;
  notes: string | null;
  createdAt: Date | string;
  lawyers: PrintLawyer[];
  opponents: PrintOpponent[];
  sessions: PrintSession[];
  documents: PrintDocument[];
  activities: PrintActivity[];
  invoices: PrintInvoice[];
}

interface CasePrintProps {
  tenant: PrintTenant;
  client: PrintClient;
  caseData: PrintCase;
}

export function CasePrint({ tenant, client, caseData }: CasePrintProps) {
  return (
    <div dir="rtl" className="case-print mx-auto bg-white text-slate-900 p-10 max-w-[800px] print:max-w-none print:p-8 font-arabic">
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body { background: white !important; }
          .case-print { box-shadow: none !important; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        .case-print { font-family: 'Tajawal','Cairo','IBM Plex Sans Arabic',system-ui,sans-serif; }
      `}</style>

      {/* Cover */}
      <header className="text-center pb-8 border-b-2 border-slate-300">
        {tenant.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tenant.logo}
            alt={tenant.name}
            className="h-20 mx-auto mb-4 object-contain"
          />
        ) : (
          <div className="text-2xl font-bold text-brand-700 mb-3">
            {tenant.name}
          </div>
        )}
        <p className="text-sm text-slate-600">{tenant.name}</p>
        {tenant.licenseNumber && (
          <p className="text-xs text-slate-500">
            رقم الترخيص: {tenant.licenseNumber}
          </p>
        )}
        <h1 className="text-3xl font-bold text-slate-900 mt-8">ملف القضية</h1>
        <p className="font-mono text-lg text-slate-700 mt-2">
          {caseData.caseNumber}
        </p>
        <p className="text-xl text-slate-800 mt-4">{caseData.title}</p>
        <p className="text-xs text-slate-500 mt-8">
          تاريخ الطباعة: {formatDate(new Date())}
        </p>
      </header>

      {/* Basic info */}
      <section className="mt-6">
        <h2 className="text-base font-semibold text-slate-900 mb-3 border-b border-slate-200 pb-2">
          المعلومات الأساسية
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <KV label="نوع القضية" value={(CASE_TYPES as Record<string, string>)[caseData.caseType] ?? caseData.caseType} />
          <KV label="الحالة" value={statusLabel(caseData.status)} />
          <KV label="الأولوية" value={priorityLabel(caseData.priority)} />
          <KV label="المحكمة المختصة" value={caseData.court} />
          <KV label="مدينة المحكمة" value={caseData.courtCity || "—"} />
          <KV
            label="قيمة القضية"
            value={caseData.value ? formatCurrency(caseData.value) : "—"}
          />
          <KV label="تاريخ رفع الدعوى" value={formatDate(caseData.filingDate)} />
          <KV label="تاريخ الإغلاق" value={formatDate(caseData.closingDate)} />
        </div>
      </section>

      {/* Client + Lawyers */}
      <section className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-2">
            الموكل
          </h2>
          <p className="font-medium">{client.name}</p>
          <p className="text-sm text-slate-600" dir="ltr">
            {client.phone}
          </p>
          {client.email && (
            <p className="text-sm text-slate-600">{client.email}</p>
          )}
          {client.address && (
            <p className="text-sm text-slate-600">{client.address}</p>
          )}
          <p className="text-sm text-slate-600">{client.city}</p>
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-2">
            المحامون
          </h2>
          <ul className="text-sm space-y-1">
            {caseData.lawyers.map((l, i) => (
              <li key={i}>
                {l.name}
                {l.isPrimary && (
                  <span className="text-xs text-brand-700 mr-2">
                    (الرئيسي)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Description */}
      {caseData.description && (
        <section className="mt-6">
          <h2 className="text-base font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-2">
            وصف القضية
          </h2>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-7">
            {caseData.description}
          </p>
        </section>
      )}

      {/* Opponents */}
      {caseData.opponents.length > 0 && (
        <section className="mt-6">
          <h2 className="text-base font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-2">
            الخصوم
          </h2>
          {caseData.opponents.map((o, i) => (
            <div
              key={i}
              className="text-sm border-b border-slate-100 last:border-0 py-2"
            >
              <p className="font-medium">
                {o.name}
                {o.type && (
                  <span className="text-xs text-slate-500 mr-2">({o.type})</span>
                )}
              </p>
              {o.lawyer && (
                <p className="text-slate-600">محامي الخصم: {o.lawyer}</p>
              )}
              {o.phone && (
                <p className="text-slate-600" dir="ltr">
                  {o.phone}
                </p>
              )}
              {o.notes && (
                <p className="text-xs text-slate-500 mt-1">{o.notes}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Sessions */}
      <section className="mt-6 page-break">
        <h2 className="text-base font-semibold text-slate-900 mb-3 border-b border-slate-200 pb-2">
          الجلسات ({caseData.sessions.length})
        </h2>
        {caseData.sessions.length === 0 ? (
          <p className="text-sm text-slate-500">لا توجد جلسات مسجلة.</p>
        ) : (
          <table className="w-full text-xs border border-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-right">
                <th className="px-2 py-2 border-b">التاريخ</th>
                <th className="px-2 py-2 border-b">الوقت</th>
                <th className="px-2 py-2 border-b">المحكمة</th>
                <th className="px-2 py-2 border-b">النوع</th>
                <th className="px-2 py-2 border-b">الحالة</th>
                <th className="px-2 py-2 border-b">النتيجة</th>
              </tr>
            </thead>
            <tbody>
              {caseData.sessions.map((s) => (
                <tr key={s.id} className="border-b border-slate-100">
                  <td className="px-2 py-2">{formatDate(s.date)}</td>
                  <td className="px-2 py-2" dir="ltr">
                    {s.time}
                  </td>
                  <td className="px-2 py-2">
                    {s.court}
                    {s.hall ? ` - ${s.hall}` : ""}
                  </td>
                  <td className="px-2 py-2">{s.sessionType}</td>
                  <td className="px-2 py-2">{s.status}</td>
                  <td className="px-2 py-2">{s.result || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Documents */}
      <section className="mt-6">
        <h2 className="text-base font-semibold text-slate-900 mb-3 border-b border-slate-200 pb-2">
          المستندات ({caseData.documents.length})
        </h2>
        {caseData.documents.length === 0 ? (
          <p className="text-sm text-slate-500">لا توجد مستندات.</p>
        ) : (
          <table className="w-full text-xs border border-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-right">
                <th className="px-2 py-2 border-b">اسم الملف</th>
                <th className="px-2 py-2 border-b">النوع</th>
                <th className="px-2 py-2 border-b">تاريخ الرفع</th>
              </tr>
            </thead>
            <tbody>
              {caseData.documents.map((d) => (
                <tr key={d.id} className="border-b border-slate-100">
                  <td className="px-2 py-2">{d.name}</td>
                  <td className="px-2 py-2">{d.fileType}</td>
                  <td className="px-2 py-2">{formatDate(d.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Activity log */}
      {caseData.activities.length > 0 && (
        <section className="mt-6">
          <h2 className="text-base font-semibold text-slate-900 mb-3 border-b border-slate-200 pb-2">
            سجل الأحداث
          </h2>
          <table className="w-full text-xs border border-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-right">
                <th className="px-2 py-2 border-b">التاريخ</th>
                <th className="px-2 py-2 border-b">الموظف</th>
                <th className="px-2 py-2 border-b">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {caseData.activities.map((a) => (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="px-2 py-2">{formatDate(a.createdAt)}</td>
                  <td className="px-2 py-2">{a.userName}</td>
                  <td className="px-2 py-2">{actionLabel(a.action)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Invoices */}
      {caseData.invoices.length > 0 && (
        <section className="mt-6">
          <h2 className="text-base font-semibold text-slate-900 mb-3 border-b border-slate-200 pb-2">
            الفواتير المرتبطة ({caseData.invoices.length})
          </h2>
          <table className="w-full text-xs border border-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-right">
                <th className="px-2 py-2 border-b">الرقم</th>
                <th className="px-2 py-2 border-b">الاستحقاق</th>
                <th className="px-2 py-2 border-b text-left">الإجمالي</th>
                <th className="px-2 py-2 border-b text-left">المدفوع</th>
                <th className="px-2 py-2 border-b">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {caseData.invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-100">
                  <td className="px-2 py-2 font-mono">{inv.invoiceNumber}</td>
                  <td className="px-2 py-2">{formatDate(inv.dueDate)}</td>
                  <td className="px-2 py-2 text-left tabular-nums">
                    {formatCurrency(inv.totalAmount)}
                  </td>
                  <td className="px-2 py-2 text-left tabular-nums">
                    {formatCurrency(inv.paidAmount)}
                  </td>
                  <td className="px-2 py-2">{inv.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Internal notes (only on private print) */}
      {caseData.notes && (
        <section className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded">
          <h3 className="text-sm font-semibold text-amber-900 mb-2">
            ملاحظات داخلية
          </h3>
          <p className="text-xs text-slate-700 whitespace-pre-wrap">
            {caseData.notes}
          </p>
        </section>
      )}

      <footer className="mt-10 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
        طُبع من نظام محامي بلس · {tenant.name}
      </footer>
    </div>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-900">{value || "—"}</p>
    </div>
  );
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    OPEN: "مفتوحة",
    IN_PROGRESS: "جارية",
    ON_HOLD: "معلقة",
    WON: "مكسوبة",
    LOST: "خاسرة",
    SETTLED: "تسوية",
    CLOSED: "مغلقة",
    APPEALED: "مستأنفة",
  };
  return map[status] ?? status;
}

function priorityLabel(priority: string): string {
  const map: Record<string, string> = {
    HIGH: "عالية",
    MEDIUM: "متوسطة",
    LOW: "منخفضة",
  };
  return map[priority] ?? priority;
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    created: "أنشأ القضية",
    updated: "حدّث بيانات القضية",
    deleted: "حذف القضية",
    viewed: "اطّلع على القضية",
    payment_recorded: "سجّل دفعة",
  };
  return map[action] ?? action;
}
