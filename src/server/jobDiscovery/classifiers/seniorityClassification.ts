export type SeniorityClassification = {
  level:
    | "internship"
    | "new_grad"
    | "junior"
    | "associate"
    | "mid"
    | "senior"
    | "staff"
    | "lead"
    | "manager"
    | "unknown";

  allowed: boolean;
  reason: string;
};

const SENIORITY_KEYWORDS = {
  internship: ["intern", "internship", "trainee", "apprentice", "fresher"],
  new_grad: ["new grad", "graduate", "grad", "entry level", "entry-level"],
  junior: ["junior", "jr.", " jr "],
  associate: ["associate"],
  mid: ["mid", "middle", "intermediate"],
  senior: ["senior", "sr.", " sr "],
  staff: ["staff", "principal"],
  lead: ["lead", "team lead", "tech lead"],
  manager: ["manager", "director", "head of", "vp", "vice president", "chief", "cto", "cfo", "ceo"]
};

export function classifySeniority(
  job: { title: string; description?: string | null },
  prefs: {
    allowedSeniorities?: string[] | null;
    excludedRoleKeywords?: string[] | null;
  }
): SeniorityClassification {
  const title = job.title.toLowerCase();
  const description = (job.description || "").toLowerCase();
  const combinedText = `${title} ${description}`;

  const {
    allowedSeniorities = [],
    excludedRoleKeywords = []
  } = prefs;

  // Helper to check if any terms are in text
  const containsAny = (text: string, terms: string[]) => 
    terms.some(term => text.includes(term.toLowerCase()));

  // V1.3: Stricter seniority rules - title should dominate
  // Check for senior keywords first (highest priority)
  const seniorKeywords = ["senior", "staff", "principal", "lead", "manager", "director", "head of"];
  const juniorKeywords = ["intern", "internship", "new grad", "graduate", "junior", "entry level", "associate"];
  
  const hasSeniorKeyword = containsAny(title, seniorKeywords);
  const hasJuniorKeyword = containsAny(title, juniorKeywords);
  
  if (hasSeniorKeyword) {
    // If title has senior keywords but also explicitly junior keywords, prioritize junior
    if (hasJuniorKeyword) {
      return {
        level: "junior",
        allowed: allowedSeniorities?.some(allowed => 
          ["internship", "new_grad", "junior"].includes(allowed.toLowerCase())
        ) ?? false,
        reason: "Role explicitly targets junior/entry-level candidates (overrides senior signals)"
      };
    }
    
    // Otherwise, this is a senior role - exclude it
    return {
      level: "senior",
      allowed: false,
      reason: `Senior title detected: ${seniorKeywords.find(keyword => title.includes(keyword.toLowerCase()))}`
    };
  }

  // Check seniority keywords in title (highest priority after exclusions)
  for (const [level, keywords] of Object.entries(SENIORITY_KEYWORDS)) {
    if (containsAny(title, keywords)) {
      const isAllowed = !allowedSeniorities || allowedSeniorities.length === 0 || 
                       allowedSeniorities.some(allowed => 
                         allowed.toLowerCase() === level.toLowerCase()
                       );

      // Special case: if title has senior keywords but also junior/new grad keywords, prioritize junior
      if (["senior", "staff", "lead", "manager"].includes(level)) {
        const juniorKeywords = [...SENIORITY_KEYWORDS.internship, ...SENIORITY_KEYWORDS.new_grad, ...SENIORITY_KEYWORDS.junior];
        if (containsAny(title, juniorKeywords)) {
          return {
            level: "junior",
            allowed: !allowedSeniorities || allowedSeniorities.length === 0 || allowedSeniorities.some(allowed => 
              ["internship", "new_grad", "junior"].includes(allowed.toLowerCase())
            ),
            reason: "Role explicitly targets junior/entry-level candidates (overrides senior signals)"
          };
        }
      }

      return {
        level: level as SeniorityClassification['level'],
        allowed: isAllowed,
        reason: isAllowed ? `Role matches ${level} level` : `${level} level not in preferences`
      };
    }
  }

  // Check description for seniority clues if title is unclear
  if (title.includes("software engineer") || title.includes("developer") || title.includes("engineer")) {
    // Look for years of experience in description
    const yearsMatch = description.match(/(\d{1,2})\s*\+?\s*years?\s+(?:of\s+)?experience/i);
    if (yearsMatch) {
      const years = parseInt(yearsMatch[1]);
      
      if (years >= 7) {
        return {
          level: "senior",
          allowed: allowedSeniorities?.some(allowed => allowed.toLowerCase() === "senior") ?? false,
          reason: `Requires ${years}+ years of experience (senior level)`
        };
      } else if (years >= 3) {
        return {
          level: "mid",
          allowed: allowedSeniorities?.some(allowed => ["mid", "associate", "junior", "new_grad", "internship"].includes(allowed.toLowerCase())) ?? false,
          reason: `Requires ${years}+ years of experience (mid level)`
        };
      } else if (years >= 1) {
        return {
          level: "junior",
          allowed: allowedSeniorities?.some(allowed => ["junior", "new_grad", "internship"].includes(allowed.toLowerCase())) ?? false,
          reason: `Requires ${years}+ years of experience (junior level)`
        };
      }
    }
  }

  // Default to unknown/mid level
  return {
    level: "unknown",
    allowed: !allowedSeniorities || allowedSeniorities.length === 0 || 
             allowedSeniorities.some(allowed => 
               ["mid", "associate", "junior", "new_grad", "internship"].includes(allowed.toLowerCase())
             ),
    reason: "Seniority level unclear, assuming mid-level"
  };
}
