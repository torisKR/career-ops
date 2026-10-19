"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Send,
  MessageSquare,
  Users,
  Award,
  Archive,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import type { Application } from "@/lib/career-ops";
import { CompanyLogo } from "@/components/company-logo";
import { canonStatus, scoreNum, scoreTone } from "@/lib/format";
import { companyPresentation } from "@/lib/company-presentation.mjs";
import { useI18n } from "@/components/language-provider";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";

interface StageConfig {
  id: string;
  labelKey:
    | "kanban_col_evaluated"
    | "kanban_col_applied"
    | "kanban_col_responded"
    | "kanban_col_interview"
    | "kanban_col_offer"
    | "kanban_col_archived";
  icon: React.ComponentType<{ className?: string }>;
  color: "indigo" | "sky" | "cyan" | "violet" | "emerald" | "zinc";
  nextState: string | null;
}

const STAGES: StageConfig[] = [
  {
    id: "EVALUATED",
    labelKey: "kanban_col_evaluated",
    icon: FileText,
    color: "indigo",
    nextState: "Applied",
  },
  {
    id: "APPLIED",
    labelKey: "kanban_col_applied",
    icon: Send,
    color: "sky",
    nextState: "Responded",
  },
  {
    id: "RESPONDED",
    labelKey: "kanban_col_responded",
    icon: MessageSquare,
    color: "cyan",
    nextState: "Interview",
  },
  {
    id: "INTERVIEW",
    labelKey: "kanban_col_interview",
    icon: Users,
    color: "violet",
    nextState: "Offer",
  },
  {
    id: "OFFER",
    labelKey: "kanban_col_offer",
    icon: Award,
    color: "emerald",
    nextState: "Hired",
  },
  {
    id: "ARCHIVED",
    labelKey: "kanban_col_archived",
    icon: Archive,
    color: "zinc",
    nextState: null,
  },
];

export function KanbanBoard({
  applications,
  onSelectApp,
}: {
  applications: Application[];
  onSelectApp: (app: Application) => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Group applications by stage
  const grouped = STAGES.reduce<Record<string, Application[]>>((acc, stage) => {
    acc[stage.id] = [];
    return acc;
  }, {});

  for (const app of applications) {
    const c = canonStatus(app.status);
    if (c.includes("REJECTED") || c.includes("DISCARDED") || c.includes("SKIP")) {
      grouped.ARCHIVED.push(app);
    } else if (c.includes("OFFER") || c.includes("HIRED")) {
      grouped.OFFER.push(app);
    } else if (c.includes("INTERVIEW")) {
      grouped.INTERVIEW.push(app);
    } else if (c.includes("RESPONDED")) {
      grouped.RESPONDED.push(app);
    } else if (c.includes("APPLIED")) {
      grouped.APPLIED.push(app);
    } else {
      grouped.EVALUATED.push(app);
    }
  }

  // Quick advance handler
  const handleAdvance = async (e: React.MouseEvent, app: Application, nextState: string) => {
    e.stopPropagation();
    if (advancingId) return;
    setAdvancingId(app.n);
    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ n: app.n, status: nextState }),
      });
      if (!res.ok) throw new Error("status write failed");
      router.refresh();
    } catch {
      /* ignore */
    } finally {
      setAdvancingId(null);
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* Horizontal Kanban Columns Container */}
      <div className="grid grid-cols-1 gap-4 overflow-x-auto pb-4 md:grid-cols-2 lg:grid-cols-5 xl:gap-5">
        {STAGES.filter((s) => s.id !== "ARCHIVED").map((stage) => {
          const items = grouped[stage.id] || [];
          const Icon = stage.icon;

          const stageHeaderStyles = {
            indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
            sky: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
            cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
            violet: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
            emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            zinc: "border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
          }[stage.color];

          return (
            <div
              key={stage.id}
              className="flex min-w-[260px] flex-col rounded-2xl border border-border/70 bg-surface/40 p-3 shadow-xs backdrop-blur-xs"
            >
              {/* Column Header */}
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex size-6 items-center justify-center rounded-lg border",
                      stageHeaderStyles,
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <h3 className="text-xs font-bold tracking-tight text-foreground">
                    {t(stage.labelKey)}
                  </h3>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                    items.length > 0
                      ? "bg-surface-hover text-foreground font-bold"
                      : "bg-surface-hover/50 text-faint",
                  )}
                >
                  {items.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto">
                {items.length > 0 ? (
                  items.map((app, idx) => {
                    const company = companyPresentation(app);
                    const score = scoreNum(app.score);
                    const isAdvancing = advancingId === app.n;
                    const urlMatch = app.notes?.match(/https?:\/\/[^\s)]+/);
                    const postingUrl = urlMatch ? urlMatch[0] : null;

                    return (
                      <div
                        key={`${app.n}-${idx}`}
                        onClick={() => onSelectApp(app)}
                        className="group relative cursor-pointer rounded-xl border border-border/80 bg-surface/90 p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/50 hover:bg-surface hover:shadow-md"
                      >
                        {/* Company Logo + Name + Date */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <CompanyLogo name={company.logoName} size={22} />
                            <span className="truncate text-xs font-bold text-foreground group-hover:text-brand transition-colors">
                              {company.label}
                            </span>
                          </div>
                          <span className="shrink-0 text-[10px] text-faint tabular-nums">
                            {app.date}
                          </span>
                        </div>

                        {/* Role Title */}
                        <p className="mt-2 line-clamp-2 text-xs font-medium text-foreground">
                          {app.role}
                        </p>

                        {/* Via Badge (if any) */}
                        {app.via && app.via !== "—" && (
                          <div className="mt-1 text-[10px] text-faint">
                            {t("badge_via")} {app.via}
                          </div>
                        )}

                        {/* Score & Actions Footer */}
                        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5">
                          <div className="flex items-center gap-1.5">
                            <Badge tone={scoreTone(app.score)}>{app.score || "—"}</Badge>
                            {score >= 4.0 && (
                              <Sparkles className="size-3 text-amber-500" />
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {postingUrl && (
                              <a
                                href={postingUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex size-6 items-center justify-center rounded-md text-faint hover:bg-surface-hover hover:text-foreground transition-colors"
                                title={t("action_open")}
                              >
                                <ExternalLink className="size-3" />
                              </a>
                            )}
                            {stage.nextState && (
                              <button
                                type="button"
                                onClick={(e) => handleAdvance(e, app, stage.nextState!)}
                                disabled={isAdvancing}
                                className="inline-flex items-center gap-1 rounded-md border border-brand/30 bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand transition-colors hover:bg-brand/20 active:scale-95"
                                title={`${t("kanban_advance_next")}: ${stage.nextState}`}
                              >
                                <span>{stage.nextState}</span>
                                <ArrowRight className="size-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/60 p-4 text-center">
                    <p className="text-[11px] text-faint">{t("kanban_empty_col")}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Collapsible Archived / Terminal Column */}
      <div className="rounded-2xl border border-border/70 bg-surface/30 p-3">
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="flex w-full items-center justify-between text-left text-xs font-semibold text-muted transition-colors hover:text-foreground"
        >
          <div className="flex items-center gap-2">
            <Archive className="size-4 text-faint" />
            <span>{t("kanban_col_archived")}</span>
            <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] tabular-nums">
              {grouped.ARCHIVED.length}
            </span>
          </div>
          {showArchived ? (
            <ChevronDown className="size-4 text-faint" />
          ) : (
            <ChevronRight className="size-4 text-faint" />
          )}
        </button>

        {showArchived && grouped.ARCHIVED.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {grouped.ARCHIVED.map((app, idx) => {
              const company = companyPresentation(app);
              return (
                <div
                  key={`${app.n}-${idx}`}
                  onClick={() => onSelectApp(app)}
                  className="cursor-pointer rounded-xl border border-border/60 bg-surface/60 p-3 opacity-75 transition-all hover:opacity-100 hover:border-brand/40"
                >
                  <div className="flex items-center justify-between gap-1 text-xs font-medium">
                    <span className="truncate font-semibold text-foreground">
                      {company.label}
                    </span>
                    <span className="shrink-0 text-[10px] text-faint">{app.status}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-muted">{app.role}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
