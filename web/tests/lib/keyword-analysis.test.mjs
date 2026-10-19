import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeText,
  countOccurrences,
  expandTerms,
  analyzeCoverage,
  extractKeywordsFromText,
} from "../../src/lib/keyword-analysis.ts";

test("normalizeText trims and collapses multiple whitespaces", () => {
  assert.equal(normalizeText("  TypeScript   React  "), "typescript react");
  assert.equal(normalizeText(""), "");
});

test("countOccurrences handles boundary matching for tech terms", () => {
  assert.equal(countOccurrences("java", "We use java and javascript daily"), 1);
  assert.equal(countOccurrences("react", "Built with React and Next.js"), 1);
  assert.equal(countOccurrences("go", "We go to market with Golang"), 1);
});

test("expandTerms expands common developer synonyms", () => {
  const k8sTerms = expandTerms("k8s");
  assert.ok(k8sTerms.includes("kubernetes"));
  assert.ok(k8sTerms.includes("k8s"));

  const tsTerms = expandTerms("ts");
  assert.ok(tsTerms.includes("typescript"));
  assert.ok(tsTerms.includes("ts"));

  const nextTerms = expandTerms("next.js");
  assert.ok(nextTerms.includes("nextjs"));
});

test("analyzeCoverage correctly buckets present, thin, and missing keywords", () => {
  const cvText = `
    Senior Frontend Engineer with 5 years experience in TypeScript and React.
    Also used Docker in production.
  `;
  const keywords = ["TypeScript", "Docker", "Kubernetes", "Next.js"];

  const res = analyzeCoverage(keywords, cvText);
  assert.equal(res.total, 4);
  assert.ok(res.present.includes("TypeScript"));
  assert.ok(res.present.includes("Docker"));
  assert.ok(res.thin.includes("Docker")); // mentioned only once
  assert.ok(res.missing.includes("Kubernetes"));
  assert.equal(res.coveragePct, 50); // 2 of 4 present = 50%
});

test("extractKeywordsFromText extracts from English and Korean report headings", () => {
  const reportEn = `
## Role Summary
Senior Platform Engineer

## Keywords extracted
- TypeScript, Kubernetes, AWS, Next.js

## Verdict
Strong Match
  `;
  const kwsEn = extractKeywordsFromText(reportEn);
  assert.deepEqual(kwsEn, ["TypeScript", "Kubernetes", "AWS", "Next.js"]);

  const reportKo = `
## 직무 요약
시니어 백엔드 엔지니어

## 추출한 키워드
- Spring Boot, Java, PostgreSQL, Kafka

## 판정
4.2점 추천
  `;
  const kwsKo = extractKeywordsFromText(reportKo);
  assert.deepEqual(kwsKo, ["Spring Boot", "Java", "PostgreSQL", "Kafka"]);
});
