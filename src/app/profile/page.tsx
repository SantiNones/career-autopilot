import Link from "next/link";

import { prisma } from "@/lib/db";
import { MasterResumeForm } from "@/components/MasterResumeForm";
import { ProfileForm } from "@/components/ProfileForm";
import { ExperienceIntelligencePanel } from "@/components/ExperienceIntelligencePanel";
import { CandidateIntelligencePanel } from "@/components/CandidateIntelligencePanel";

function NavBar() {
  return (
    <nav className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            CA
          </div>
          <span className="text-sm font-semibold text-zinc-900">Career Autopilot</span>
        </Link>
        <Link href="/" className="text-sm text-zinc-500 transition-colors hover:text-zinc-900">
          ← Dashboard
        </Link>
      </div>
    </nav>
  );
}

export const dynamic = "force-dynamic";

function resumeToForm(r: { rawText: string | null; summary: string | null; experience: string | null; projects: string | null; skills: string | null; education: string | null; languages: string | null; links: string | null } | null) {
  if (!r) return null;
  return {
    rawText: r.rawText ?? "",
    summary: r.summary ?? "",
    experience: r.experience ?? "",
    projects: r.projects ?? "",
    skills: r.skills ?? "",
    education: r.education ?? "",
    languages: r.languages ?? "",
    links: r.links ?? "",
  };
}

export default async function ProfilePage() {
  const [profile, resume] = await Promise.all([
    prisma.userProfile.findFirst({
      include: { preferences: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.resumeMaster.findFirst({ orderBy: { createdAt: "asc" } }),
  ]);

  if (!profile || !profile.preferences) {
    const created = await prisma.userProfile.create({
      data: {
        fullName: null,
        headline: null,
        location: null,
        languages: [],
        preferences: { create: {} },
      },
      include: { preferences: true },
    });

    const prefs = created.preferences;
    if (!prefs) {
      throw new Error("CandidatePreferences creation failed");
    }

    return (
      <div className="min-h-screen bg-zinc-50">
        <NavBar />
        <main className="mx-auto max-w-5xl px-6 py-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-zinc-900">Profile &amp; Preferences</h1>
            <p className="mt-0.5 text-sm text-zinc-500">Used to score and rank job postings.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <ProfileForm
              initial={{
                fullName: created.fullName,
                headline: created.headline,
                location: created.location,
                phone: (created as { phone?: string | null }).phone ?? null,
                email: (created as { email?: string | null }).email ?? null,
                linkedinUrl: (created as { linkedinUrl?: string | null }).linkedinUrl ?? null,
                githubUrl: (created as { githubUrl?: string | null }).githubUrl ?? null,
                portfolioUrl: (created as { portfolioUrl?: string | null }).portfolioUrl ?? null,
                languages: (created.languages as unknown as string[]) ?? [],
                preferences: {
                  targetTitles:
                    (prefs.targetTitles as unknown as string[]) ?? [],
                  positiveKeywords:
                    (prefs.positiveKeywords as unknown as string[]) ?? [],
                  negativeKeywords:
                    (prefs.negativeKeywords as unknown as string[]) ?? [],
                  minNetEurPerMonth: prefs.minNetEurPerMonth,
                  preferredCountries:
                    (prefs.preferredCountries as unknown as string[]) ?? [],
                  preferredCities:
                    (prefs.preferredCities as unknown as string[]) ?? [],
                  preferredWorkMode: prefs.preferredWorkMode,
                  targetSeniority: prefs.targetSeniority,
                  // Career Goals fields
                  primaryCareerGoal: prefs.primaryCareerGoal,
                  secondaryCareerGoals:
                    (prefs.secondaryCareerGoals as unknown as string[]) ?? [],
                  targetRoleFamilies:
                    (prefs.targetRoleFamilies as unknown as string[]) ?? [],
                  acceptableSteppingStoneRoles:
                    (prefs.acceptableSteppingStoneRoles as unknown as string[]) ?? [],
                  rolesToAvoid:
                    (prefs.rolesToAvoid as unknown as string[]) ?? [],
                  careerHorizon: prefs.careerHorizon,
                  optimizationPriority: prefs.optimizationPriority,
                },
              }}
            />
          </div>

          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">Master Resume</h2>
              <p className="mt-0.5 text-sm text-zinc-500">Source of truth for tailored application materials.</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <MasterResumeForm initial={resumeToForm(resume)} />
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">Experience Intelligence</h2>
              <p className="mt-0.5 text-sm text-zinc-500">Structured insights extracted from your work history.</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <ExperienceIntelligencePanel />
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">Candidate Intelligence</h2>
              <p className="mt-0.5 text-sm text-zinc-500">Structured candidate model for career matching and positioning.</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <CandidateIntelligencePanel />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <NavBar />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-zinc-900">Profile &amp; Preferences</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Used to score and rank job postings.</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <ProfileForm
            initial={{
              fullName: profile.fullName,
              headline: profile.headline,
              location: profile.location,
              phone: (profile as { phone?: string | null }).phone ?? null,
              email: (profile as { email?: string | null }).email ?? null,
              linkedinUrl: (profile as { linkedinUrl?: string | null }).linkedinUrl ?? null,
              githubUrl: (profile as { githubUrl?: string | null }).githubUrl ?? null,
              portfolioUrl: (profile as { portfolioUrl?: string | null }).portfolioUrl ?? null,
              languages: (profile.languages as unknown as string[]) ?? [],
              preferences: {
                targetTitles:
                  (profile.preferences.targetTitles as unknown as string[]) ?? [],
                positiveKeywords:
                  (profile.preferences.positiveKeywords as unknown as string[]) ?? [],
                negativeKeywords:
                  (profile.preferences.negativeKeywords as unknown as string[]) ?? [],
                minNetEurPerMonth: profile.preferences.minNetEurPerMonth,
                preferredCountries:
                  (profile.preferences.preferredCountries as unknown as string[]) ?? [],
                preferredCities:
                  (profile.preferences.preferredCities as unknown as string[]) ?? [],
                preferredWorkMode: profile.preferences.preferredWorkMode,
                targetSeniority: profile.preferences.targetSeniority,
                // Career Goals fields
                primaryCareerGoal: profile.preferences.primaryCareerGoal,
                secondaryCareerGoals:
                  (profile.preferences.secondaryCareerGoals as unknown as string[]) ?? [],
                targetRoleFamilies:
                  (profile.preferences.targetRoleFamilies as unknown as string[]) ?? [],
                acceptableSteppingStoneRoles:
                  (profile.preferences.acceptableSteppingStoneRoles as unknown as string[]) ?? [],
                rolesToAvoid:
                  (profile.preferences.rolesToAvoid as unknown as string[]) ?? [],
                careerHorizon: profile.preferences.careerHorizon,
                optimizationPriority: profile.preferences.optimizationPriority,
              },
            }}
          />
        </div>

        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Master Resume</h2>
            <p className="mt-0.5 text-sm text-zinc-500">Source of truth for tailored application materials.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <MasterResumeForm initial={resumeToForm(resume)} />
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Experience Intelligence</h2>
            <p className="mt-0.5 text-sm text-zinc-500">Structured insights extracted from your work history.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <ExperienceIntelligencePanel />
          </div>
        </div>
      </main>
    </div>
  );
}
