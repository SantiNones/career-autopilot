export type LocationEligibility = {
  category:
    | "barcelona"
    | "spain"
    | "europe"
    | "remote_global"
    | "remote_europe"
    | "remote_spain"
    | "remote_us_only"
    | "remote_unknown"
    | "onsite_incompatible"
    | "unknown";

  eligible: boolean;
  reason: string;
};

export function classifyLocationEligibility(
  job: { location: string | null; description?: string | null },
  prefs: {
    preferredLocations?: string[] | null;
    preferredCountries?: string[] | null;
    remotePreference?: string | null;
    openToRelocation?: boolean;
    excludedCountries?: string[] | null;
  }
): LocationEligibility {
  const location = (job.location || "").toLowerCase();
  const description = (job.description || "").toLowerCase();
  const combinedText = `${location} ${description}`.trim();

  const {
    preferredLocations = [],
    preferredCountries = [],
    remotePreference = "any",
    openToRelocation = false,
    excludedCountries = []
  } = prefs;

  // Helper to check if any terms are in text
  const containsAny = (text: string, terms: string[]) => 
    terms.some(term => text.includes(term.toLowerCase()));

  // Check for explicit Barcelona
  if (containsAny(combinedText, ["barcelona"])) {
    return {
      category: "barcelona",
      eligible: true,
      reason: "Location is Barcelona"
    };
  }

  // Check for Spain
  if (containsAny(combinedText, ["spain", "españa", "espana"])) {
    return {
      category: "spain", 
      eligible: true,
      reason: "Location is in Spain"
    };
  }

  // Check for Europe/EU
  if (containsAny(combinedText, ["europe", "european union", "eu", "emea"])) {
    return {
      category: "europe",
      eligible: true,
      reason: "Location is in Europe/EMEA"
    };
  }

  // Check for remote with country restrictions
  if (containsAny(combinedText, ["remote", "anywhere", "fully remote"])) {
    // US-only remote - not eligible
    if (containsAny(combinedText, ["united states", "us only", "usa only", "america only", "north america only"])) {
      return {
        category: "remote_us_only",
        eligible: false,
        reason: "Remote position is US-only"
      };
    }

    // Canada-only remote - not eligible  
    if (containsAny(combinedText, ["canada only"])) {
      return {
        category: "remote_us_only",
        eligible: false,
        reason: "Remote position is Canada-only"
      };
    }

    // Europe remote
    if (containsAny(combinedText, ["europe", "european", "eu", "emea"])) {
      return {
        category: "remote_europe",
        eligible: true,
        reason: "Remote position available in Europe"
      };
    }

    // Spain remote
    if (containsAny(combinedText, ["spain", "españa", "espana"])) {
      return {
        category: "remote_spain", 
        eligible: true,
        reason: "Remote position available in Spain"
      };
    }

    // Global remote with no restrictions
    if (remotePreference === "remote_only" || remotePreference === "remote_or_hybrid") {
      return {
        category: "remote_global",
        eligible: true,
        reason: "Global remote position"
      };
    }

    // Unknown remote - depends on preference
    if (remotePreference === "any" || openToRelocation) {
      return {
        category: "remote_unknown",
        eligible: true,
        reason: "Remote position (location unspecified)"
      };
    }

    return {
      category: "remote_unknown",
      eligible: false,
      reason: "Remote position but preference not aligned"
    };
  }

  // Check for incompatible onsite locations
  const incompatibleLocations = [
    "san francisco", "new york", "seattle", "boston", "austin", 
    "los angeles", "chicago", "denver", "portland", "atlanta",
    "miami", "dallas", "phoenix", "philadelphia", "washington dc"
  ];

  if (containsAny(location, incompatibleLocations) && !containsAny(combinedText, ["remote"])) {
    return {
      category: "onsite_incompatible",
      eligible: false,
      reason: "Onsite position in incompatible location"
    };
  }

  // Check excluded countries
  if (excludedCountries && containsAny(combinedText, excludedCountries)) {
    return {
      category: "onsite_incompatible",
      eligible: false,
      reason: "Location in excluded country"
    };
  }

  // Check preferred locations
  if (preferredLocations && preferredLocations.length > 0 && containsAny(combinedText, preferredLocations)) {
    return {
      category: "spain", // Default to spain for preferred locations
      eligible: true,
      reason: "Location matches preferences"
    };
  }

  // Check preferred countries
  if (preferredCountries && preferredCountries.length > 0 && containsAny(combinedText, preferredCountries)) {
    return {
      category: "europe", // Default to europe for preferred countries
      eligible: true,
      reason: "Location matches preferred countries"
    };
  }

  // Unknown location
  return {
    category: "unknown",
    eligible: false,
    reason: "Location unknown or not specified"
  };
}
