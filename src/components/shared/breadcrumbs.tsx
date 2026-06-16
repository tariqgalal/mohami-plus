import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-slate-500">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-slate-900">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-slate-900 font-medium" : ""}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronLeft className="size-3.5 mx-1 text-slate-400" />}
          </span>
        );
      })}
    </nav>
  );
}
