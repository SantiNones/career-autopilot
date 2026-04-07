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
};

type Profile = {
  fullName: string | null;
  headline: string | null;
  location: string | null;
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

  const payload = useMemo(() => {
    const min = minNet.trim() ? Number(minNet) : null;
    return {
      fullName: fullName.trim() || null,
      headline: headline.trim() || null,
      location: location.trim() || null,
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
      },
    };
  }, [
    fullName,
    headline,
    location,
    languages,
    targetTitles,
    positiveKeywords,
    negativeKeywords,
    minNet,
    preferredCountries,
    preferredCities,
    preferredWorkMode,
    targetSeniority,
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
    <div className="flex flex-col gap-4">
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
          <label className="text-sm font-medium text-zinc-900">Headline</label>
          <input
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-900">Location</label>
          <input
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-900">
            Languages (one per line)
          </label>
          <textarea
            className="min-h-24 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
          />
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
