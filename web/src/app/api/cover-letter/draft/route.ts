import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { careerOpsRoot, readReport, findApplication } from "@/lib/career-ops";
import { companyPresentation } from "@/lib/company-presentation.mjs";

export const dynamic = "force-dynamic";

interface DraftRequest {
  id: string;
  questionType: "motivation" | "competency" | "problem_solving" | "collaboration" | "custom";
  customQuestion?: string;
  targetLength?: number;
}

export async function POST(req: Request) {
  let body: DraftRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, questionType, customQuestion, targetLength = 700 } = body;
  const app = findApplication(id);
  const report = readReport(id);
  const root = careerOpsRoot();

  let cvText = "";
  try {
    cvText = fs.readFileSync(path.join(root, "cv.md"), "utf8");
  } catch {
    cvText = "";
  }

  let storyBank = "";
  try {
    storyBank = fs.readFileSync(path.join(root, "interview-prep", "story-bank.md"), "utf8");
  } catch {
    storyBank = "";
  }

  const company = app ? companyPresentation(app).label : "해당 기업";
  const role = app?.role ?? "해당 직무";

  // Extract achievements or bullet points from cv.md
  const bullets: string[] = [];
  for (const line of cvText.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const bullet = trimmed.replace(/^[-*]\s+/, "");
      if (bullet.length > 20 && !bullet.includes("http")) {
        bullets.push(bullet);
      }
    }
  }

  const sampleBullet1 = bullets[0] ?? `${role} 분야에서 지속적인 시스템 고도화 및 서비스 개선을 주도했습니다.`;
  const sampleBullet2 = bullets[1] ?? `대규모 트래픽 처리와 안정적인 서비스 배포 프로세스를 성공적으로 구축한 경험이 있습니다.`;

  let draft = "";
  let questionTitle = "";

  switch (questionType) {
    case "motivation":
      questionTitle = "지원 동기 및 입사 후 포부";
      draft = `[${company}의 비전에 기여하는 ${role}가 되겠습니다]\n\n` +
        `${company}이 추구하는 서비스의 방향성과 기술적 도전에 깊이 공감하여 지원하게 되었습니다. ` +
        `그동안 ${role}로서 축적해 온 경험을 바탕으로, ${company}의 엔지니어링 역량 강화에 실질적인 기여를 하고자 합니다.\n\n` +
        `이전 경험에서 ${sampleBullet1} 이를 통해 단순히 주어진 기능을 구현하는 것에 그치지 않고, ` +
        `비즈니스 임팩트와 사용자 경험을 동시에 향상시키는 아키텍처를 설계해 왔습니다.\n\n` +
        `입사 후에는 ${company}의 핵심 기술적 과제를 신속히 파악하고, 팀 내 생산성을 극대화하며 안정적인 시스템 확장에 주도적으로 앞장서겠습니다.`;
      break;

    case "competency":
      questionTitle = "직무 관련 핵심 역량 및 강점";
      draft = `[검증된 문제 해결력과 기술적 전문성]\n\n` +
        `${role} 포지션에서 가장 중요한 것은 안정적인 아키텍처 설계와 빠른 실행력이라고 생각합니다. ` +
        `저는 다음과 같은 핵심 강점을 보유하고 있습니다.\n\n` +
        `첫째, ${sampleBullet1}\n` +
        `둘째, ${sampleBullet2}\n\n` +
        `이러한 경험은 새로운 환경에서도 불확실성을 빠르게 해소하고, 견고한 소프트웨어를 지속적으로 제공할 수 있는 탄탄한 밑바탕이 되었습니다. ` +
        `${company}에서도 복잡한 요구사항을 체계적으로 구조화하여 가시적인 성과를 만들어내겠습니다.`;
      break;

    case "problem_solving":
      questionTitle = "문제 해결 및 위기 극복 경험 (STAR)";
      draft = `[체계적인 원인 분석과 주도적인 장애 극복]\n\n` +
        `프로젝트 진행 중 예상치 못한 기술적 난관과 성능 병목을 마주했을 때, 데이터에 기반한 문제 정의와 팀 협업으로 이를 극복한 경험이 있습니다.\n\n` +
        `[상황 및 과제] ${sampleBullet2} 과정에서 기존 시스템의 한계로 인해 지연이 발생하는 이슈가 있었습니다.\n` +
        `[행동 및 해결] 문제의 근본 원인을 파악하기 위해 모니터링 메트릭을 분석하고 단계별 개선 방안을 도출했습니다. ${sampleBullet1}\n` +
        `[결과 및 배운 점] 이를 통해 시스템의 안정성을 확보하고 팀의 작업 효율을 크게 개선할 수 있었습니다. ` +
        `이 경험을 통해 어떤 기술적 도전도 단계적으로 분석하면 해결할 수 있다는 확신을 얻었습니다.`;
      break;

    case "collaboration":
      questionTitle = "협업 및 커뮤니케이션 경험";
      draft = `[열린 소통과 공통의 목표를 지향하는 원팀 정신]\n\n` +
        `엔지니어링의 성패는 뛰어난 코드뿐만 아니라 기획, 디자인, 동료 개발자와의 유기적인 커뮤니케이션에서 비롯된다고 믿습니다.\n\n` +
        `프로젝트 진행 시 다양한 직군과 협업하며 기술적 맥락을 비개발 직군도 쉽게 이해할 수 있는 언어로 번역하여 공유했습니다. ` +
        `${sampleBullet1} 과정에서 발생하는 일정 및 우선순위 충돌을 선제적인 논의와 트레이드오프 합의를 통해 원만하게 조율했습니다.\n\n` +
        `${company}에서도 동료들의 의견에 귀 기울이고 신뢰를 쌓으며, 함께 최고의 결과를 만들어내는 든든한 동료가 되겠습니다.`;
      break;

    case "custom":
    default:
      questionTitle = customQuestion || "자유 양식 기술서";
      draft = `[${company} ${role} 지원서]\n\n` +
        `${sampleBullet1}\n\n` +
        `${sampleBullet2}\n\n` +
        `보유한 전문성을 바탕으로 ${company}의 서비스 성장에 즉시 기여할 준비가 되어 있습니다.`;
      break;
  }

  return NextResponse.json({
    id,
    company,
    role,
    questionType,
    questionTitle,
    targetLength,
    draft,
  });
}
