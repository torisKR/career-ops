"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ChevronsUpDown,
  X,
  Compass,
  ArrowRight,
  LayoutList,
  LayoutGrid,
  Kanban,
  FileText,
  ExternalLink,
  Sparkles,
  Inbox,
  Send,
  MessageSquare,
  Users,
  Award,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import type { Application, InboxJob } from "@/lib/career-ops";
import { Badge } from "@/components/ui/badge";
import { CompanyLogo } from "@/components/company-logo";
import { StatusSelect } from "@/components/status-select";
import { canonStatus, scoreNum, scoreTone, statusDot } from "@/lib/format";
import { InboxTriage } from "@/components/inbox/inbox-triage";
import { cn } from "@/lib/cn";
import { companyPresentation, companySearchText } from "@/lib/company-presentation.mjs";
import { useI18n } from "@/components/language-provider";
import { TAB_TRANSLATION_KEYS, COL_TRANSLATION_KEYS } from "@/lib/i18n";
import { KanbanBoard } from "@/components/pipeline/kanban-board";
import { QuickDetailDrawer } from "@/components/pipeline/quick-detail-drawer";

// INBOX (the triage queue) is the default tab; the rest filter the tracker.
const TABS = [
  "INBOX",
  "ALL",
  "EVALUATED",
  "APPLIED",
  "RESPONDED",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
  "DISCARDED",
  "SKIP",
] as const;
type Tab = (typeof TABS)[number];

const SORT_KEYS = ["company", "role", "score", "status", "date"] as const;
type SortKey = (typeof SORT_KEYS)[number];

type ViewMode = "table" | "cards" | "kanban";

export function PipelineView({
  applications,
  inbox,
}: {
  applications: Application[];
  inbox: InboxJob[];
}) {
  const { t } = useI18n();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selected application for quick detail slide-over drawer
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // View mode: table, cards, or kanban (persisted locally)
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("career-ops:pipeline-view-mode") as ViewMode | null;
      if (saved === "table" || saved === "cards" || saved === "kanban") {
        setViewMode(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem("career-ops:pipeline-view-mode", mode);
    } catch {
      /* ignore */
    }
  };

  // Keyboard shortcut: '/' focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // The URL is the SINGLE source of truth for tab/min/sort/dir
  const pTab = (params.get("tab") ?? "").toUpperCase();
  const tab: Tab = (TABS as readonly string[]).includes(pTab) ? (pTab as Tab) : "INBOX";
  const pMin = parseFloat(params.get("min") ?? "");
  const minFilter: number | null = Number.isFinite(pMin) ? pMin : null;
  const pSort = params.get("sort") ?? "";
  const sortKey: SortKey = (SORT_KEYS as readonly string[]).includes(pSort) ? (pSort as SortKey) : "score";
  const sort = { key: sortKey, dir: (params.get("dir") === "1" ? 1 : -1) as 1 | -1 };

  // Search local state
  const [q, setQ] = useState(params.get("q") ?? "");
  const lastUrlQ = useRef(params.get("q") ?? "");
  useEffect(() => {
    const urlQ = params.get("q") ?? "";
    if (urlQ !== lastUrlQ.current) {
      lastUrlQ.current = urlQ;
      setQ(urlQ);
    }
  }, [params]);

  const setParams = useCallback(
    (updates: Record<string, string | number | null>) => {
      const sp = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v == null || v === "") sp.delete(k);
        else sp.set(k, String(v));
      }
      const qs = sp.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [params, router, pathname],
  );

  // Pending inbox jobs
  const pendingInbox = useMemo(() => {
    const seen = new Set<string>();
    const out: InboxJob[] = [];
    for (const j of inbox) {
      if (j.done || seen.has(j.url)) continue;
      seen.add(j.url);
      out.push(j);
    }
    return out;
  }, [inbox]);

  // Stage summary counts for the visual pipeline funnel
  const stageCounts = useMemo(() => {
    let evaluated = 0;
    let applied = 0;
    let responded = 0;
    let interview = 0;
    let offer = 0;

    for (const app of applications) {
      const c = canonStatus(app.status);
      if (c.includes("EVALUATED")) evaluated++;
      if (c.includes("APPLIED")) applied++;
      if (c.includes("RESPONDED")) responded++;
      if (c.includes("INTERVIEW")) interview++;
      if (c.includes("OFFER") || c.includes("HIRED")) offer++;
    }

    return {
      inbox: pendingInbox.length,
      evaluated,
      applied,
      responded,
      interview,
      offer,
    };
  }, [applications, pendingInbox]);

  // Conversion calculations between funnel steps
  const conversions = useMemo(() => {
    const calcRate = (numerator: number, denominator: number) => {
      if (denominator <= 0) return null;
      const rate = Math.round((numerator / denominator) * 100);
      return `${rate}%`;
    };

    return {
      evalToApplied: calcRate(stageCounts.applied, stageCounts.evaluated + stageCounts.applied),
      appliedToResp: calcRate(stageCounts.responded, stageCounts.applied),
      respToInterview: calcRate(stageCounts.interview, stageCounts.responded),
      interviewToOffer: calcRate(stageCounts.offer, stageCounts.interview),
    };
  }, [stageCounts]);

  const filtered = useMemo(() => {
    if (tab === "INBOX") return [];
    let rows = applications;
    if (tab !== "ALL") rows = rows.filter((r) => canonStatus(r.status).includes(tab));
    if (minFilter != null) {
      rows = rows.filter((r) => {
        const n = scoreNum(r.score);
        return !Number.isNaN(n) && n >= minFilter;
      });
    }
    if (q.trim()) {
      const needle = q.toLowerCase();
      rows = rows.filter((r) => companySearchText(r).toLowerCase().includes(needle));
    }
    return [...rows].sort((a, b) => {
      if (sort.key === "score") {
        const an = scoreNum(a.score);
        const bn = scoreNum(b.score);
        const av = Number.isNaN(an) ? -Infinity : an;
        const bv = Number.isNaN(bn) ? -Infinity : bn;
        return (av - bv) * sort.dir;
      }
      const aValue = sort.key === "company" ? companyPresentation(a).label : a[sort.key] || "";
      const bValue = sort.key === "company" ? companyPresentation(b).label : b[sort.key] || "";
      return aValue.localeCompare(bValue) * sort.dir;
    });
  }, [applications, tab, q, sort, minFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 max-sm:pb-24">
      {/* ── Top Header & Stats ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-landing sm:text-3xl">
            {t("pipeline_title")}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t("pipeline_subtitle", { inbox: pendingInbox.length, tracked: applications.length })}
          </p>
        </div>

        {/* View Switcher & Search Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {tab !== "INBOX" && (
            <div className="flex items-center rounded-xl border border-border bg-surface/80 p-0.5 shadow-xs backdrop-blur-xs">
              <button
                type="button"
                onClick={() => changeViewMode("table")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-150",
                  viewMode === "table"
                    ? "bg-brand text-brand-foreground shadow-xs"
                    : "text-muted hover:text-foreground",
                )}
                title={t("view_table")}
              >
                <LayoutList className="size-3.5" />
                <span className="hidden sm:inline">{t("view_table")}</span>
              </button>
              <button
                type="button"
                onClick={() => changeViewMode("cards")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-150",
                  viewMode === "cards"
                    ? "bg-brand text-brand-foreground shadow-xs"
                    : "text-muted hover:text-foreground",
                )}
                title={t("view_grid")}
              >
                <LayoutGrid className="size-3.5" />
                <span className="hidden sm:inline">{t("view_grid")}</span>
              </button>
              <button
                type="button"
                onClick={() => changeViewMode("kanban")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-150",
                  viewMode === "kanban"
                    ? "bg-brand text-brand-foreground shadow-xs"
                    : "text-muted hover:text-foreground",
                )}
                title={t("view_kanban")}
              >
                <Kanban className="size-3.5" />
                <span className="hidden sm:inline">{t("view_kanban")}</span>
              </button>
            </div>
          )}

          {tab !== "INBOX" && (
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
              <input
                ref={searchInputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("search_placeholder")}
                className="w-full rounded-xl border border-border bg-surface/80 py-1.5 pl-9 pr-12 text-sm outline-none transition-colors placeholder:text-faint focus:border-brand/60 focus-visible:ring-2 focus-visible:ring-brand/30"
              />
              <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {q ? (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="text-faint hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden rounded border border-border bg-surface px-1.5 font-mono text-[10px] text-faint sm:inline-block">
                    /
                  </kbd>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Interactive Stage Funnel Visual Bar ── */}
      <div className="mt-6 rounded-2xl border border-border/80 bg-surface/50 p-4 shadow-xs backdrop-blur-md">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-faint uppercase">
              {t("pipeline_stages_title")}
            </span>
          </div>

          {/* Quick Filter Pill Controls */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setParams({ tab: "ALL", min: null })}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all",
                tab === "ALL" && minFilter == null
                  ? "border-brand/50 bg-brand-soft text-brand font-semibold"
                  : "border-border/60 bg-surface/80 text-muted hover:text-foreground",
              )}
            >
              {t("filter_all_jobs")}
            </button>
            <button
              type="button"
              onClick={() => setParams({ min: minFilter === 4.0 ? null : 4.0 })}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all",
                minFilter === 4.0
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold"
                  : "border-border/60 bg-surface/80 text-muted hover:text-foreground",
              )}
            >
              <Sparkles className="size-3" />
              {t("filter_top_matches")}
            </button>
            <button
              type="button"
              onClick={() => setParams({ tab: "INTERVIEW" })}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all",
                tab === "INTERVIEW"
                  ? "border-violet-500/50 bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold"
                  : "border-border/60 bg-surface/80 text-muted hover:text-foreground",
              )}
            >
              {t("tab_interview")} ({stageCounts.interview})
            </button>
          </div>
        </div>

        {/* Funnel Connected Stages */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <FunnelStepButton
            icon={Inbox}
            label={t("tab_inbox")}
            count={stageCounts.inbox}
            active={tab === "INBOX"}
            onClick={() => setParams({ tab: null })}
            color="orange"
          />
          <FunnelStepButton
            icon={FileText}
            label={t("tab_evaluated")}
            count={stageCounts.evaluated}
            active={tab === "EVALUATED"}
            onClick={() => setParams({ tab: "EVALUATED" })}
            color="indigo"
            convRate={conversions.evalToApplied}
          />
          <FunnelStepButton
            icon={Send}
            label={t("tab_applied")}
            count={stageCounts.applied}
            active={tab === "APPLIED"}
            onClick={() => setParams({ tab: "APPLIED" })}
            color="sky"
            convRate={conversions.appliedToResp}
          />
          <FunnelStepButton
            icon={MessageSquare}
            label={t("tab_responded")}
            count={stageCounts.responded}
            active={tab === "RESPONDED"}
            onClick={() => setParams({ tab: "RESPONDED" })}
            color="cyan"
            convRate={conversions.respToInterview}
          />
          <FunnelStepButton
            icon={Users}
            label={t("tab_interview")}
            count={stageCounts.interview}
            active={tab === "INTERVIEW"}
            onClick={() => setParams({ tab: "INTERVIEW" })}
            color="violet"
            highlight={stageCounts.interview > 0}
            convRate={conversions.interviewToOffer}
          />
          <FunnelStepButton
            icon={Award}
            label={t("tab_offer")}
            count={stageCounts.offer}
            active={tab === "OFFER" || tab === "HIRED"}
            onClick={() => setParams({ tab: "OFFER" })}
            color="emerald"
            highlight={stageCounts.offer > 0}
          />
        </div>
      </div>

      {/* ── Status Tabs (hidden in Kanban view to avoid duplicate filtering) ── */}
      {viewMode !== "kanban" && (
        <div className="mt-6 flex flex-wrap gap-1 border-b border-border">
          {TABS.map((tKey) => {
            const count =
              tKey === "INBOX"
                ? pendingInbox.length
                : tKey === "ALL"
                  ? applications.length
                  : applications.filter((r) => canonStatus(r.status).includes(tKey)).length;
            const labelKey = TAB_TRANSLATION_KEYS[tKey] || "tab_all";
            const localizedTab = t(labelKey) || tKey;
            return (
              <button
                key={tKey}
                onClick={() => setParams({ tab: tKey === "INBOX" ? null : tKey })}
                className={cn(
                  "-mb-px inline-flex items-center justify-center gap-1.5 border-b-2 px-3.5 py-2.5 text-xs font-medium transition-all max-sm:min-h-[44px]",
                  tab === tKey
                    ? "border-brand text-foreground font-semibold"
                    : "border-transparent text-muted hover:text-foreground",
                )}
              >
                <span>{localizedTab}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] tabular-nums",
                    tab === tKey ? "bg-brand/15 text-brand font-bold" : "bg-surface-hover text-faint",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filter Chips Bar */}
      {tab !== "INBOX" && minFilter != null && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-faint">Filtered:</span>
          <button
            type="button"
            onClick={() => setParams({ min: null })}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand/15"
            title={t("filter_clear")}
          >
            {t("filter_score_label")} ≥ {minFilter.toFixed(1)}
            <X className="size-3" />
          </button>
        </div>
      )}

      {/* ── Content View: Inbox or Applications ── */}
      {tab === "INBOX" ? (
        pendingInbox.length > 0 ? (
          <InboxTriage inbox={pendingInbox} />
        ) : (
          <InboxEmpty count={0} filtered={false} />
        )
      ) : filtered.length > 0 ? (
        viewMode === "kanban" ? (
          /* ── Kanban View ── */
          <KanbanBoard
            applications={filtered}
            onSelectApp={(app) => setSelectedApp(app)}
          />
        ) : viewMode === "cards" ? (
          /* ── Grid/Card View ── */
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r, i) => {
              const company = companyPresentation(r);
              const score = scoreNum(r.score);
              const pct = Number.isFinite(score) ? Math.min(100, Math.max(0, (score / 5) * 100)) : 0;
              const urlMatch = r.notes?.match(/https?:\/\/[^\s)]+/);
              const postingUrl = urlMatch ? urlMatch[0] : null;

              return (
                <div
                  key={`${r.n}-${i}`}
                  onClick={() => setSelectedApp(r)}
                  className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-border/80 bg-surface/70 p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:bg-surface hover:shadow-md"
                >
                  <div>
                    {/* Company Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 font-medium text-foreground transition-colors group-hover:text-brand">
                        <CompanyLogo name={company.logoName} size={26} />
                        <span className="truncate font-bold">{company.label}</span>
                      </div>
                      <span className="shrink-0 text-xs text-faint tabular-nums">{r.date}</span>
                    </div>

                    {/* Role Title */}
                    <div className="mt-2.5">
                      <p className="line-clamp-2 text-sm font-medium text-foreground">
                        {r.role}
                      </p>
                      {r.via && r.via !== "—" && (
                        <span className="mt-1 inline-block text-[11px] text-faint">
                          {t("badge_via")} {r.via}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score & Status Section */}
                  <div className="mt-4 border-t border-border/60 pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge tone={scoreTone(r.score)}>{r.score || "—"}</Badge>
                        {pct > 0 && (
                          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-border/60">
                            <div
                              className="h-full rounded-full bg-brand transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <StatusSelect n={r.n} current={r.status} size="sm" hideLabel />
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/40 pt-2 text-xs">
                      <Link
                        href={`/pipeline/${r.n}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-muted transition-colors hover:text-brand"
                      >
                        <FileText className="size-3.5" />
                        <span>{t("action_report")}</span>
                      </Link>
                      {postingUrl && (
                        <a
                          href={postingUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-muted transition-colors hover:text-foreground"
                        >
                          <ExternalLink className="size-3.5" />
                          <span>{t("action_open")}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Table View ── */
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border/80 bg-surface/50 shadow-xs backdrop-blur-xs">
            <table className="w-full min-w-[50rem] text-sm">
              <thead className="border-b border-border/80 bg-surface/70 text-left text-xs font-semibold tracking-wider text-faint uppercase">
                <tr>
                  {SORT_KEYS.map((k) => {
                    const colKey = COL_TRANSLATION_KEYS[k] || "col_company";
                    const colLabel = t(colKey) || k;
                    return (
                      <th
                        key={k}
                        className="cursor-pointer select-none whitespace-nowrap px-4 py-3 transition-colors hover:text-foreground"
                        onClick={() => setParams({ sort: k, dir: sort.key === k ? sort.dir * -1 : -1 })}
                      >
                        <span className="inline-flex items-center gap-1">
                          {colLabel}
                          <ChevronsUpDown className="size-3" />
                        </span>
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-right">{t("col_actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((r, i) => {
                  const company = companyPresentation(r);
                  const urlMatch = r.notes?.match(/https?:\/\/[^\s)]+/);
                  const postingUrl = urlMatch ? urlMatch[0] : null;

                  return (
                    <tr
                      key={`${r.n}-${i}`}
                      onClick={() => setSelectedApp(r)}
                      className="group cursor-pointer transition-colors hover:bg-surface-hover/70"
                    >
                      {/* Company */}
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2.5 transition-colors group-hover:text-brand">
                          <CompanyLogo name={company.logoName} size={24} />
                          <div>
                            <div className="font-bold text-foreground group-hover:text-brand">
                              {company.label}
                            </div>
                            {r.via && r.via !== "—" && (
                              <div className="text-[11px] text-faint">
                                {t("badge_via")} {r.via}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3 text-foreground font-medium">
                        <span className="hover:underline">{r.role}</span>
                      </td>

                      {/* Score */}
                      <td className="px-4 py-3">
                        <Badge tone={scoreTone(r.score)}>{r.score || "—"}</Badge>
                      </td>

                      {/* Status + In-place StatusSelect */}
                      <td className="whitespace-nowrap px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn("size-2 shrink-0 rounded-full shadow-xs", statusDot(r.status))}
                          />
                          <StatusSelect n={r.n} current={r.status} size="sm" hideLabel />
                        </div>
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap px-4 py-3 text-faint tabular-nums">
                        {r.date}
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/pipeline/${r.n}`}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface hover:text-brand"
                            title={t("action_report")}
                          >
                            <FileText className="size-3.5" />
                            <span className="hidden sm:inline">{t("action_report")}</span>
                          </Link>
                          {postingUrl && (
                            <a
                              href={postingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
                              title={t("action_open")}
                            >
                              <ExternalLink className="size-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface/30 px-6 py-12 text-center">
          <p className="font-display text-lg font-semibold">{t("empty_matches_title")}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{t("empty_matches_desc")}</p>
        </div>
      )}

      {/* ── Slide-over Quick Detail Drawer ── */}
      <QuickDetailDrawer
        app={selectedApp}
        onClose={() => setSelectedApp(null)}
      />
    </div>
  );
}

function FunnelStepButton({
  icon: Icon,
  label,
  count,
  active,
  onClick,
  color,
  highlight,
  convRate,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color: "orange" | "indigo" | "sky" | "cyan" | "violet" | "emerald";
  highlight?: boolean;
  convRate?: string | null;
}) {
  const colorStyles = {
    orange: "hover:border-orange-500/40 hover:bg-orange-500/5",
    indigo: "hover:border-indigo-500/40 hover:bg-indigo-500/5",
    sky: "hover:border-sky-500/40 hover:bg-sky-500/5",
    cyan: "hover:border-cyan-500/40 hover:bg-cyan-500/5",
    violet: "hover:border-violet-500/40 hover:bg-violet-500/5",
    emerald: "hover:border-emerald-500/40 hover:bg-emerald-500/5",
  }[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-start rounded-xl border p-2.5 text-left transition-all duration-150",
        colorStyles,
        active
          ? "border-brand bg-brand-soft shadow-xs"
          : "border-border/60 bg-surface/60",
      )}
    >
      <div className="flex w-full items-center justify-between">
        <Icon className={cn("size-4 transition-colors", active ? "text-brand" : "text-muted group-hover:text-foreground")} />
        <span
          className={cn(
            "text-base font-extrabold tabular-nums",
            highlight ? "text-brand" : "text-foreground",
          )}
        >
          {count}
        </span>
      </div>
      <div className="mt-1 flex w-full items-center justify-between gap-1">
        <span className="truncate text-xs font-medium text-muted">{label}</span>
        {convRate && (
          <span className="text-[10px] text-faint tabular-nums" title="Conversion from previous stage">
            {convRate}
          </span>
        )}
      </div>
      {highlight && (
        <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-brand animate-pulse" />
      )}
    </button>
  );
}

function InboxEmpty({ count, filtered }: { count: number; filtered: boolean }) {
  const { t } = useI18n();

  if (filtered) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface/30 px-6 py-12 text-center">
        <p className="font-display text-lg font-semibold">{t("empty_matches_title")}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{t("empty_matches_desc")}</p>
      </div>
    );
  }

  return (
    <div className="dot-bg mt-4 overflow-hidden rounded-2xl border border-border bg-surface/50 bg-origin-border bg-gradient-to-tr from-brand/10 via-transparent to-transparent shadow-lg">
      <div className="flex items-center gap-2 border-b border-foreground/10 px-5 py-3">
        <span className="size-2.5 rounded-full bg-foreground/15" aria-hidden="true" />
        <span className="size-2.5 rounded-full bg-foreground/15" aria-hidden="true" />
        <span className="size-2.5 rounded-full bg-foreground/15" aria-hidden="true" />
        <span className="ml-3 font-mono text-xs tracking-wide text-muted">career-ops · inbox</span>
      </div>
      <div className="px-6 py-10 text-center">
        <p className="font-display text-lg font-semibold">{t("empty_inbox_title")}</p>
        {count > 0 ? (
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">Nothing pending right now.</p>
        ) : (
          <>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{t("empty_inbox_desc")}</p>
            <Link
              href="/explore?run=1"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground shadow-sm transition-all duration-200 hover:bg-brand-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <Compass className="size-4" /> {t("empty_inbox_btn")}{" "}
              <ArrowRight className="size-4" />
            </Link>
            <p className="mx-auto mt-4 max-w-sm text-xs text-muted">
              {t("empty_inbox_terminal")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
