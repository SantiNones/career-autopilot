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
    }
  }

  const hasSections = Object.keys(sectionLines).length > 0;

  if (!hasSections) {
    return result;
  }

  for (const key of Object.keys(result) as Array<keyof ParsedResume>) {
    const lines = sectionLines[key];
    if (lines) {
      result[key] = lines.join("\n").replace(/^\n+|\n+$/g, "").trim();
    }
  }

  return result;
}
