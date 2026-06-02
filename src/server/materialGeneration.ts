type Profile = {
  fullName: string | null;
  headline: string | null;
  location: string | null;
  languages: unknown;
};

type Prefs = {
  targetTitles: unknown;
  targetSeniority: string | null;
};

type Resume = {
  summary: string | null;
  experience: string | null;
  projects: string | null;
  skills: string | null;
  education: string | null;
  languages: string | null;
  links: string | null;
};

type Evaluation = {
  label: string;
  totalScore: number;
  narrativeSuggestion: string | null;
};

type Job = {
  title: string | null;
  companyName: string | null;
  location: string | null;
  rawText: string | null;
};

type GeneratedMaterials = {
  tailoredCv: string;
  coverLetter: string;
  recruiterMessage: string;
  screeningAnswers: string;
};

function str(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string").join(", ");
  return String(v);
}

function jobTitle(job: Job): string {
  return job.title ?? "this position";
}

function companyName(job: Job): string {
  return job.companyName ?? "the company";
}

function candidateName(profile: Profile): string {
  return profile.fullName ?? "Candidate";
}

export function generateMaterials(
  job: Job,
  profile: Profile,
  prefs: Prefs | null,
  resume: Resume | null,
  evaluation: Evaluation | null,
): GeneratedMaterials {
  const name = candidateName(profile);
  const title = jobTitle(job);
  const company = companyName(job);
  const headline = profile.headline ?? str(prefs?.targetTitles);
  const location = profile.location ?? job.location ?? "";
  const languages = str(resume?.languages || profile.languages);
  const seniority = prefs?.targetSeniority ?? "";

  const summary = resume?.summary?.trim() ?? "";
  const experience = resume?.experience?.trim() ?? "";
  const projects = resume?.projects?.trim() ?? "";
  const skills = resume?.skills?.trim() ?? "";
  const education = resume?.education?.trim() ?? "";
  const links = resume?.links?.trim() ?? "";

  const scoreNote =
    evaluation
      ? `[Fit score: ${evaluation.totalScore}/100 · ${evaluation.label}]`
      : "";

  // ─── Tailored CV ────────────────────────────────────────────────────────────

  const tailoredCv = `${name}
${headline}${location ? ` · ${location}` : ""}${languages ? ` · ${languages}` : ""}
${links ? links : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TARGET ROLE: ${title} @ ${company}
${scoreNote}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY
${summary || `${seniority ? seniority + " " : ""}professional with experience in ${headline || "the relevant domain"}.`}

EXPERIENCE
${experience || "[Add your experience from your master resume.]"}

${projects ? `PROJECTS\n${projects}\n\n` : ""}SKILLS
${skills || "[Add your skills from your master resume.]"}

EDUCATION
${education || "[Add your education from your master resume.]"}

${languages ? `LANGUAGES\n${languages}\n` : ""}`.trim();

  // ─── Cover Letter ────────────────────────────────────────────────────────────

  const coverLetter = `Dear ${company} Hiring Team,

I am writing to express my interest in the ${title} role at ${company}.

${summary || `As a ${seniority ? seniority + " " : ""}professional${headline ? " specialising in " + headline : ""}, I bring a strong foundation and a track record of delivering results.`}

${experience ? `My background includes:\n\n${experience.split("\n").slice(0, 8).join("\n")}` : "My professional background aligns well with the requirements of this role."}

${skills ? `My core skills include: ${skills.split("\n").slice(0, 3).join("; ")}.` : ""}

${evaluation?.narrativeSuggestion ? evaluation.narrativeSuggestion : `I am confident that my experience and skills make me a strong candidate for this position.`}

I would welcome the opportunity to discuss how my background aligns with the needs of your team.

Best regards,
${name}
${links ? links.split("\n")[0] : ""}`.trim();

  // ─── Recruiter Message ───────────────────────────────────────────────────────

  const recruiterMessage = `Hi,

I came across the ${title} opening at ${company} and wanted to reach out directly.

I'm ${name}${headline ? `, a ${headline}` : ""}${location ? ` based in ${location}` : ""}. ${
    summary
      ? summary.split(".")[0] + "."
      : `I have experience in ${headline || "this space"} and believe I could be a strong match.`
  }

${skills ? `My core skills: ${skills.split("\n").slice(0, 4).join(", ")}.` : ""}

${links ? `More about my work: ${links.split("\n")[0]}` : ""}

Would you be open to a brief conversation?

Best,
${name}`.trim();

  // ─── Screening Answers ───────────────────────────────────────────────────────

  const screeningAnswers = `SCREENING QUESTIONS — ${title} @ ${company}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Q: Tell me about yourself.
A: ${summary || `I'm ${name}${headline ? ", a " + headline : ""}${location ? ", based in " + location : ""}. I specialise in ${headline || "my field"} and have a background in ${experience ? experience.split("\n")[0] : "the relevant domain"}.`}

Q: Why are you interested in this role?
A: The ${title} role at ${company} aligns closely with my background in ${headline || "this area"}. ${evaluation?.narrativeSuggestion ? evaluation.narrativeSuggestion.split(".")[0] + "." : "I believe my experience and skills are a strong match for what you're looking for."}

Q: What are your key strengths?
A: ${skills ? skills.split("\n").slice(0, 3).join("; ") + "." : "I bring strong analytical skills, attention to detail, and a collaborative working style."}

Q: Describe a relevant project or achievement.
A: ${projects ? projects.split("\n")[0] : experience ? experience.split("\n")[0] : "[Add a specific achievement from your experience.]"}

Q: What is your availability / notice period?
A: [Add your current availability and notice period.]

Q: What are your salary expectations?
A: [Add salary expectations based on your preferences.]

Q: Any questions for us?
A: I'd love to learn more about the team structure, the biggest challenges in this role, and how success is measured in the first 6 months.`.trim();

  return { tailoredCv, coverLetter, recruiterMessage, screeningAnswers };
}
