/**
 * keyword-analysis.ts — ATS keyword coverage check and skill-gap diagnostic.
 *
 * Implements zero-LLM keyword extraction, boundary-aware occurrence counting,
 * synonym expansion, and coverage auditing for web reports and candidate CVs.
 */

export const SYNONYMS: string[][] = [
  ["javascript", "js"],
  ["typescript", "ts"],
  ["kubernetes", "k8s"],
  ["machine learning", "ml"],
  ["ci/cd", "cicd", "ci / cd"],
  ["infrastructure as code", "iac"],
  ["natural language processing", "nlp"],
  ["large language model", "large language models", "llm", "llms"],
  ["amazon web services", "aws"],
  ["google cloud platform", "gcp"],
  ["postgresql", "postgres"],
  ["react", "react.js", "reactjs"],
  ["vue", "vue.js", "vuejs"],
  ["next.js", "nextjs", "next"],
  ["node.js", "nodejs", "node"],
  ["spring boot", "springboot", "spring"],
  ["kafka", "apache kafka"],
  ["redis", "redis cache"],
  ["docker", "containerization", "containers"],
  ["graphql", "gql"],
  ["rest api", "restful api", "rest", "restful"],
  ["test driven development", "tdd"],
  ["microservices", "msa", "microservice"],
];

export const KEYWORDS_HEADINGS: string[] = [
  "Keywords extracted",
  "Extracted Keywords",
  "추출한 키워드",
  "Palabras clave extraídas",
  "Extrahierte Keywords",
  "Mots-cles extraits",
  "Geextraheerde trefwoorden",
  "Parole chiave estratte",
  "Keywords extraídas",
  "Извлечённые ключевые слова",
  "ATS 关键词提取",
  "ATS 關鍵字擷取",
];

export function normalizeText(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function countOccurrences(term: string, text: string): number {
  const t = normalizeText(term);
  if (!t) return 0;
  const hay = normalizeText(text);
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Boundary check: not flanked by a-z, 0-9, or Korean syllables
  const re = new RegExp(`(?<![a-z0-9가-힣])${escaped}(?![a-z0-9가-힣])`, "g");
  const matches = hay.match(re);
  return matches ? matches.length : 0;
}

export function variantForms(term: string): string[] {
  const t = normalizeText(term);
  const forms = new Set<string>([t]);
  if (t.length < 3) return [...forms];
  if (!t.endsWith("s")) forms.add(t + "s");
  else if (t.length > 3) forms.add(t.slice(0, -1));
  return [...forms];
}

export function expandTerms(keyword: string): string[] {
  const k = normalizeText(keyword);
  const forms = variantForms(k);
  const terms = new Set<string>(forms);
  for (const group of SYNONYMS) {
    if (!forms.some((form) => group.includes(form))) continue;
    for (const member of group) {
      if (member === k) continue;
      for (const v of variantForms(member)) terms.add(v);
    }
  }
  return [...terms];
}

export function keywordCount(keyword: string, text: string): number {
  let total = 0;
  for (const term of expandTerms(keyword)) {
    total += countOccurrences(term, text);
  }
  return total;
}

export interface CoverageResult {
  total: number;
  presentCount: number;
  coveragePct: number;
  present: string[];
  thin: string[];
  missing: string[];
}

export function analyzeCoverage(keywords: string[], cvText: string): CoverageResult {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const raw of keywords || []) {
    const k = String(raw).trim();
    if (!k) continue;
    const key = normalizeText(k);
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(k);
  }

  const present: string[] = [];
  const thin: string[] = [];
  const missing: string[] = [];

  for (const k of cleaned) {
    const count = keywordCount(k, cvText || "");
    if (count === 0) {
      missing.push(k);
    } else {
      present.push(k);
      if (count === 1) thin.push(k);
    }
  }

  const total = cleaned.length;
  const presentCount = present.length;
  const coveragePct = total === 0 ? 0 : Math.round((presentCount / total) * 100);
  return { total, presentCount, coveragePct, present, thin, missing };
}

export function extractKeywordsFromText(reportText: string): string[] {
  const lines = String(reportText || "").split(/\r?\n/);
  const out: string[] = [];
  let inBlock = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (/^##\s+/.test(line)) {
      const isHead = KEYWORDS_HEADINGS.some((h) =>
        normalizeText(line).includes(normalizeText(h)),
      );
      if (isHead) {
        inBlock = true;
        continue;
      } else if (inBlock) {
        break; // Next level-2 heading exits keyword block
      }
    }
    if (!inBlock || !line) continue;
    if (/^\(.*\)$/.test(line)) continue;

    const body = line.replace(/^[-*]\s+/, "");
    for (const part of body.split(",")) {
      const kw = part.trim().replace(/\.+$/, "").trim();
      if (kw && kw.length > 1 && !kw.startsWith("#")) {
        out.push(kw);
      }
    }
  }

  // Fallback: If no explicit keyword heading was in the report, extract technical terms from text
  if (out.length === 0) {
    const techPattern =
      /\b(TypeScript|JavaScript|Python|Go|Golang|Java|Kotlin|Rust|Swift|React|Next\.js|Vue|Node\.js|NestJS|Spring|FastAPI|Django|PostgreSQL|MySQL|Redis|Kafka|RabbitMQ|Docker|Kubernetes|AWS|GCP|Azure|Terraform|CI\/CD|GraphQL|gRPC|REST|Git)\b/gi;
    const matches = reportText.match(techPattern);
    if (matches) {
      const seen = new Set<string>();
      for (const m of matches) {
        const norm = normalizeText(m);
        if (!seen.has(norm)) {
          seen.add(norm);
          out.push(m);
        }
      }
    }
  }

  return out;
}
