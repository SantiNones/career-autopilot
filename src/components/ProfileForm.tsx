"use client";

import { useMemo, useState } from "react";

type Preferences = {
  targetTitles: string[];
  positiveKeywords: string[];
  negativeKeywords: string[];
  minNetEurPerMonth: number | null;
  preferredCountries: string[];
  preferredCities: string[];
  preferredWorkMode: string | null;
  targetSeniority: string | null;
  // Career Goals fields
  primaryCareerGoal: string | null;
  secondaryCareerGoals: string[];
  targetRoleFamilies: string[];
  acceptableSteppingStoneRoles: string[];
  rolesToAvoid: string[];
  careerHorizon: string | null;
  optimizationPriority: string | null;
};

type Profile = {
  fullName: string | null;
  headline: string | null;
  location: string | null;
  phone: string | null;
  email: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  languages: string[];
  preferences: Preferences;
};

function splitLines(v: string): string[] {
  return v
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinLines(v: string[]): string {
  return v.join("\n");
}

export function ProfileForm(props: { initial: Profile }) {
  const [fullName, setFullName] = useState(props.initial.fullName ?? "");
  const [headline, setHeadline] = useState(props.initial.headline ?? "");
  const [location, setLocation] = useState(props.initial.location ?? "");
  const [phone, setPhone] = useState(props.initial.phone ?? "");
  const [email, setEmail] = useState(props.initial.email ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(props.initial.linkedinUrl ?? "");
  const [githubUrl, setGithubUrl] = useState(props.initial.githubUrl ?? "");
  const [portfolioUrl, setPortfolioUrl] = useState(props.initial.portfolioUrl ?? "");
  const [languages, setLanguages] = useState(joinLines(props.initial.languages ?? []));

  const [targetTitles, setTargetTitles] = useState(
    joinLines(props.initial.preferences.targetTitles ?? []),
  );
  const [positiveKeywords, setPositiveKeywords] = useState(
    joinLines(props.initial.preferences.positiveKeywords ?? []),
  );
  const [negativeKeywords, setNegativeKeywords] = useState(
    joinLines(props.initial.preferences.negativeKeywords ?? []),
  );
  const [minNet, setMinNet] = useState(
    props.initial.preferences.minNetEurPerMonth?.toString() ?? "",
  );
  const [preferredCountries, setPreferredCountries] = useState(
    joinLines(props.initial.preferences.preferredCountries ?? []),
  );
  const [preferredCities, setPreferredCities] = useState(
    joinLines(props.initial.preferences.preferredCities ?? []),
  );
  const [preferredWorkMode, setPreferredWorkMode] = useState(
    props.initial.preferences.preferredWorkMode ?? "",
  );
  const [targetSeniority, setTargetSeniority] = useState(
    props.initial.preferences.targetSeniority ?? "",
  );

  // Career Goals state variables
  const [primaryCareerGoal, setPrimaryCareerGoal] = useState(
    props.initial.preferences.primaryCareerGoal ?? "",
  );
  const [secondaryCareerGoals, setSecondaryCareerGoals] = useState(
    joinLines(props.initial.preferences.secondaryCareerGoals ?? []),
  );
  const [targetRoleFamilies, setTargetRoleFamilies] = useState(
    joinLines(props.initial.preferences.targetRoleFamilies ?? []),
  );
  const [acceptableSteppingStoneRoles, setAcceptableSteppingStoneRoles] = useState(
    joinLines(props.initial.preferences.acceptableSteppingStoneRoles ?? []),
  );
  const [rolesToAvoid, setRolesToAvoid] = useState(
    joinLines(props.initial.preferences.rolesToAvoid ?? []),
  );
  const [careerHorizon, setCareerHorizon] = useState(
    props.initial.preferences.careerHorizon ?? "",
  );
  const [optimizationPriority, setOptimizationPriority] = useState(
    props.initial.preferences.optimizationPriority ?? "",
  );

  const payload = useMemo(() => {
    const min = minNet.trim() ? Number(minNet) : null;
    return {
      fullName: fullName.trim() || null,
      headline: headline.trim() || null,
      location: location.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      linkedinUrl: linkedinUrl.trim() || null,
      githubUrl: githubUrl.trim() || null,
      portfolioUrl: portfolioUrl.trim() || null,
      languages: splitLines(languages),
      preferences: {
        targetTitles: splitLines(targetTitles),
        positiveKeywords: splitLines(positiveKeywords),
        negativeKeywords: splitLines(negativeKeywords),
        minNetEurPerMonth: Number.isFinite(min as number) ? min : null,
        preferredCountries: splitLines(preferredCountries),
        preferredCities: splitLines(preferredCities),
        preferredWorkMode: preferredWorkMode.trim() || null,
        targetSeniority: targetSeniority.trim() || null,
        // Career Goals fields
        primaryCareerGoal: primaryCareerGoal.trim() || null,
        secondaryCareerGoals: splitLines(secondaryCareerGoals),
        targetRoleFamilies: splitLines(targetRoleFamilies),
        acceptableSteppingStoneRoles: splitLines(acceptableSteppingStoneRoles),
        rolesToAvoid: splitLines(rolesToAvoid),
        careerHorizon: careerHorizon.trim() || null,
        optimizationPriority: optimizationPriority.trim() || null,
      },
    };
  }, [
    fullName,
    headline,
    location,
    phone,
    email,
    linkedinUrl,
    githubUrl,
    portfolioUrl,
    languages,
    targetTitles,
    positiveKeywords,
    negativeKeywords,
    minNet,
    preferredCountries,
    preferredCities,
    preferredWorkMode,
    targetSeniority,
    // Career Goals dependencies
    primaryCareerGoal,
    secondaryCareerGoals,
    targetRoleFamilies,
    acceptableSteppingStoneRoles,
    rolesToAvoid,
    careerHorizon,
    optimizationPriority,
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaved(false);
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  function TextArea(props2: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    hint?: string;
  }) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-900">
          {props2.label}
        </label>
        <textarea
          className="min-h-24 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          value={props2.value}
          onChange={(e) => props2.onChange(e.target.value)}
        />
        {props2.hint ? (
          <p className="text-xs text-zinc-600">{props2.hint}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-700">Personal Information</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-900">Full name</label>
            <input
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-900">Headline / Role</label>
            <input
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Full-Stack Developer"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-900">Location</label>
            <input
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Barcelona, Spain"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-900">Phone</label>
            <input
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+34 600 000 000"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-900">Email</label>
            <input
              type="email"
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-900">LinkedIn URL</label>
            <input
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/yourname"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-900">GitHub URL</label>
            <input
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/yourname"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-900">Portfolio URL</label>
            <input
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://yoursite.com"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-900">Languages (one per line)</label>
            <textarea
              className="min-h-20 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="Spanish - Native&#10;English - Fluent"
            />
          </div>
        </div>
      </div>

      <TextArea
        label="Target titles (one per line)"
        value={targetTitles}
        onChange={setTargetTitles}
      />
      <TextArea
        label="Positive keywords (one per line)"
        value={positiveKeywords}
        onChange={setPositiveKeywords}
        hint="Used to boost stack fit"
      />
      <TextArea
        label="Negative keywords (one per line)"
        value={negativeKeywords}
        onChange={setNegativeKeywords}
        hint="Used to penalize senior/lead roles"
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-900">
            Min net EUR/month
          </label>
          <input
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            value={minNet}
            onChange={(e) => setMinNet(e.target.value)}
            placeholder="2000"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-900">
            Preferred work mode
          </label>
          <input
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            value={preferredWorkMode}
            onChange={(e) => setPreferredWorkMode(e.target.value)}
            placeholder="remote_or_hybrid"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-900">
            Target seniority
          </label>
          <input
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            value={targetSeniority}
            onChange={(e) => setTargetSeniority(e.target.value)}
            placeholder="junior"
          />
        </div>
      </div>

      <TextArea
        label="Preferred countries (one per line)"
        value={preferredCountries}
        onChange={setPreferredCountries}
      />
      <TextArea
        label="Preferred cities (one per line)"
        value={preferredCities}
        onChange={setPreferredCities}
      />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-700">Career Goals</h3>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-900">Primary Career Goal</label>
            <input
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              value={primaryCareerGoal}
              onChange={(e) => setPrimaryCareerGoal(e.target.value)}
              placeholder="e.g. Become an AI-focused engineer building practical automation and agentic systems"
            />
          </div>
          
          <TextArea
            label="Secondary Career Goals (one per line)"
            value={secondaryCareerGoals}
            onChange={setSecondaryCareerGoals}
            hint="Alternative career paths or backup options"
          />
          
          <TextArea
            label="Target Role Families (one per line)"
            value={targetRoleFamilies}
            onChange={setTargetRoleFamilies}
            hint="e.g. ai_engineering, solutions_engineering, fullstack_engineering"
          />
          
          <TextArea
            label="Acceptable Stepping Stone Roles (one per line)"
            value={acceptableSteppingStoneRoles}
            onChange={setAcceptableSteppingStoneRoles}
            hint="Roles that could lead to your primary goal"
          />
          
          <TextArea
            label="Roles to Avoid (one per line)"
            value={rolesToAvoid}
            onChange={setRolesToAvoid}
            hint="Roles you definitely don't want"
          />
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-900">Career Horizon</label>
            <select
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              value={careerHorizon}
              onChange={(e) => setCareerHorizon(e.target.value)}
            >
              <option value="">Select timeframe</option>
              <option value="immediate">Immediate (0-3 months)</option>
              <option value="6_months">6 months</option>
              <option value="12_months">12 months</option>
              <option value="2_3_years">2-3 years</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-900">Optimization Priority</label>
            <select
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
              value={optimizationPriority}
              onChange={(e) => setOptimizationPriority(e.target.value)}
            >
              <option value="">Select priority</option>
              <option value="salary">Salary</option>
              <option value="learning">Learning</option>
              <option value="speed_to_job">Speed to job</option>
              <option value="remote_work">Remote work</option>
              <option value="prestige">Prestige</option>
              <option value="career_direction">Career direction</option>
              <option value="balanced">Balanced</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
          type="button"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
        {saved ? <p className="text-sm text-green-700">Saved</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
