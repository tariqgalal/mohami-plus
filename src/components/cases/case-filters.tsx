"use client";

import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/search-input";
import { CASE_STATUS, CASE_TYPES, PRIORITY_LABELS } from "@/lib/constants";
import { X } from "lucide-react";
import type { CaseFiltersInput } from "@/lib/validations/case";

interface CaseFiltersProps {
  value: Partial<CaseFiltersInput>;
  onChange: (next: Partial<CaseFiltersInput>) => void;
}

export function CaseFilters({ value, onChange }: CaseFiltersProps) {
  const hasFilters = !!(
    value.q ||
    value.status ||
    value.caseType ||
    value.priority
  );

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <SearchInput
        value={value.q ?? ""}
        onChange={(q) => onChange({ ...value, q, page: 1 })}
        placeholder="بحث برقم القضية أو العنوان أو العميل..."
        className="lg:max-w-md flex-1"
      />
      <div className="flex flex-wrap gap-2">
        <Select
          value={value.status ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              status: (e.target.value || undefined) as never,
              page: 1,
            })
          }
          className="w-auto min-w-36"
        >
          <option value="">كل الحالات</option>
          {Object.entries(CASE_STATUS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </Select>

        <Select
          value={value.caseType ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              caseType: (e.target.value || undefined) as never,
              page: 1,
            })
          }
          className="w-auto min-w-36"
        >
          <option value="">كل الأنواع</option>
          {Object.entries(CASE_TYPES).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </Select>

        <Select
          value={value.priority ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              priority: (e.target.value || undefined) as never,
              page: 1,
            })
          }
          className="w-auto min-w-32"
        >
          <option value="">كل الأولويات</option>
          {Object.entries(PRIORITY_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({ page: 1, limit: value.limit, sortBy: value.sortBy, sortDir: value.sortDir })
            }
          >
            <X className="size-4" />
            مسح
          </Button>
        )}
      </div>
    </div>
  );
}
