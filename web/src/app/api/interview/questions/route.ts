import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { careerOpsRoot, readReport, findApplication } from "@/lib/career-ops";
import { companyPresentation } from "@/lib/company-presentation.mjs";
import { extractKeywordsFromText } from "@/lib/keyword-analysis";

export const dynamic = "force-dynamic";

export interface InterviewQuestionItem {
  id: string;
  category: "technical" | "behavioral" | "reverse";
  questionKo: string;
  questionEn: string;
  contextKo: string;
  contextEn: string;
  starTipKo?: string;
  starTipEn?: string;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const app = findApplication(id);
  const report = readReport(id);
  const company = app ? companyPresentation(app).label : "해당 기업";
  const role = app?.role ?? "소프트웨어 엔지니어";

  const reportText = report?.content ?? (app ? `${app.company} ${app.role} ${app.notes}` : "");
  const keywords = extractKeywordsFromText(reportText);
  const topKeywords = keywords.slice(0, 4);

  const kw1 = topKeywords[0] || "Next.js/TypeScript";
  const kw2 = topKeywords[1] || "대용량 트래픽 분산";
  const kw3 = topKeywords[2] || "데이터베이스 최적화";

  const questions: InterviewQuestionItem[] = [
    // Technical Deep Dive
    {
      id: "tech-1",
      category: "technical",
      questionKo: `${company}의 ${role}로서 ${kw1} 기술 스택을 활용할 때 마주했던 가장 까다로운 성능 병목이나 아키텍처적 한계는 무엇이었으며 어떻게 해결하셨나요?`,
      questionEn: `As a ${role} at ${company}, what was the most challenging performance bottleneck or architectural limitation you encountered with ${kw1}, and how did you resolve it?`,
      contextKo: "실제 프로덕션 환경에서의 깊이 있는 트러블슈팅 경험과 기술적 의사결정 기준을 검증합니다.",
      contextEn: "Evaluates production-grade troubleshooting depth and rationale behind architectural trade-offs.",
      starTipKo: "단순 튜토리얼 수준이 아닌, 문제 발생 원인 분석 -> 프로파일링 메트릭 -> 적용한 해결책 -> 개선 수치(레이턴시 감소율 등)를 명확히 제시하세요.",
      starTipEn: "Explain the root cause analysis, profiling metrics, chosen fix, and quantified improvement (e.g. latency drop).",
    },
    {
      id: "tech-2",
      category: "technical",
      questionKo: `${kw2} 관련 요구사항이 급증할 때, 시스템 가용성과 데이터 정합성을 동시에 보장하기 위해 어떤 전략을 취하셨나요?`,
      questionEn: `When traffic scales rapidly around ${kw2}, what strategies do you employ to balance system availability and data consistency?`,
      contextKo: "분산 시스템 설계 역량과 CAP 이론 또는 캐싱/큐잉 레이어링 이해도를 측정합니다.",
      contextEn: "Assesses distributed systems architecture and caching/queuing trade-off reasoning.",
      starTipKo: "캐시 무효화, 비동기 메시징(Kafka/RabbitMQ), DB 읽기/쓰기 분리 등 실제 프로젝트에 적용했던 구체적 아키텍처 다이어그램을 연상시키며 답변하세요.",
      starTipEn: "Cite concrete patterns: cache invalidation, asynchronous messaging, or read replicas used in your actual projects.",
    },
    {
      id: "tech-3",
      category: "technical",
      questionKo: `${kw3} 관점에서 쿼리 실행 계획(Explain Plan)을 분석하고 튜닝하여 비즈니스 비용이나 리소스를 절감했던 사례가 있나요?`,
      questionEn: `Can you share an experience optimizing query execution plans or indexing to cut operational cloud costs or resource utilization?`,
      contextKo: "데이터베이스 인덱싱 원리 및 클라우드 리소스 최적화 실무 능력을 확인합니다.",
      contextEn: "Checks database indexing internals and cost-efficiency consciousness.",
      starTipKo: "슬로우 쿼리 로그 발견 -> 인덱스 재설계 -> 쿼리 실행 속도 n배 향상 및 CPU 사용률 감소 수치를 강조하세요.",
      starTipEn: "Highlight the slow-query symptom, index redesign, and n-fold execution speedup with CPU savings.",
    },

    // Behavioral & STAR Questions
    {
      id: "star-1",
      category: "behavioral",
      questionKo: "배포 직전이나 라이브 운영 중에 심각한 장애나 버그가 발생했던 경험과, 이를 수습하고 재발을 방지한 과정을 들려주세요.",
      questionEn: "Tell me about a time a critical bug or outage occurred near release or in production. How did you stabilize it and prevent recurrence?",
      contextKo: "위기 대처 능력, 침착함, 그리고 포스트모템(Post-mortem)을 통한 팀 차원의 재발 방지 문화 주도력을 봅니다.",
      contextEn: "Measures crisis management, composure under pressure, and post-mortem ownership.",
      starTipKo: "누구의 탓으로 돌리지 않고, 빠른 롤백/핫픽스 조치 -> 장애 영향도 파악 -> 모니터링 경보 및 CI/CD 테스트 자동화로 막아낸 체계를 설명하세요.",
      starTipEn: "Avoid blame. Focus on rapid containment, impact analysis, and systemic test automation to prevent recurrence.",
    },
    {
      id: "star-2",
      category: "behavioral",
      questionKo: "제품 기획자나 디자이너, 또는 동료 엔지니어와 기술적 우선순위나 스펙을 두고 첨예하게 의견이 대립했을 때 어떻게 합의를 이끌어내셨나요?",
      questionEn: "Describe a situation where you had a strong disagreement with a PM, designer, or peer engineer over technical priorities. How did you achieve alignment?",
      contextKo: "커뮤니케이션 스킬과 비즈니스 목표 중심의 유연한 타협 역량을 검증합니다.",
      contextEn: "Tests interpersonal empathy and objective business-first trade-off negotiation.",
      starTipKo: "내 기술적 고집이 아닌, '사용자 가치'와 '출시 일정'이라는 상위 목표를 기준으로 데이터와 트레이드오프 표를 제시해 설득한 과정을 STAR로 구성하세요.",
      starTipEn: "Frame the consensus around customer impact and deadline feasibility using objective data.",
    },

    // Reverse Questions to ask the Interviewer
    {
      id: "rev-1",
      category: "reverse",
      questionKo: `${company}의 엔지니어링 팀이 현재 가장 집중하고 있는 기술적 부채나 올해 해결해야 할 최우선 과제는 무엇인가요?`,
      questionEn: `What is the biggest technical debt or priority infrastructure challenge the engineering team at ${company} is solving this quarter?`,
      contextKo: "팀의 실질적인 고민과 지원자가 입사 후 즉시 해결해줄 수 있는 영역을 파악하는 스마트한 질문입니다.",
      contextEn: "Reveals genuine team pain points and where you can deliver immediate business value upon joining.",
    },
    {
      id: "rev-2",
      category: "reverse",
      questionKo: `이 포지션으로 합류하게 될 사람이 입사 후 3개월(90일) 내에 어떤 성과를 달성했을 때 '정말 성공적인 채용이었다'고 평가하시나요?`,
      questionEn: `What key outcome achieved within the first 90 days would make you say 'this was an exceptional hire' for this role?`,
      contextKo: "면접관에게 목표 지향적인 태도와 능동적인 책임감을 각인시키는 시니어 레벨의 역질문입니다.",
      contextEn: "Signals outcome orientation, proactive ownership, and high readiness to hit the ground running.",
    },
  ];

  return NextResponse.json({
    id,
    company,
    role,
    keywords: topKeywords,
    questions,
  });
}
