"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Users,
  PenTool,
  TrendingUp,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Application } from "@/lib/career-ops";
import { Badge } from "@/components/ui/badge";
import { scoreTone, scoreNum, legitimacyTone, parseReport } from "@/lib/format";
import { cleanHeading, isVerdictHeading, splitSections } from "@/lib/report-sections.mjs";
import { StatusSelect } from "@/components/status-select";
import { CompanyLogo } from "@/components/company-logo";
import { ScoreMethodology } from "@/components/score-methodology";
import { GeneratePdfButton } from "@/components/generate-pdf-button";
import { ApplyButton } from "@/components/apply-button";
import { DeleteFromTracker } from "@/components/delete-from-tracker";
import { companyPresentation } from "@/lib/company-presentation.mjs";
import { useI18n } from "@/components/language-provider";
import { AtsKeywordWidget } from "@/components/pipeline/ats-keyword-widget";
import { InterviewPrepHub } from "@/components/pipeline/interview-prep-hub";
import { CoverLetterStudio } from "@/components/pipeline/cover-letter-studio";
import { NegotiationAssistant } from "@/components/pipeline/negotiation-assistant";
import { cn } from "@/lib/cn";

type ActiveTab = "overview" | "keywords" | "interview" | "cover" | "negotiation";

function isMachine(heading: string): boolean {
  return /machine summary|submitted|submit[-\s]?log/i.test(heading);
}

function preview(md: string): string {
  const text = md
    .replace(/^#+\s.*$/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*_`>#|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const sentence = text.split(/(?<=[.!?])\s/)[0] ?? text;
  return sentence.length > 96 ? sentence.slice(0, 96).trimEnd() + "…" : sentence;
}

export function ReportView({
  id,
  app,
  report,
  canDelete = false,
  pdfReadyFromIndex = false,
}: {
  id: string;
  app: Application | null;
  report: string | null;
  file?: string | null;
  canDelete?: boolean;
  pdfReadyFromIndex?: boolean;
}) {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as ActiveTab) || "overview";
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    ["overview", "keywords", "interview", "cover", "negotiation"].includes(initialTab)
      ? initialTab
      : "overview",
  );

  const meta = report ? parseReport(report) : null;
  const field = (label: string) => meta?.fields.find((f) => f.label === label)?.value;
  const score = app?.score || field("Score");
  const date = app?.date || field("Date");
  const archetype = field("Archetype");
  const url = field("URL");
  const pdfReady = (app?.pdf ?? "").includes("✅") || pdfReadyFromIndex;
  const company = app ? companyPresentation(app) : null;
  const companyName = company?.label ?? meta?.title ?? `Report #${id}`;
  const roleTitle = app?.role ?? "해당 포지션";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/pipeline"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-brand"
      >
        <ArrowLeft className="size-4" /> {locale === "ko" ? "파이프라인으로 돌아가기" : "Back to Pipeline"}
      </Link>

      <header className="mt-5">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-faint">#{id}</p>
        <div className="mt-2 flex items-center gap-3">
          <CompanyLogo name={company?.logoName ?? meta?.title ?? `Report #${id}`} size={44} />
          <h1 className="font-display text-3xl font-bold tracking-tight text-landing">
            {companyName}
          </h1>
        </div>
        {app?.role && <p className="mt-1 text-base text-muted font-medium">{app.role}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {score && <Badge tone={scoreTone(score)}>{score}</Badge>}
          {(() => {
            const n = scoreNum(score ?? "");
            if (Number.isNaN(n)) return null;
            return n >= 4.0 ? (
              <Badge tone="good">{locale === "ko" ? "추천 공고" : "Recommended"}</Badge>
            ) : (
              <Badge tone="muted">{locale === "ko" ? "기준 미달" : "Below apply line"}</Badge>
            );
          })()}
          {meta?.legitimacy && <Badge tone={legitimacyTone(meta.legitimacy)}>{meta.legitimacy}</Badge>}
          {app && <StatusSelect n={id} current={app.status} />}
          <GeneratePdfButton n={id} company={app?.company ?? meta?.title ?? id} pdfReady={pdfReady} />
          <ApplyButton
            n={id}
            url={url && url.startsWith("http") ? url : undefined}
            company={app?.company ?? meta?.title ?? id}
            pdfReady={pdfReady}
          />
        </div>

        {app && canDelete && (
          <div className="mt-3">
            <DeleteFromTracker n={id} />
          </div>
        )}

        {(archetype || date || (url && url.startsWith("http"))) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            {archetype && <span className="max-w-full truncate">{archetype}</span>}
            {date && <span className="tabular-nums text-faint">{date}</span>}
            {url && url.startsWith("http") && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1 text-brand hover:underline max-sm:min-h-[44px]"
              >
                {locale === "ko" ? "원문 공고 열기" : "posting"} <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        )}
      </header>

      {/* ── Hiring Toolkit Navigation Tabs ── */}
      <div className="mt-8 flex flex-wrap gap-1.5 border-b border-border/80 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
            activeTab === "overview"
              ? "bg-brand text-brand-foreground shadow-xs"
              : "text-muted hover:text-foreground hover:bg-surface-hover",
          )}
        >
          <FileText className="size-3.5" />
          <span>{t("report_tab_overview")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("keywords")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
            activeTab === "keywords"
              ? "bg-brand text-brand-foreground shadow-xs"
              : "text-muted hover:text-foreground hover:bg-surface-hover",
          )}
        >
          <Sparkles className="size-3.5" />
          <span>{t("report_tab_keywords")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("interview")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
            activeTab === "interview"
              ? "bg-brand text-brand-foreground shadow-xs"
              : "text-muted hover:text-foreground hover:bg-surface-hover",
          )}
        >
          <Users className="size-3.5" />
          <span>{t("report_tab_interview")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("cover")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
            activeTab === "cover"
              ? "bg-brand text-brand-foreground shadow-xs"
              : "text-muted hover:text-foreground hover:bg-surface-hover",
          )}
        >
          <PenTool className="size-3.5" />
          <span>{t("report_tab_cover")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("negotiation")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
            activeTab === "negotiation"
              ? "bg-brand text-brand-foreground shadow-xs"
              : "text-muted hover:text-foreground hover:bg-surface-hover",
          )}
        >
          <TrendingUp className="size-3.5" />
          <span>{t("report_tab_negotiation")}</span>
        </button>
      </div>

      {/* ── Tab Content Views ── */}
      <div className="mt-6">
        {activeTab === "keywords" ? (
          <AtsKeywordWidget id={id} />
        ) : activeTab === "interview" ? (
          <InterviewPrepHub id={id} companyName={companyName} roleTitle={roleTitle} />
        ) : activeTab === "cover" ? (
          <CoverLetterStudio id={id} companyName={companyName} roleTitle={roleTitle} />
        ) : activeTab === "negotiation" ? (
          <NegotiationAssistant companyName={companyName} roleTitle={roleTitle} />
        ) : (
          /* ── Overview: Evaluation Report Markdown ── */
          report ? (
            <>
              {(() => {
                const { intro, sections } = splitSections(meta?.body ?? report);
                if (sections.length === 0) {
                  return (
                    <article className="report-prose mt-6">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{meta?.body ?? report}</ReactMarkdown>
                    </article>
                  );
                }

                const verdict = sections.find((s) => isVerdictHeading(s.heading));
                const rest = sections.filter((s) => s !== verdict);
                const machine = rest.filter((s) => isMachine(s.heading));
                const mainSections = rest.filter((s) => !isMachine(s.heading));
                const anyAB = mainSections.some((s) => s.letter === "A" || s.letter === "B");

                return (
                  <div className="mt-6">
                    {intro && (
                      <article className="report-prose">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{intro}</ReactMarkdown>
                      </article>
                    )}

                    {verdict && (
                      <div className="rounded-2xl border border-brand/25 bg-brand-soft/50 px-5 py-4">
                        <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-brand/80">
                          Verdict
                        </p>
                        <article className="report-prose [&_p]:font-medium [&_p]:text-foreground">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{verdict.content}</ReactMarkdown>
                        </article>
                      </div>
                    )}

                    {mainSections.map((s, i) => {
                      const expanded = s.letter === "A" || s.letter === "B" || (!anyAB && i === 0);
                      if (expanded) {
                        return (
                          <article key={i} className="report-prose mt-6">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{`## ${cleanHeading(s.heading)}\n\n${s.content}`}</ReactMarkdown>
                          </article>
                        );
                      }
                      return (
                        <details
                          key={i}
                          className="group mt-3 overflow-hidden rounded-xl border border-border bg-surface/30"
                        >
                          <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 px-4 py-3 transition-colors hover:bg-surface-hover">
                            <span className="text-sm font-medium">{cleanHeading(s.heading)}</span>
                            <span className="hidden truncate text-xs text-faint sm:inline">
                              {preview(s.content)}
                            </span>
                            <ChevronDown className="ml-auto size-4 shrink-0 text-faint transition-transform group-open:rotate-180" />
                          </summary>
                          <div className="report-prose border-t border-border px-4 py-3">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{s.content}</ReactMarkdown>
                          </div>
                        </details>
                      );
                    })}

                    {machine.length > 0 && (
                      <>
                        <div className="mt-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-faint">
                          <span className="h-px flex-1 bg-border" />
                          Technical details · for developers
                          <span className="h-px flex-1 bg-border" />
                        </div>
                        {machine.map((s, i) => (
                          <details
                            key={i}
                            className="group mt-2 overflow-hidden rounded-xl border border-border/60 bg-surface/20"
                          >
                            <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 px-4 py-3 font-mono text-xs text-muted transition-colors hover:bg-surface-hover">
                              {cleanHeading(s.heading)}
                              <ChevronDown className="ml-auto size-4 shrink-0 text-faint transition-transform group-open:rotate-180" />
                            </summary>
                            <div className="report-prose border-t border-border/60 px-4 py-3 opacity-80">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{s.content}</ReactMarkdown>
                            </div>
                          </details>
                        ))}
                      </>
                    )}
                  </div>
                );
              })()}
              <ScoreMethodology />
            </>
          ) : (
            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-dashed border-border bg-surface/30 p-5 text-sm text-muted">
              <FileText className="size-5 shrink-0 text-faint" />
              {locale === "ko"
                ? `리포트 파일 #${id}를 reports/ 디렉터리에서 찾을 수 없습니다.`
                : `No report file found for #${id} in reports/.`}
            </div>
          )
        )}
      </div>
    </div>
  );
}
