import { mapToCapabilities, CapabilityMappingResult, confidenceRank } from "./capabilityMapper";
import { areAdjacent } from "./capabilityTaxonomy";

// ---------------------------------------------------------------------------
// Capability-based evidence matching (Phase 1)
// Tiered: exact term match > capability overlap > adjacent capability overlap
// Does NOT modify production scoring; consumed by the capability benchmark.
// ---------------------------------------------------------------------------

export type MatchTier = "exact" | "capability" | "adjacent" | "none";

export interface CapabilityMatch {
  requirement: string;
  tier: MatchTier;
  matchStrength: "strong" | "medium" | "weak" | "none";
  matchedEvidence: string[];
  sharedCapabilities: string[];
  requirementCapabilities: string[];
  requirementUnmapped: boolean;
}

export interface EvidenceItemCapabilities {
  claim: string;
  texts: string[];
  mapping: CapabilityMappingResult;
}

export function mapEvidenceInventory(evidenceInventory: any[]): EvidenceItemCapabilities[] {
  return evidenceInventory.map((item: any) => {
    const texts: string[] = [item.claim || "", item.category || "", ...(item.evidence || [])];
    return {
      claim: item.claim || "",
      texts,
      mapping: mapToCapabilities(texts.join(". ")),
    };
  });
}

function normalizeForExact(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+.#]+/)
    .filter(t => t.length > 2);
}

export function matchRequirementToEvidence(
  requirement: string,
  evidenceItems: EvidenceItemCapabilities[]
): CapabilityMatch {
  const reqMapping = mapToCapabilities(requirement);
  const reqCaps = new Set(reqMapping.capabilities.map(c => c.capabilityId));
  const reqTokens = new Set(normalizeForExact(requirement));

  let bestTier: MatchTier = "none";
  const matchedEvidence = new Set<string>();
  const sharedCapabilities = new Set<string>();

  for (const item of evidenceItems) {
    // Tier 1: exact term overlap (specific technology/term named in both)
    const evidenceTokens = new Set(item.texts.flatMap(normalizeForExact));
    const exactHit = [...reqTokens].some(t => evidenceTokens.has(t) && !GENERIC_TOKENS.has(t));

    // Tier 2: capability overlap (high/medium confidence on both sides)
    const itemCaps = item.mapping.capabilities;
    const capabilityHits = itemCaps.filter(c =>
      reqCaps.has(c.capabilityId) && confidenceRank(c.confidence) >= 2
    );

    // Tier 3: adjacent capability overlap
    const adjacentHits = itemCaps.filter(c =>
      [...reqCaps].some(rc => areAdjacent(rc, c.capabilityId))
    );

    if (exactHit && capabilityHits.length > 0) {
      bestTier = "exact";
      matchedEvidence.add(item.claim);
      capabilityHits.forEach(c => sharedCapabilities.add(c.capabilityId));
    } else if (capabilityHits.length > 0) {
      if (bestTier !== "exact") bestTier = "capability";
      matchedEvidence.add(item.claim);
      capabilityHits.forEach(c => sharedCapabilities.add(c.capabilityId));
    } else if (adjacentHits.length > 0) {
      if (bestTier === "none") bestTier = "adjacent";
      matchedEvidence.add(item.claim);
      adjacentHits.forEach(c => sharedCapabilities.add(c.capabilityId));
    }
  }

  const tierToStrength: Record<MatchTier, "strong" | "medium" | "weak" | "none"> = {
    exact: "strong",
    capability: "medium",
    adjacent: "weak",
    none: "none",
  };

  return {
    requirement,
    tier: bestTier,
    matchStrength: tierToStrength[bestTier],
    matchedEvidence: [...matchedEvidence],
    sharedCapabilities: [...sharedCapabilities],
    requirementCapabilities: [...reqCaps],
    requirementUnmapped: reqMapping.unmapped,
  };
}

// Tokens too generic to count as "exact" technology/term matches
const GENERIC_TOKENS = new Set([
  "development", "developer", "engineering", "engineer", "experience",
  "skills", "skill", "knowledge", "ability", "strong", "with", "and",
  "the", "for", "level", "years", "junior", "senior", "work", "working",
  "team", "good", "required", "preferred",
]);
