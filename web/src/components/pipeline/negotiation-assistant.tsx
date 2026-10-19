"use client";

import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Award,
} from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { cn } from "@/lib/cn";

export function NegotiationAssistant({
  companyName = "해당 기업",
  roleTitle = "소프트웨어 엔지니어",
}: {
  companyName?: string;
  roleTitle?: string;
}) {
  const { locale } = useI18n();
  const [copiedScript, setCopiedScript] = useState(false);

  const scriptKo = `안녕하세요, [채용담당자님 성함]님.\n\n${companyName}의 ${roleTitle} 포지션 오퍼를 제안해주셔서 진심으로 감사드립니다. 전형 과정에서 팀의 훌륭한 비전과 기술적 도전에 대해 깊은 인상을 받았습니다.\n\n제시해주신 조건에 대해 면밀히 검토해 보았습니다. 제가 이전 조직에서 주도했던 시스템 안정화 및 성능 최적화 경험을 바탕으로 ${companyName}에 입사 후 즉각적으로 기여할 수 있는 임팩트와 현재 시장 가치를 고려했을 때, 기본급 [희망 금액, 예: N천만원] 선으로 조정이 가능한지 여쭙고자 합니다.\n\n${companyName}과 함께 의미 있는 성장을 이루고 싶다는 제 의지는 확고하며, 팀과 회사에 오퍼 이상의 가치를 증명할 자신이 있습니다. 긍정적인 검토 부탁드립니다.\n\n감사합니다.\n[지원자 이름] 드림`;

  const scriptEn = `Hi [Recruiter Name],\n\nThank you so much for extending the offer to join ${companyName} as a ${roleTitle}. Throughout the interview process, I was very impressed by the team's engineering culture and roadmap.\n\nAfter reviewing the details, I am excited about the opportunity to contribute immediately based on my track record in system architecture and scaling. To align with current market benchmarks and the direct value I plan to drive from day one, I would like to ask if we can adjust the base compensation to [Target Amount, e.g. $X,000].\n\nI am confident in my ability to deliver substantial ROI for ${companyName}, and I would love to finalize our agreement. Looking forward to your thoughts!\n\nBest regards,\n[Your Name]`;

  const scriptToCopy = locale === "ko" ? scriptKo : scriptEn;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptToCopy);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-surface/60 p-5 shadow-xs backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground">
              {locale === "ko" ? "오퍼 수령 및 처우 협상 툴킷" : "Offer & Compensation Negotiation Toolkit"}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Award className="size-3" />
              {locale === "ko" ? "최종 합격 단계" : "Offer Stage"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            {locale === "ko"
              ? "정량적 실적과 기여 가치(ROI)에 기반한 확신 있는 연봉 협상 전략"
              : "Anchor counter-offers in proven business impact rather than arbitrary numbers."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-1.5 text-xs font-semibold text-brand-foreground shadow-xs transition-all hover:bg-brand-200"
        >
          {copiedScript ? (
            <Check className="size-3.5 text-emerald-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
          <span>
            {copiedScript
              ? (locale === "ko" ? "스크립트 복사됨!" : "Script Copied!")
              : (locale === "ko" ? "협상 스크립트 복사" : "Copy Script")}
          </span>
        </button>
      </div>

      {/* 3 Golden Rules of Negotiation */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-surface/70 p-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <ShieldCheck className="size-4 text-emerald-500" />
            <span>{locale === "ko" ? "1. 가치(ROI) 중심 접근" : "1. Value-First Anchor"}</span>
          </div>
          <p className="mt-1 text-[11px] text-muted leading-relaxed">
            {locale === "ko"
              ? "단순히 '돈이 더 필요하다'가 아니라, '내 역량으로 팀의 배포 속도 n배 향상 및 장애 감소 가치를 즉시 제공하겠다'는 근거를 제시합니다."
              : "Never negotiate on personal need. Anchor on the concrete technical value and risk reduction you deliver."}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-surface/70 p-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <TrendingUp className="size-4 text-brand" />
            <span>{locale === "ko" ? "2. Total Comp 다각화" : "2. Total Comp Levers"}</span>
          </div>
          <p className="mt-1 text-[11px] text-muted leading-relaxed">
            {locale === "ko"
              ? "기본급 조정이 어렵다면 사이닝 보너스, 스톡옵션, 원격 근무(재택 일수), 자기계발비 등 다른 보상 레버를 제안하세요."
              : "If base salary is constrained by band caps, negotiate signing bonus, equity, or hybrid flexibility."}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-surface/70 p-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Sparkles className="size-4 text-violet-500" />
            <span>{locale === "ko" ? "3. 긍정적이고 확신 있는 톤" : "3. Collaborative Tone"}</span>
          </div>
          <p className="mt-1 text-[11px] text-muted leading-relaxed">
            {locale === "ko"
              ? "오퍼에 대한 감사와 합류 의지를 먼저 명확히 표명하고, '우호적인 파트너십'의 관점으로 부드럽게 질문합니다."
              : "Reiterate enthusiasm for joining first. Frame the ask as solving an agreement together collaboratively."}
          </p>
        </div>
      </div>

      {/* Script Preview Box */}
      <div className="mt-4 rounded-xl border border-border/80 bg-surface/90 p-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-faint">
            {locale === "ko" ? "추천 협상 서면 템플릿" : "Recommended Counter-Offer Email Script"}
          </span>
          <span className="text-[11px] text-muted">
            {locale === "ko" ? "[괄호] 안의 내용을 본인의 상황에 맞게 수정하세요" : "Fill in bracketed tokens"}
          </span>
        </div>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-xs text-foreground leading-relaxed">
          {scriptToCopy}
        </pre>
      </div>
    </div>
  );
}
