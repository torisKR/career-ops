"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Code,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import type { InterviewQuestionItem } from "@/app/api/interview/questions/route";
import { useI18n } from "@/components/language-provider";
import { cn } from "@/lib/cn";

export function InterviewPrepHub({
  id,
  companyName = "해당 기업",
  roleTitle = "지원 포지션",
}: {
  id: string;
  companyName?: string;
  roleTitle?: string;
}) {
  const { locale } = useI18n();
  const [questions, setQuestions] = useState<InterviewQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"technical" | "behavioral" | "reverse">("technical");
  const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestionItem | null>(null);
  const [practiceAnswer, setPracticeAnswer] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/interview/questions?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.questions)) {
          setQuestions(data.questions);
          if (data.questions.length > 0) {
            setSelectedQuestion(data.questions[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Real-time STAR detection in practice answer
  const hasNumbers = /\d+(?:%|배|건|시간|ms|초|원|달러|\$|K|M)?/i.test(practiceAnswer);
  const hasSituation =
    /상황|당시|배경|프로젝트|when|while|during|situation/i.test(practiceAnswer) ||
    practiceAnswer.length > 30;
  const hasTask =
    /과제|문제|목표|원인|issue|problem|task|goal/i.test(practiceAnswer) ||
    practiceAnswer.length > 60;
  const hasAction =
    /해결|구현|도입|설계|개선|적용|action|implemented|designed|built|solved/i.test(
      practiceAnswer,
    ) || practiceAnswer.length > 90;
  const hasResult =
    /결과|성과|감소|향상|개선|절감|달성|result|improved|reduced|achieved/i.test(
      practiceAnswer,
    ) && hasNumbers;

  const starCount = [hasSituation, hasTask, hasAction, hasResult].filter(Boolean).length;

  const filteredQuestions = questions.filter((q) => q.category === activeTab);

  const handleCopyAnswer = () => {
    navigator.clipboard.writeText(practiceAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border/70 bg-surface/40 p-8 text-center backdrop-blur-xs">
        <RefreshCw className="size-6 animate-spin text-brand" />
        <p className="mt-3 text-sm text-muted">
          {locale === "ko"
            ? "공고 맞춤형 면접 질문과 모범 가이드를 도출하는 중..."
            : "Generating JD-specific interview intelligence..."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-surface/60 p-5 shadow-xs backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground">
              {locale === "ko" ? "실전 모의 면접 & 질문 시뮬레이터" : "AI Interview Prep & Simulator"}
            </h3>
            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">
              {companyName} · {roleTitle}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            {locale === "ko"
              ? "채용 담당자와 기술 면접관이 실제로 파고들 핵심 질문 3대 영역을 사전 연습하세요."
              : "Pre-screen expected technical, behavioral, and reverse questions tailored to this role."}
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mt-4 flex flex-wrap gap-2 border-b border-border/60 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("technical")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
            activeTab === "technical"
              ? "bg-brand text-brand-foreground shadow-xs"
              : "text-muted hover:text-foreground hover:bg-surface-hover",
          )}
        >
          <Code className="size-3.5" />
          <span>{locale === "ko" ? "기술 심화 질문" : "Technical Deep Dive"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("behavioral")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
            activeTab === "behavioral"
              ? "bg-brand text-brand-foreground shadow-xs"
              : "text-muted hover:text-foreground hover:bg-surface-hover",
          )}
        >
          <Users className="size-3.5" />
          <span>{locale === "ko" ? "STAR 경험/인성 검증" : "Behavioral (STAR)"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reverse")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
            activeTab === "reverse"
              ? "bg-brand text-brand-foreground shadow-xs"
              : "text-muted hover:text-foreground hover:bg-surface-hover",
          )}
        >
          <HelpCircle className="size-3.5" />
          <span>{locale === "ko" ? "면접관 역질문 (추천)" : "Reverse Questions"}</span>
        </button>
      </div>

      {/* Main Grid: Questions List (Left) + Rehearsal Practice Sandbox (Right) */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Questions Column */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-faint">
            {locale === "ko" ? "예상 질문 목록" : "Target Questions"} ({filteredQuestions.length})
          </span>

          {filteredQuestions.map((q) => {
            const isSelected = selectedQuestion?.id === q.id;
            return (
              <div
                key={q.id}
                onClick={() => setSelectedQuestion(q)}
                className={cn(
                  "cursor-pointer rounded-xl border p-3.5 transition-all text-left",
                  isSelected
                    ? "border-brand bg-brand-soft shadow-xs"
                    : "border-border/60 bg-surface/80 hover:border-brand/40",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={cn(
                      "text-xs font-bold leading-snug",
                      isSelected ? "text-brand" : "text-foreground",
                    )}
                  >
                    {locale === "ko" ? q.questionKo : q.questionEn}
                  </p>
                </div>
                <p className="mt-1.5 text-[11px] text-muted line-clamp-2">
                  {locale === "ko" ? q.contextKo : q.contextEn}
                </p>
              </div>
            );
          })}
        </div>

        {/* Practice Sandbox Column */}
        <div className="lg:col-span-7 rounded-xl border border-border/80 bg-surface/90 p-4 shadow-xs">
          {selectedQuestion ? (
            <div>
              {/* Selected Question Header */}
              <div className="border-b border-border/60 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
                  {locale === "ko" ? "선택된 질문" : "Active Rehearsal Prompt"}
                </span>
                <h4 className="mt-1 text-sm font-extrabold text-foreground leading-snug">
                  {locale === "ko" ? selectedQuestion.questionKo : selectedQuestion.questionEn}
                </h4>
                {selectedQuestion.starTipKo && (
                  <div className="mt-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs text-amber-700 dark:text-amber-300">
                    <span className="font-bold">💡 답변 가이드: </span>
                    {locale === "ko" ? selectedQuestion.starTipKo : selectedQuestion.starTipEn}
                  </div>
                )}
              </div>

              {/* STAR Quality Indicators */}
              <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-surface/70 px-3 py-2 text-xs">
                <span className="font-semibold text-muted">
                  {locale === "ko" ? "STAR 구조 점검:" : "STAR Structure:"}
                </span>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[11px] font-medium",
                      hasSituation ? "text-emerald-500 font-bold" : "text-faint",
                    )}
                  >
                    {hasSituation ? <CheckCircle2 className="size-3" /> : <Circle className="size-3" />}
                    S (상황)
                  </span>

                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[11px] font-medium",
                      hasTask ? "text-emerald-500 font-bold" : "text-faint",
                    )}
                  >
                    {hasTask ? <CheckCircle2 className="size-3" /> : <Circle className="size-3" />}
                    T (과제)
                  </span>

                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[11px] font-medium",
                      hasAction ? "text-emerald-500 font-bold" : "text-faint",
                    )}
                  >
                    {hasAction ? <CheckCircle2 className="size-3" /> : <Circle className="size-3" />}
                    A (행동)
                  </span>

                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[11px] font-medium",
                      hasResult ? "text-emerald-500 font-bold" : "text-faint",
                    )}
                  >
                    {hasResult ? <CheckCircle2 className="size-3" /> : <Circle className="size-3" />}
                    R (성과/수치)
                  </span>
                </div>
              </div>

              {/* Rehearsal Textarea */}
              <div className="mt-3">
                <textarea
                  value={practiceAnswer}
                  onChange={(e) => setPracticeAnswer(e.target.value)}
                  rows={6}
                  placeholder={
                    locale === "ko"
                      ? "이 질문에 대한 답변을 작성하며 실전처럼 연습해보세요. 구체적인 상황, 본인의 주도적 행동, 그리고 정량적 성과 수치(예: 30% 개선, 2초 단축)를 포함하면 높은 평가를 받습니다."
                      : "Draft your answer here. Include concrete situation context, your decisive actions, and quantified metrics (e.g. 40% latency reduction)."
                  }
                  className="w-full rounded-xl border border-border bg-surface p-3 text-xs leading-relaxed outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
                />
              </div>

              {/* Practice Footer */}
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[11px] text-muted">
                  {starCount === 4 ? (
                    <span className="text-emerald-500 font-bold">
                      {locale === "ko"
                        ? "🎉 완벽합니다! STAR 구조와 정량 지표가 모두 포함되었습니다."
                        : "🎉 Excellent! All STAR pillars and quantified metrics included."}
                    </span>
                  ) : (
                    <span>
                      {locale === "ko"
                        ? `STAR 요소 ${starCount}/4개 감지됨`
                        : `${starCount}/4 STAR elements detected`}
                    </span>
                  )}
                </span>

                <div className="flex items-center gap-2">
                  {practiceAnswer && (
                    <button
                      type="button"
                      onClick={() => setPracticeAnswer("")}
                      className="text-xs text-faint hover:text-red-500 transition-colors"
                    >
                      {locale === "ko" ? "지우기" : "Clear"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCopyAnswer}
                    disabled={!practiceAnswer.trim()}
                    className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-surface px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-40"
                  >
                    {copied ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    <span>{copied ? (locale === "ko" ? "복사됨!" : "Copied!") : locale === "ko" ? "답변 복사" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-xs text-faint">
              {locale === "ko" ? "왼쪽에서 연습할 질문을 선택하세요." : "Select a question on the left to practice."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
