"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Briefcase,
  Users,
  Gavel,
  UserCog,
  CornerDownLeft,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "case" | "client" | "session" | "team";
  title: string;
  subtitle?: string;
  href: string;
}

const TYPE_META: Record<
  SearchResult["type"],
  { icon: typeof Briefcase; label: string; color: string }
> = {
  case: { icon: Briefcase, label: "قضية", color: "text-blue-600 bg-blue-50" },
  client: { icon: Users, label: "عميل", color: "text-violet-600 bg-violet-50" },
  session: { icon: Gavel, label: "جلسة", color: "text-amber-600 bg-amber-50" },
  team: { icon: UserCog, label: "فريق", color: "text-emerald-600 bg-emerald-50" },
};

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Open with Cmd/Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (json.success) {
          setResults(json.data.results);
          setActiveIndex(0);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => window.clearTimeout(handle);
  }, [query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[activeIndex];
      if (r) go(r.href);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex w-full max-w-md items-center gap-2 h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 hover:bg-white hover:border-brand-300 transition-colors"
      >
        <Search className="size-4 text-slate-400" />
        <span className="flex-1 text-right">بحث في القضايا، العملاء، الجلسات...</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-500">
          Ctrl+K
        </kbd>
      </button>

      {/* Mobile search trigger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="بحث"
        className="md:hidden inline-flex items-center justify-center size-9 rounded-md text-slate-500 hover:bg-slate-100"
      >
        <Search className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 top-[10vh] mx-auto max-w-xl px-4 animate-in zoom-in-95 slide-in-from-top-2">
            <div className="rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-4 h-14 border-b border-slate-100">
                <Search className="size-5 text-slate-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onInputKeyDown}
                  placeholder="ابحث في كل النظام..."
                  className="flex-1 bg-transparent outline-none text-base text-slate-900 placeholder:text-slate-400"
                />
                {loading && (
                  <Loader2 className="size-4 text-slate-400 animate-spin" />
                )}
                <kbd className="text-[10px] font-mono bg-slate-100 rounded px-1.5 py-0.5 text-slate-500">
                  Esc
                </kbd>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {query.trim() === "" ? (
                  <div className="px-6 py-10 text-center text-sm text-slate-500">
                    <Search className="size-8 mx-auto mb-2 text-slate-300" />
                    اكتب للبحث في القضايا، العملاء، الجلسات، والفريق
                  </div>
                ) : results.length === 0 && !loading ? (
                  <div className="px-6 py-10 text-center text-sm text-slate-500">
                    لا توجد نتائج للبحث "{query}"
                  </div>
                ) : (
                  <ul className="p-2">
                    {results.map((r, i) => {
                      const meta = TYPE_META[r.type];
                      const Icon = meta.icon;
                      const active = i === activeIndex;
                      return (
                        <li key={`${r.type}-${r.id}`}>
                          <button
                            onMouseEnter={() => setActiveIndex(i)}
                            onClick={() => go(r.href)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-right transition-colors",
                              active ? "bg-brand-50" : "hover:bg-slate-50",
                            )}
                          >
                            <div
                              className={cn(
                                "size-9 rounded-lg grid place-items-center shrink-0",
                                meta.color,
                              )}
                            >
                              <Icon className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                  {r.title}
                                </p>
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                  {meta.label}
                                </span>
                              </div>
                              {r.subtitle && (
                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                  {r.subtitle}
                                </p>
                              )}
                            </div>
                            {active && (
                              <CornerDownLeft className="size-3.5 text-slate-400" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="border-t border-slate-100 px-4 py-2 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <kbd className="font-mono bg-white border border-slate-200 rounded px-1">↑↓</kbd>
                    تنقل
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="font-mono bg-white border border-slate-200 rounded px-1">Enter</kbd>
                    فتح
                  </span>
                </div>
                <span>محامي بلس · البحث</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
