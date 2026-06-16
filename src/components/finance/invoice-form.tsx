"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { INVOICE_STATUS, VAT_RATE } from "@/lib/constants";
import {
  createInvoiceSchema,
  type CreateInvoiceInput,
} from "@/lib/validations/invoice";
import {
  useCreateInvoice,
  useUpdateInvoice,
} from "@/hooks/use-invoices";
import { useClients } from "@/hooks/use-clients";
import { formatCurrency } from "@/lib/format";
import { toast } from "@/store/toast-store";

interface CaseOption {
  id: string;
  caseNumber: string;
  title: string;
  clientId: string;
}

function useCaseOptions(clientId?: string) {
  return useQuery({
    queryKey: ["cases-options", clientId ?? "all"],
    queryFn: async () => {
      const q = clientId ? `?clientId=${clientId}&limit=100` : "?limit=100";
      const res = await fetch(`/api/cases${q}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      return json.data.items as CaseOption[];
    },
    enabled: !!clientId,
  });
}

interface InvoiceFormProps {
  initial?: Partial<CreateInvoiceInput> & { id?: string };
  mode: "create" | "edit";
}

export function InvoiceForm({ initial, mode }: InvoiceFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlClientId = searchParams.get("clientId");
  const urlCaseId = searchParams.get("caseId");

  const { data: clients } = useClients();
  const createMut = useCreateInvoice();
  const updateMut = useUpdateInvoice(initial?.id ?? "");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateInvoiceInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createInvoiceSchema) as any,
    defaultValues: {
      clientId: initial?.clientId ?? urlClientId ?? "",
      caseId: initial?.caseId ?? urlCaseId ?? "",
      description: initial?.description ?? "",
      amount: initial?.amount ?? 0,
      taxIncluded: initial?.taxIncluded ?? true,
      dueDate: initial?.dueDate,
      notes: initial?.notes ?? "",
      status: initial?.status ?? "DRAFT",
    },
  });

  const clientId = watch("clientId");
  const amount = Number(watch("amount") || 0);
  const taxIncluded = watch("taxIncluded");
  const { data: cases } = useCaseOptions(clientId);

  const tax = taxIncluded ? +(amount * VAT_RATE).toFixed(2) : 0;
  const total = +(amount + tax).toFixed(2);

  async function onSubmit(data: CreateInvoiceInput) {
    try {
      const payload = { ...data, caseId: data.caseId || null };
      if (mode === "create") {
        const created = await createMut.mutateAsync(payload);
        toast.success("تم إنشاء الفاتورة");
        router.push(`/dashboard/finance/invoices/${created.id}`);
      } else if (initial?.id) {
        await updateMut.mutateAsync(payload);
        toast.success("تم حفظ التعديلات");
        router.push(`/dashboard/finance/invoices/${initial.id}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "فشل حفظ الفاتورة";
      toast.error(msg);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>بيانات الفاتورة</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientId">العميل *</Label>
            <Select id="clientId" {...register("clientId")}>
              <option value="">— اختر العميل —</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {errors.clientId && (
              <p className="text-xs text-red-600">{errors.clientId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="caseId">القضية المرتبطة (اختياري)</Label>
            <Select id="caseId" {...register("caseId")} disabled={!clientId}>
              <option value="">— بدون قضية —</option>
              {cases?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} — {c.title}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="description">وصف الخدمة *</Label>
            <Input
              id="description"
              placeholder="مثال: أتعاب الاستشارة القانونية"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">المبلغ قبل الضريبة (ر.س) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min={0}
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-xs text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">تاريخ الاستحقاق *</Label>
            <Input id="dueDate" type="date" {...register("dueDate")} />
            {errors.dueDate && (
              <p className="text-xs text-red-600">
                {errors.dueDate.message?.toString()}
              </p>
            )}
          </div>

          {mode === "edit" && (
            <div className="space-y-2">
              <Label htmlFor="status">الحالة</Label>
              <Select id="status" {...register("status")}>
                {Object.entries(INVOICE_STATUS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox {...register("taxIncluded")} />
              <span className="text-slate-700">
                إضافة ضريبة القيمة المضافة (15%)
              </span>
            </label>
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ملخص المبالغ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">المبلغ الأساسي</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(amount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">
              ضريبة القيمة المضافة (15%)
            </span>
            <span className="font-medium tabular-nums">
              {formatCurrency(tax)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-base">
            <span className="font-semibold text-slate-900">الإجمالي</span>
            <span className="font-bold text-brand-700 tabular-nums">
              {formatCurrency(total)}
            </span>
          </div>
        </CardContent>
      </Card>

      {Object.keys(errors).length > 0 && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          <span>راجع الحقول المظللة بالأحمر</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 sticky bottom-0 bg-white/80 backdrop-blur p-4 -mx-6 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          إلغاء
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {mode === "create" ? "إنشاء الفاتورة" : "حفظ التعديلات"}
        </Button>
      </div>
    </form>
  );
}
