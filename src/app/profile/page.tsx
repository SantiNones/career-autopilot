import Link from "next/link";

import { prisma } from "@/lib/db";
import { ProfileForm } from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await prisma.userProfile.findFirst({
    include: { preferences: true },
    orderBy: { createdAt: "asc" },
  });

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
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10 text-zinc-900">
        <Link href="/" className="text-sm text-zinc-600 hover:underline">
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <ProfileForm
            initial={{
              fullName: created.fullName,
              headline: created.headline,
              location: created.location,
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
              },
            }}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10 text-zinc-900">
      <Link href="/" className="text-sm text-zinc-600 hover:underline">
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <ProfileForm
          initial={{
            fullName: profile.fullName,
            headline: profile.headline,
            location: profile.location,
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
            },
          }}
        />
      </section>
    </main>
  );
}
