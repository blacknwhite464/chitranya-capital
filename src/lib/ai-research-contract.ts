export type EvidenceKind =
  | "official_market"
  | "official_company"
  | "issuer_notice"
  | "regulator_notice"
  | "broker_floorsheet"
  | "user_supplied"
  | "calculation";

export type ResearchEvidence = {
  id: string;
  kind: EvidenceKind;
  title: string;
  sourceName: string;
  sourceUrl: string | null;
  sourceAsOf: string | null;
  retrievedAt: string;
  excerpt: string;
};

export type ResearchClaim = {
  text: string;
  evidenceIds: string[];
  classification: "sourced_fact" | "calculation" | "interpretation";
};

export type ResearchScenario = {
  case: "bull" | "base" | "bear";
  thesis: string;
  assumptions: string[];
  catalysts: string[];
  invalidationConditions: string[];
  horizon: string;
  referenceLevels: {
    entry: number | null;
    target: number | null;
    stopLoss: number | null;
    currency: "NPR";
    basis: string;
  } | null;
};

export type AIResearchResponse = {
  symbol: string;
  language: "en" | "ne";
  generatedAt: string;
  dataAsOf: string | null;
  freshnessNote: string;
  conclusion: "bullish" | "neutral" | "bearish" | "insufficient_data";
  summary: string;
  claims: ResearchClaim[];
  risks: string[];
  assumptions: string[];
  scenarios: ResearchScenario[];
  limitations: string[];
  evidence: ResearchEvidence[];
  disclaimer: string;
};

export type ResearchValidation = {
  valid: boolean;
  errors: string[];
};

/**
 * Deterministic response gate for future AI output.
 * It does not verify whether a source is truthful; it only checks provenance
 * completeness and that every cited evidence ID exists in the response.
 */
export function validateAIResearchResponse(
  response: AIResearchResponse
): ResearchValidation {
  const errors: string[] = [];
  const evidenceIds = new Set(response.evidence.map(item => item.id));

  if (!response.symbol.trim()) errors.push("A stock symbol is required.");
  if (!response.summary.trim()) errors.push("A research summary is required.");
  if (!response.freshnessNote.trim()) errors.push("A data-freshness note is required.");
  if (!response.disclaimer.trim()) errors.push("A risk disclaimer is required.");
  if (!response.risks.length) errors.push("At least one material risk must be disclosed.");
  if (!response.assumptions.length) errors.push("Assumptions must be disclosed.");
  if (response.conclusion !== "insufficient_data" && response.evidence.length === 0) {
    errors.push("A directional conclusion requires source evidence.");
  }

  for (const item of response.evidence) {
    if (!item.id.trim() || !item.title.trim() || !item.sourceName.trim() || !item.excerpt.trim()) {
      errors.push("Evidence records must include an ID, title, source and excerpt.");
    }
    if (!item.retrievedAt.trim()) errors.push(`Evidence ${item.id || "(unknown)"} is missing its retrieval timestamp.`);
    if (item.sourceUrl && !/^https:\/\//i.test(item.sourceUrl)) {
      errors.push(`Evidence ${item.id} has a non-HTTPS source URL.`);
    }
  }

  for (const [index, claim] of response.claims.entries()) {
    if (!claim.text.trim()) errors.push(`Claim ${index + 1} is empty.`);
    if (claim.evidenceIds.length === 0 && claim.classification !== "interpretation") {
      errors.push(`Claim ${index + 1} needs at least one evidence reference.`);
    }
    for (const id of claim.evidenceIds) {
      if (!evidenceIds.has(id)) errors.push(`Claim ${index + 1} cites unknown evidence ID: ${id}.`);
    }
  }

  for (const scenario of response.scenarios) {
    if (!scenario.thesis.trim() || !scenario.horizon.trim()) {
      errors.push(`The ${scenario.case} scenario needs a thesis and time horizon.`);
    }
    if (!scenario.assumptions.length || !scenario.invalidationConditions.length) {
      errors.push(`The ${scenario.case} scenario must include assumptions and invalidation conditions.`);
    }
    const levels = scenario.referenceLevels;
    if (levels) {
      const values = [levels.entry, levels.target, levels.stopLoss].filter((n): n is number => n !== null);
      if (values.some(n => !Number.isFinite(n) || n <= 0)) {
        errors.push(`The ${scenario.case} scenario contains an invalid reference price.`);
      }
      if (!levels.basis.trim()) errors.push(`The ${scenario.case} scenario needs a reference-price basis.`);
    }
  }

  if (response.conclusion === "insufficient_data" && response.scenarios.length > 0) {
    errors.push("Do not produce directional scenarios when evidence is insufficient.");
  }

  return { valid: errors.length === 0, errors };
}
