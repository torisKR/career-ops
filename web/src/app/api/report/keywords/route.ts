import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { careerOpsRoot, readReport, findApplication } from "@/lib/career-ops";
import { extractKeywordsFromText, analyzeCoverage } from "@/lib/keyword-analysis";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const report = readReport(id);
  const app = findApplication(id);

  let cvText = "";
  try {
    cvText = fs.readFileSync(path.join(careerOpsRoot(), "cv.md"), "utf8");
  } catch {
    cvText = "";
  }

  const reportContent = report?.content ?? (app ? `${app.company} ${app.role} ${app.notes}` : "");
  const extracted = extractKeywordsFromText(reportContent);
  const coverage = analyzeCoverage(extracted, cvText);

  return NextResponse.json({
    id,
    company: app?.company ?? "",
    role: app?.role ?? "",
    hasCv: cvText.trim().length > 0,
    coverage,
  });
}
