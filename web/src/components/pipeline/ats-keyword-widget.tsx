"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ArrowRight,
  FileText,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import type { CoverageResult } from "@/lib/keyword-analysis";
import { useI18n } from "@/components/language-provider";
import { cn } from "@/lib/cn";

export function AtsKeywordWidget({
  id,
  initialCoverage,
}: {
  id: string;
  initialCoverage?: CoverageResult | null;
}) {
  const { t, locale } = useI18n();
  const [coverage, setCoverage] = useState<CoverageResult | null>(initialCoverage ?? null);
  const [loading, setLoading] = useState(!initialCoverage);
  const [hasCv, setHasCv] = useState(true);
  const [filter, setFilter] = useState<"all" | "missing" | "thin" | "present">("all");
  const [copied, setCopied] = useState(false);

  const fetchCoverage = () => {
    setLoading(true);
    fetch(`/api/report/keywords?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.coverage) {
          setCoverage(data.coverage);
          setHasCv(data.hasCv);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!initialCoverage) {
      fetchCoverage();
    }
  }, [id, initialCoverage]);

  const handleCopyKeywords = () => {
    if (!coverage) return;
    const text = `[ATS Keywords for Report #${id}]\n\nMissing:\n${coverage.missing.join(", ")}\n\nThin:\n${coverage.thin.join(", ")}\n\nPresent:\n${coverage.present.join(", ")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border/70 bg-surface/40 p-8 text-center backdrop-blur-xs">
        <RefreshCw className="size-6 animate-spin text-brand" />
        <p className="mt-3 text-sm text-muted">
          {locale === "ko" ? "ATS 키워드 일치도를 분석하는 중..." : "Analyzing ATS keyword coverage..."}
        </p>
      </div>
    );
  }

  if (!coverage || coverage.total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-surface/30 p-6 text-center">
        <p className="text-sm font-medium text-foreground">
          {locale === "ko" ? "추출된 키워드가 없습니다." : "No keywords extracted for this report."}
        </p>
        <p className="mt-1 text-xs text-muted">
          {locale === "ko"
            ? "공고 리포트에 키워드 섹션이 포함되어 있는지 확인하세요."
            : "Ensure the evaluation report has an extracted keywords block."}
        </p>
      </div>
    );
  }

  const pct = coverage.coveragePct;
  let statusBadgeColor = "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400";
  let statusBadgeText = locale === "ko" ? "서류 탈락 위험 (보완 필요)" : "ATS High Risk (Gaps Found)";
  if (pct >= 80) {
    statusBadgeColor = "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    statusBadgeText = locale === "ko" ? "서류 통과율 우수 (Strong Match)" : "High ATS Pass Likelihood";
  } else if (pct >= 60) {
    statusBadgeColor = "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400";
    statusBadgeText = locale === "ko" ? "보통 적합도 (일부 보완 권장)" : "Moderate Match (Gaps to Close)";
  }

  const displayedKeywords =
    filter === "missing"
      ? coverage.missing
      : filter === "thin"
        ? coverage.thin
        : filter === "present"
          ? coverage.present
          : [...coverage.missing, ...coverage.thin, ...coverage.present];

  return (
    <div className="rounded-2xl border border-border/80 bg-surface/60 p-5 shadow-xs backdrop-blur-md">
      {/* Header with Match Percentage & Pass Probability */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground">
              {locale === "ko" ? "ATS 키워드 적합도 분석" : "ATS Keyword & Skill-Gap Audit"}
            </h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                statusBadgeColor,
              )}
            >
              <Sparkles className="size-3" />
              {statusBadgeText}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            {locale === "ko"
              ? "공고 필수 요구 역량과 내 이력서(cv.md)의 키워드 일치도를 점검합니다."
              : "Verifies JD requirement keywords against your resume (cv.md) before submitting."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyKeywords}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span>{copied ? (locale === "ko" ? "복사됨!" : "Copied!") : locale === "ko" ? "키워드 복사" : "Copy List"}</span>
          </button>
          <Link
            href="/cv"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground shadow-xs transition-colors hover:bg-brand-200"
          >
            <FileText className="size-3.5" />
            <span>{locale === "ko" ? "이력서 수정" : "Edit CV"}</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* Score Progress Gauge */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-surface/70 p-3">
          <span className="text-[11px] font-medium text-faint uppercase">
            {locale === "ko" ? "전체 매칭률" : "Coverage Rate"}
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-foreground tabular-nums">{pct}%</span>
            <span className="text-xs text-faint">
              ({coverage.presentCount}/{coverage.total})
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase">
            {locale === "ko" ? "일치 (Present)" : "Matched"}
          </span>
          <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            {coverage.present.length}
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 uppercase">
            {locale === "ko" ? "보완 권장 (Thin)" : "Mentioned 1x"}
          </span>
          <div className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
            {coverage.thin.length}
          </div>
        </div>

        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <span className="text-[11px] font-medium text-red-600 dark:text-red-400 uppercase">
            {locale === "ko" ? "누락 (Missing)" : "Missing"}
          </span>
          <div className="mt-1 text-2xl font-black text-red-600 dark:text-red-400 tabular-nums">
            {coverage.missing.length}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-5 flex flex-wrap items-center gap-1.5 border-b border-border/60 pb-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
            filter === "all"
              ? "bg-brand text-brand-foreground"
              : "text-muted hover:text-foreground",
          )}
        >
          {locale === "ko" ? "전체" : "All"} ({coverage.total})
        </button>
        <button
          type="button"
          onClick={() => setFilter("missing")}
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
            filter === "missing"
              ? "bg-red-500 text-white"
              : "text-red-600 dark:text-red-400 hover:bg-red-500/10",
          )}
        >
          {locale === "ko" ? "누락" : "Missing"} ({coverage.missing.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("thin")}
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
            filter === "thin"
              ? "bg-amber-500 text-white"
              : "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10",
          )}
        >
          {locale === "ko" ? "보완 권장" : "Thin"} ({coverage.thin.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("present")}
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
            filter === "present"
              ? "bg-emerald-500 text-white"
              : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10",
          )}
        >
          {locale === "ko" ? "일치" : "Matched"} ({coverage.present.length})
        </button>
      </div>

      {/* Keyword Chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {displayedKeywords.map((kw) => {
          const isMissing = coverage.missing.includes(kw);
          const isThin = coverage.thin.includes(kw);

          return (
            <span
              key={kw}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                isMissing
                  ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                  : isThin
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              )}
            >
              {isMissing ? (
                <XCircle className="size-3" />
              ) : isThin ? (
                <AlertTriangle className="size-3" />
              ) : (
                <CheckCircle2 className="size-3" />
              )}
              <span>{kw}</span>
            </span>
          );
        })}
      </div>

      {/* Non-fabrication Safe Guidance */}
      {coverage.missing.length > 0 && (
        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs text-muted">
          <div className="flex items-start gap-2">
            <AlertTriangle className="size-4 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">
                {locale === "ko"
                  ? "💡 키워드 보완 시 준수사항 (비조작 원칙)"
                  : "💡 Keyword Optimization Rule (Zero-Fabrication)"}
              </p>
              <p className="mt-1 leading-relaxed">
                {locale === "ko"
                  ? "누락된 기술 스택 중 과거 프로젝트나 업무에서 실제로 다뤄보신 경험이 있다면, cv.md의 프로젝트 상세 설명에 해당 용어를 명시적으로 포함해 주세요. 사용해본 적 없는 기술은 절대 허위로 추가하지 마세요."
                  : "If you have real experience with any of the missing keywords, explicitly mention them in your project bullets in cv.md. Never invent experience you do not have."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
