export type ParsedResume = {
  summary: string;
  experience: string;
  projects: string;
  skills: string;
  education: string;
  languages: string;
  links: string;
};

const SECTION_HEADINGS: Array<{ key: keyof ParsedResume; patterns: RegExp[] }> = [
  {
    key: "summary",
    patterns: [/^(summary|profile|about|objective|professional\s+summary|about\s+me)\s*$/i],
  },
  {
    key: "experience",
    patterns: [/^(experience|work\s+experience|employment|professional\s+experience|career\s+history)\s*$/i],
  },
  {
    key: "projects",
    patterns: [/^(projects|personal\s+projects|side\s+projects|portfolio)\s*$/i],
  },
  {
    key: "skills",
    patterns: [/^(skills|technical\s+skills|core\s+competencies|competencies|technologies)\s*$/i],
  },
  {
    key: "education",
    patterns: [/^(education|academic\s+background|qualifications|studies)\s*$/i],
  },
  {
    key: "languages",
    patterns: [/^(languages|spoken\s+languages|language\s+proficiency)\s*$/i],
  },
  {
    key: "links",
    patterns: [/^(links|online\s+presence|portfolio\s+links|contact|contacts|social)\s*$/i],
  },
];

const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/g;

type ProjectLinkEntry = {
  namePatterns: string[];
  liveDemo?: string;
  github?: string;
};

const PROJECT_LINK_MAP: ProjectLinkEntry[] = [
  {
    namePatterns: ["projectflow", "project flow"],
    liveDemo: "https://projectflow-ai-chi.vercel.app/",
    github: "https://github.com/SantiNones/projectflow-ai",
  },
  {
    namePatterns: ["career autopilot", "careerautopilot"],
    github: "https://github.com/SantiNones/career-autopilot",
  },
  {
    namePatterns: ["ethnicraft"],
    liveDemo: "https://ethnicraft-hek8qyip6-santiago-nones-projects.vercel.app/",
    github: "https://github.com/SantiNones/ethnicraft",
  },
  {
    namePatterns: ["rise app", "rise habit", "rise-habit", "^rise\\b"],
    liveDemo: "https://rise-app.onrender.com/",
    github: "https://github.com/SantiNones/rise-habit-tracker",
  },
  {
    namePatterns: ["station"],
    github: "https://github.com/SantiNones/station-app",
  },
];

function detectHeading(line: string): keyof ParsedResume | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  for (const section of SECTION_HEADINGS) {
    for (const pattern of section.patterns) {
      if (pattern.test(trimmed)) {
        return section.key;
      }
    }
  }
  return null;
}

function labelUrl(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("linkedin.com")) return `LinkedIn: ${url}`;
  if (lower.includes("github.com")) return `GitHub: ${url}`;
  if (lower.includes("vercel.app") || lower.includes("render.com") || lower.includes("netlify.app")) return `Portfolio: ${url}`;
  return url;
}

function extractPersonalLinksFromHeader(headerLines: string[]): string {
  const text = headerLines.join(" ");
  const rawUrls = text.match(URL_REGEX) ?? [];
  const cleaned = rawUrls.map((u) => u.replace(/[.,;)]+$/, ""));
  const uniqueUrls = Array.from(new Set(cleaned));

  const personalUrls = uniqueUrls.filter((url) => {
    const lower = url.toLowerCase();
    return (
      lower.includes("linkedin.com") ||
      lower.includes("github.com")
    );
  });

  if (!personalUrls.length) return "";
  return personalUrls.map(labelUrl).join("\n");
}

function backfillProjectLinks(projectsText: string): string {
  if (!projectsText.trim()) return projectsText;

  const blocks = projectsText.split(/\n{2,}/);

  const patched = blocks.map((block) => {
    const firstLine = block.split("\n")[0].toLowerCase();

    const meta = PROJECT_LINK_MAP.find((entry) =>
      entry.namePatterns.some((p) => {
        try {
          return new RegExp(p, "i").test(firstLine);
        } catch {
          return firstLine.includes(p);
        }
      }),
    );
    if (!meta) return block;

    const blockLower = block.toLowerCase();
    const lines = block.split("\n");
    const insertAfter = 0;
    const toInsert: string[] = [];

    if (meta.liveDemo && !blockLower.includes(meta.liveDemo.toLowerCase()) && !blockLower.includes("live demo") && !blockLower.includes("livedemo")) {
      toInsert.push(`Live Demo: ${meta.liveDemo}`);
    }
    if (meta.github && !blockLower.includes(meta.github.toLowerCase()) && !blockLower.includes("github:")) {
      toInsert.push(`GitHub: ${meta.github}`);
    }

    if (!toInsert.length) return block;

    return [
      ...lines.slice(0, insertAfter + 1),
      ...toInsert,
      ...lines.slice(insertAfter + 1),
    ].join("\n");
  });

  return patched.join("\n\n");
}

function mergeLinksText(existing: string, incoming: string): string {
  if (!incoming) return existing;
  if (!existing) return incoming;
  const existingLines = existing.split("\n").map((l) => l.trim()).filter(Boolean);
  const incomingLines = incoming.split("\n").map((l) => l.trim()).filter(Boolean);
  const toAdd = incomingLines.filter((l) => !existingLines.some((e) => e.includes(l) || l.includes(e)));
  if (!toAdd.length) return existing;
  return [...existingLines, ...toAdd].join("\n");
}

export function parseResume(rawText: string): ParsedResume {
  const result: ParsedResume = {
    summary: "",
    experience: "",
    projects: "",
    skills: "",
    education: "",
    languages: "",
    links: "",
  };

  const lines = rawText.split(/\r?\n/);
  let currentSection: keyof ParsedResume | null = null;
  const sectionLines: Partial<Record<keyof ParsedResume, string[]>> = {};
  const preHeaderLines: string[] = [];

  for (const line of lines) {
    const heading = detectHeading(line);
    if (heading) {
      currentSection = heading;
      if (!sectionLines[currentSection]) {
        sectionLines[currentSection] = [];
      }
    } else if (currentSection) {
      sectionLines[currentSection] = sectionLines[currentSection] ?? [];
      sectionLines[currentSection]!.push(line);
    } else {
      preHeaderLines.push(line);
    }
  }

  const hasSections = Object.keys(sectionLines).length > 0;

  if (!hasSections) {
    return result;
  }

  for (const key of Object.keys(result) as Array<keyof ParsedResume>) {
    const sLines = sectionLines[key];
    if (sLines) {
      result[key] = sLines.join("\n").replace(/^\n+|\n+$/g, "").trim();
    }
  }

  const headerLinks = extractPersonalLinksFromHeader(preHeaderLines);
  if (headerLinks) {
    result.links = mergeLinksText(result.links, headerLinks);
  }

  if (result.projects) {
    result.projects = backfillProjectLinks(result.projects);
  }

  return result;
}
