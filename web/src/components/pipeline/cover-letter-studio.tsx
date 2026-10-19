"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  FileText,
  HelpCircle,
  Hash,
  Sliders,
  Send,
} from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { cn } from "@/lib/cn";

type QuestionType = "motivation" | "competency" | "problem_solving" | "collaboration" | "custom";

interface QuestionOption {
  type: QuestionType;
  labelKo: string;
  labelEn: string;
  descKo: string;
  descEn: string;
}

const QUESTION_OPTIONS: QuestionOption[] = [
  {
    type: "motivation",
    labelKo: "지원 동기 및 포부",
    labelEn: "Motivation & Vision",
    descKo: "왜 이 회사와 포지션인가? 입사 후 기여 방안",
    descEn: "Why this company and role? Vision and impact.",
  },
  {
    type: "competency",
    labelKo: "직무 핵심 역량 및 강점",
    labelEn: "Core Competencies",
    descKo: "지원 직무와 관련된 핵심 기술과 실무 강점",
    descEn: "Key technical strengths and practical experience.",
  },
  {
    type: "problem_solving",
    labelKo: "문제 해결 및 위기 극복 (STAR)",
    labelEn: "Problem Solving",
    descKo: "기술적 난제나 병목을 주도적으로 극복한 사례",
    descEn: "Navigating technical roadblocks and failure recovery.",
  },
  {
    type: "collaboration",
    labelKo: "협업 및 커뮤니케이션",
    labelEn: "Teamwork & Collaboration",
    descKo: "다양한 직군과의 소통 및 팀워크 성공 사례",
    descEn: "Cross-functional communication and alignment.",
  },
  {
    type: "custom",
    labelKo: "직접 입력 (자유 양식)",
    labelEn: "Custom Prompt",
    descKo: "기업별 특화 질문 직접 입력",
    descEn: "Enter a custom company essay prompt.",
  },
];

export function CoverLetterStudio({
  id,
  companyName = "해당 기업",
  roleTitle = "지원 포지션",
}: {
  id: string;
  companyName?: string;
  roleTitle?: string;
}) {
  const { locale } = useI18n();
  const [selectedType, setSelectedType] = useState<QuestionType>("motivation");
  const [customQuestion, setCustomQuestion] = useState("");
  const [targetLength, setTargetLength] = useState<number>(700);
  const [text, setText] = useState("");
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [copied, setCopied] = useState(false);

  // Compute character and byte counts
  const charsWithSpaces = text.length;
  const charsWithoutSpaces = text.replace(/\s/g, "").length;

  // Korean EUC-KR byte estimation: Korean character = 2 bytes, ASCII = 1 byte
  const eucKrBytes = Array.from(text).reduce((acc, char) => {
    const code = char.charCodeAt(0);
    return acc + (code > 127 ? 2 : 1);
  }, 0);

  // Progress percentage
  const progressPct = targetLength > 0 ? Math.min(100, Math.round((charsWithSpaces / targetLength) * 100)) : 0;
  const isOverLimit = targetLength > 0 && charsWithSpaces > targetLength;

  const handleGenerateDraft = async () => {
    setLoadingDraft(true);
    try {
      const res = await fetch("/api/cover-letter/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          questionType: selectedType,
          customQuestion: selectedType === "custom" ? customQuestion : undefined,
          targetLength,
        }),
      });
      const data = await res.json();
      if (data.draft) {
        setText(data.draft);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingDraft(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-surface/60 p-5 shadow-xs backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground">
              {locale === "ko" ? "한국형 자기소개서 스튜디오" : "Cover Letter & Essay Studio"}
            </h3>
            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">
              {companyName} · {roleTitle}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            {locale === "ko"
              ? "채용 전형 문항별 최적화 초안 작성 및 정밀 글자 수 / 바이트 실시간 검사"
              : "Draft tailor-made responses to standard application essays with live character/byte budgeting."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateDraft}
            disabled={loadingDraft}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-1.5 text-xs font-semibold text-brand-foreground shadow-xs transition-all hover:bg-brand-200 disabled:opacity-50"
          >
            {loadingDraft ? (
              <RefreshCw className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            <span>
              {locale === "ko" ? "내 이력 기반 초안 생성" : "Generate Grounded Draft"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!text.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-40"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span>{copied ? (locale === "ko" ? "복사 완료!" : "Copied!") : locale === "ko" ? "본문 복사" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Question Selector Tabs */}
      <div className="mt-4">
        <label className="text-xs font-bold uppercase tracking-wider text-faint">
          {locale === "ko" ? "문항 유형 선택" : "Select Prompt Category"}
        </label>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {QUESTION_OPTIONS.map((opt) => {
            const isSelected = selectedType === opt.type;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => setSelectedType(opt.type)}
                className={cn(
                  "flex flex-col items-start rounded-xl border p-2.5 text-left transition-all",
                  isSelected
                    ? "border-brand bg-brand-soft shadow-xs"
                    : "border-border/60 bg-surface/70 hover:border-brand/40",
                )}
              >
                <span
                  className={cn(
                    "text-xs font-bold",
                    isSelected ? "text-brand" : "text-foreground",
                  )}
                >
                  {locale === "ko" ? opt.labelKo : opt.labelEn}
                </span>
                <span className="mt-1 line-clamp-2 text-[10px] text-muted">
                  {locale === "ko" ? opt.descKo : opt.descEn}
                </span>
              </button>
            );
          })}
        </div>

        {selectedType === "custom" && (
          <div className="mt-3">
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder={locale === "ko" ? "지원할 기업의 자소서 문항을 직접 입력하세요..." : "Enter custom application prompt here..."}
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-xs outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
            />
          </div>
        )}
      </div>

      {/* Target Length & Live Counter Bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface/80 p-3">
        {/* Length presets */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted">
            {locale === "ko" ? "목표 글자수:" : "Target Length:"}
          </span>
          {[500, 700, 1000, 1500, 0].map((len) => (
            <button
              key={len}
              type="button"
              onClick={() => setTargetLength(len)}
              className={cn(
                "rounded-lg px-2 py-0.5 text-xs font-medium transition-colors",
                targetLength === len
                  ? "bg-foreground text-background font-bold"
                  : "border border-border/60 bg-surface text-muted hover:text-foreground",
              )}
            >
              {len === 0 ? (locale === "ko" ? "무제한" : "None") : `${len}자`}
            </button>
          ))}
        </div>

        {/* Live Metrics */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-baseline gap-1">
            <span className="text-muted">{locale === "ko" ? "공백 포함:" : "With spaces:"}</span>
            <span
              className={cn(
                "font-bold tabular-nums",
                isOverLimit ? "text-red-500 font-black" : "text-foreground",
              )}
            >
              {charsWithSpaces}
            </span>
            {targetLength > 0 && <span className="text-faint">/ {targetLength}자</span>}
          </div>

          <div className="hidden sm:flex items-baseline gap-1">
            <span className="text-muted">{locale === "ko" ? "공백 제외:" : "No spaces:"}</span>
            <span className="font-semibold text-foreground tabular-nums">{charsWithoutSpaces}자</span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-muted">{locale === "ko" ? "바이트:" : "Bytes:"}</span>
            <span className="font-semibold text-foreground tabular-nums">{eucKrBytes} Byte</span>
          </div>
        </div>
      </div>

      {/* Visual Progress Bar */}
      {targetLength > 0 && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
          <div
            className={cn(
              "h-full transition-all duration-200",
              isOverLimit ? "bg-red-500" : progressPct > 80 ? "bg-emerald-500" : "bg-brand",
            )}
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
      )}

      {/* Main Textarea */}
      <div className="mt-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={
            locale === "ko"
              ? "자기소개서 본문을 작성하거나 상단의 '내 이력 기반 초안 생성' 버튼을 눌러 초안을 불러오세요..."
              : "Write your cover letter response here, or click 'Generate Grounded Draft' above..."
          }
          className="w-full rounded-xl border border-border/80 bg-surface/90 p-4 text-sm leading-relaxed outline-none transition-colors placeholder:text-faint focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {/* Bottom Hint */}
      <div className="mt-2 flex items-center justify-between text-xs text-faint">
        <span>
          {locale === "ko"
            ? "💡 작성된 초안은 실제 cv.md 및 story-bank.md에 등록된 사실에 기반합니다."
            : "💡 Generated drafts are strictly grounded in your verified experience."}
        </span>
        {text && (
          <button
            type="button"
            onClick={() => setText("")}
            className="text-faint hover:text-red-500 transition-colors"
          >
            {locale === "ko" ? "본문 비우기" : "Clear"}
          </button>
        )}
      </div>
    </div>
  );
}
