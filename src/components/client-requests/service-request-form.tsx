"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  REQUEST_SOURCE,
  SERVICE_REQUEST_STATUS,
  SERVICE_REQUEST_TYPES,
  SERVICE_REQUEST_SUBTYPES,
} from "@/lib/constants";
import { createServiceRequestSchema } from "@/lib/validations/client-service-request";
import { useTeam } from "@/hooks/use-team";
import {
  useCreateServiceRequest,
  useUpdateServiceRequest,
} from "@/hooks/use-client-requests";
import { toast } from "@/store/toast-store";

interface ServiceRequestInitial {
  id?: string;
  source?: string;
  requestType?: string;
  requestSubType?: string | null;
  description?: string;
  applicantName?: string;
  applicantPhone?: string | null;
  applicantEmail?: string | null;
  status?: string;
  assignedTo?: string | null;
  notes?: string | null;
}

interface ServiceRequestFormValues {
  source: string;
  requestType: string;
  requestSubType: string;
  description: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  status: string;
  assignedTo: string;
  notes: string;
}

interface ServiceRequestFormProps {
  initial?: ServiceRequestInitial;
  mode: "create" | "edit";
}

export function ServiceRequestForm({ initial, mode }: ServiceRequestFormProps) {
  const router = useRouter();
  const { data: team } = useTeam();
  const createMut = useCreateServiceRequest();
  const updateMut = useUpdateServiceRequest(initial?.id ?? "");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ServiceRequestFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createServiceRequestSchema) as any,
    defaultValues: {
      source: initial?.source ?? "CLIENT",
      requestType: initial?.requestType ?? SERVICE_REQUEST_TYPES[0],
      requestSubType: initial?.requestSubType ?? "",
      description: initial?.description ?? "",
      applicantName: initial?.applicantName ?? "",
      applicantPhone: initial?.applicantPhone ?? "",
      applicantEmail: initial?.applicantEmail ?? "",
      status: initial?.status ?? "NEW",
      assignedTo: initial?.assignedTo ?? "",
      notes: initial?.notes ?? "",
    },
  });

  const requestType = watch("requestType");
  const subTypes = SERVICE_REQUEST_SUBTYPES[requestType] ?? [];

  async function onSubmit(data: ServiceRequestFormValues) {
    try {
      const payload = {
        ...data,
        requestSubType: data.requestSubType || null,
        applicantPhone: data.applicantPhone || null,
        applicantEmail: data.applicantEmail || null,
        assignedTo: data.assignedTo || null,
        notes: data.notes || null,
      };
      if (mode === "create") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createMut.mutateAsync(payload as any);
        toast.success("تم إضافة الطلب بنجاح");
        router.push(`/dashboard/client-requests`);
      } else if (initial?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await updateMut.mutateAsync(payload as any);
        toast.success("تم حفظ التعديلات");
        router.push(`/dashboard/client-requests`);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "فشل حفظ الطلب");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>بيانات الطلب</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="source">مصدر الطلب *</Label>
            <Select id="source" {...register("source")}>
              {Object.entries(REQUEST_SOURCE).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestType">نوع الطلب *</Label>
            <Select id="requestType" {...register("requestType")}>
              {SERVICE_REQUEST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            {errors.requestType && (
              <p className="text-xs text-red-600">
                {errors.requestType.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestSubType">النوع الفرعي</Label>
            <Select
              id="requestSubType"
              {...register("requestSubType")}
              disabled={subTypes.length === 0}
            >
              <option value="">— اختر —</option>
              {subTypes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicantName">اسم مقدم الطلب *</Label>
            <Input
              id="applicantName"
              placeholder="اسم مقدم الطلب"
              {...register("applicantName")}
            />
            {errors.applicantName && (
              <p className="text-xs text-red-600">
                {errors.applicantName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicantPhone">رقم الجوال</Label>
            <Input
              id="applicantPhone"
              placeholder="05xxxxxxxx"
              {...register("applicantPhone")}
            />
            {errors.applicantPhone && (
              <p className="text-xs text-red-600">
                {errors.applicantPhone.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicantEmail">البريد الإلكتروني</Label>
            <Input
              id="applicantEmail"
              type="email"
              placeholder="name@example.com"
              {...register("applicantEmail")}
            />
            {errors.applicantEmail && (
              <p className="text-xs text-red-600">
                {errors.applicantEmail.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">الحالة</Label>
            <Select id="status" {...register("status")}>
              {Object.entries(SERVICE_REQUEST_STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">المكلَّف</Label>
            <Select id="assignedTo" {...register("assignedTo")}>
              <option value="">— غير محدد —</option>
              {team?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="description">وصف الطلب *</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="اكتب تفاصيل الطلب..."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="أي ملاحظات إضافية..."
              {...register("notes")}
            />
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
          {mode === "create" ? "إضافة الطلب" : "حفظ التعديلات"}
        </Button>
      </div>
    </form>
  );
}
