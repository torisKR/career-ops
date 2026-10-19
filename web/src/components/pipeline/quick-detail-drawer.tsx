"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  ExternalLink,
  FileText,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import type { Application } from "@/lib/career-ops";
import { CompanyLogo } from "@/components/company-logo";
import { StatusSelect } from "@/components/status-select";
import { canonStatus, scoreNum, scoreTone } from "@/lib/format";
import { companyPresentation } from "@/lib/company-presentation.mjs";
import { useI18n } from "@/components/language-provider";
import { cn } from "@/lib/cn";

const LIFECYCLE_STAGES = [
  { key: "EVALUATED", label: "Evaluated", ko: "검토", next: "Applied" },
  { key: "APPLIED", label: "Applied", ko: "지원", next: "Responded" },
  { key: "RESPONDED", label: "Responded", ko: "서류통과", next: "Interview" },
  { key: "INTERVIEW", label: "Interview", ko: "면접", next: "Offer" },
  { key: "OFFER", label: "Offer / Hired", ko: "최종합격", next: "Hired" },
] as const;

export function QuickDetailDrawer({
  app,
  onClose,
}: {
  app: Application | null;
  onClose: () => void;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (app) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [app, onClose]);

  if (!app) return null;

  const company = companyPresentation(app);
  const score = scoreNum(app.score);
  const pct = Number.isFinite(score) ? Math.min(100, Math.max(0, (score / 5) * 100)) : 0;
  const urlMatch = app.notes?.match(/https?:\/\/[^\s)]+/);
  const postingUrl = urlMatch ? urlMatch[0] : null;

  const currentCanon = canonStatus(app.status);
  let activeStageIndex = 0;
  if (currentCanon.includes("HIRED") || currentCanon.includes("OFFER")) activeStageIndex = 4;
  else if (currentCanon.includes("INTERVIEW")) activeStageIndex = 3;
  else if (currentCanon.includes("RESPONDED")) activeStageIndex = 2;
  else if (currentCanon.includes("APPLIED")) activeStageIndex = 1;
  else activeStageIndex = 0;

  const currentLifecycle = LIFECYCLE_STAGES[activeStageIndex];
  const nextStageTarget = currentLifecycle?.next ?? null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${company.label} - ${app.role}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdvance = async () => {
    if (!nextStageTarget || advancing) return;
    setAdvancing(true);
    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ n: app.n, status: nextStageTarget }),
      });
      if (!res.ok) throw new Error("status write failed");
      router.refresh();
      onClose();
    } catch {
      /* ignore */
    } finally {
      setAdvancing(false);
    }
  };

  // Score tier label & style
  let scoreTierLabel = t("score_tier_moderate");
  let scoreTierClass = "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30";
  if (score >= 4.5) {
    scoreTierLabel = t("score_tier_exceptional");
    scoreTierClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
  } else if (score >= 4.0) {
    scoreTierLabel = t("score_tier_strong");
    scoreTierClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  } else if (score >= 3.5) {
    scoreTierLabel = t("score_tier_good");
    scoreTierClass = "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30";
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="relative w-screen max-w-md border-l border-border/80 bg-surface/95 shadow-2xl backdrop-blur-xl transition-all duration-300 sm:max-w-lg">
          <div className="flex h-full flex-col justify-between overflow-y-auto p-6">
            <div>
              {/* Top Navigation & Close */}
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-faint">
                    #{app.n} IN TRACKER
                  </span>
                  {app.via && app.via !== "—" && (
                    <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] text-muted">
                      {t("badge_via")} {app.via}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex size-8 items-center justify-center rounded-lg border border-border/60 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                    title={t("drawer_copy_info")}
                  >
                    {copied ? (
                      <Check className="size-4 text-emerald-500" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex size-8 items-center justify-center rounded-lg border border-border/60 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              {/* Company & Role Header */}
              <div className="mt-5 flex items-start gap-3.5">
                <CompanyLogo name={company.logoName} size={44} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    {company.label}
                  </h2>
                  <p className="mt-0.5 text-sm font-medium text-muted">{app.role}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-faint">
                    <Calendar className="size-3.5" />
                    <span className="tabular-nums">{app.date}</span>
                  </div>
                </div>
              </div>

              {/* Score Assessment Card */}
              <div className="mt-6 rounded-xl border border-border/80 bg-surface/60 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider text-faint uppercase">
                    {t("col_score")}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                      scoreTierClass,
                    )}
                  >
                    <Sparkles className="size-3" />
                    {scoreTierLabel}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {app.score || "—"}
                  </span>
                  {Number.isFinite(score) && (
                    <span className="text-xs text-muted">/ 5.0 ({pct.toFixed(0)}%)</span>
                  )}
                </div>

                {/* Progress bar */}
                {pct > 0 && (
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-border/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand to-brand/80 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Hiring Stage Progress Stepper */}
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold tracking-wider text-faint uppercase">
                    {t("drawer_stage_progress")}
                  </h3>
                  <StatusSelect n={app.n} current={app.status} size="sm" hideLabel />
                </div>

                <div className="rounded-xl border border-border/80 bg-surface/40 p-3">
                  <div className="flex items-center justify-between">
                    {LIFECYCLE_STAGES.map((st, idx) => {
                      const isCompleted = idx < activeStageIndex;
                      const isCurrent = idx === activeStageIndex;
                      const label = locale === "ko" ? st.ko : st.label;

                      return (
                        <div key={st.key} className="flex flex-1 flex-col items-center text-center">
                          <div className="relative flex items-center justify-center">
                            {/* Horizontal connector line */}
                            {idx > 0 && (
                              <div
                                className={cn(
                                  "absolute right-1/2 -z-10 h-0.5 w-full -translate-y-1/2 top-1/2",
                                  idx <= activeStageIndex ? "bg-brand" : "bg-border/60",
                                )}
                              />
                            )}
                            <div
                              className={cn(
                                "flex size-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                                isCurrent
                                  ? "border-2 border-brand bg-brand text-brand-foreground shadow-xs ring-4 ring-brand/20"
                                  : isCompleted
                                    ? "bg-brand/20 text-brand"
                                    : "bg-surface-hover text-faint",
                              )}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="size-4" />
                              ) : (
                                <span>{idx + 1}</span>
                              )}
                            </div>
                          </div>
                          <span
                            className={cn(
                              "mt-1.5 text-[11px] font-medium transition-colors",
                              isCurrent
                                ? "text-brand font-semibold"
                                : isCompleted
                                  ? "text-foreground"
                                  : "text-faint",
                            )}
                          >
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Advance Stage Shortcut */}
                {nextStageTarget && activeStageIndex < 4 && (
                  <button
                    type="button"
                    onClick={handleAdvance}
                    disabled={advancing}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-brand/40 bg-brand-soft py-2 text-xs font-semibold text-brand transition-all hover:bg-brand/15 active:scale-[0.99]"
                  >
                    <TrendingUp className="size-3.5" />
                    <span>
                      {t("kanban_advance_next")}: {nextStageTarget}
                    </span>
                    <ArrowRight className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Notes & Timeline */}
              <div className="mt-6">
                <h3 className="text-xs font-semibold tracking-wider text-faint uppercase">
                  {t("drawer_notes")}
                </h3>
                <div className="mt-2 rounded-xl border border-border/80 bg-surface/50 p-3.5 text-xs text-muted">
                  {app.notes && app.notes !== "—" ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{app.notes}</p>
                  ) : (
                    <p className="text-faint italic">{t("drawer_no_notes")}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="mt-6 border-t border-border/80 pt-4">
              <div className="flex flex-col gap-2">
                <Link
                  href={`/pipeline/${app.n}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-brand-foreground shadow-sm transition-all hover:bg-brand-200"
                >
                  <FileText className="size-4" />
                  <span>{t("drawer_view_report")}</span>
                </Link>

                {postingUrl && (
                  <a
                    href={postingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/80 bg-surface py-2 text-sm font-medium text-foreground transition-all hover:bg-surface-hover"
                  >
                    <ExternalLink className="size-4 text-muted" />
                    <span>{t("drawer_external_posting")}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
