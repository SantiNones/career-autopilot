/**
 * Benchmark Runner — Career Autopilot
 * Executes all benchmark suites, prints PASS/FAIL, summarizes results.
 * Exits with proper exit code for CI integration.
 *
 * Usage:
 *   npx tsx benchmarks/runner.ts              # Run all suites
 *   npx tsx benchmarks/runner.ts --suite fit-analysis
 *   npx tsx benchmarks/runner.ts --suite capability-matching
 *   npx tsx benchmarks/runner.ts --suite materials
 *   npx tsx benchmarks/runner.ts --suite discovery
 *   npx tsx benchmarks/runner.ts --suite ingestion
 *   npx tsx benchmarks/runner.ts --suite regression
 */

import { printSummary, type SuiteResult } from "./lib/harness";

// --- Suite registry ---

interface SuiteEntry {
  name: string;
  path: string;
}

const ALL_SUITES: SuiteEntry[] = [
  { name: "capability-matching", path: "./capability-matching/capability.bench" },
  { name: "fit-analysis", path: "./fit-analysis/fit-analysis.bench" },
  { name: "materials", path: "./materials/materials.bench" },
  { name: "discovery", path: "./discovery/discovery.bench" },
  { name: "ingestion", path: "./ingestion/ingestion.bench" },
  { name: "regression", path: "./regression/regression.bench" },
];

// --- CLI argument parsing ---

function parseArgs(): { suites: string[] } {
  const args = process.argv.slice(2);
  const suiteIdx = args.indexOf("--suite");
  if (suiteIdx !== -1 && args[suiteIdx + 1]) {
    return { suites: [args[suiteIdx + 1]] };
  }
  return { suites: [] }; // empty = run all
}

// --- Main ---

async function main() {
  const { suites: requestedSuites } = parseArgs();

  const suitesToRun = requestedSuites.length > 0
    ? ALL_SUITES.filter(s => requestedSuites.includes(s.name))
    : ALL_SUITES;

  if (suitesToRun.length === 0) {
    console.error(`No matching suite found. Available: ${ALL_SUITES.map(s => s.name).join(", ")}`);
    process.exit(1);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("CAREER AUTOPILOT — BENCHMARK RUNNER");
  console.log(`Running ${suitesToRun.length} suite(s): ${suitesToRun.map(s => s.name).join(", ")}`);
  console.log(`Cost: $0 (deterministic, no OpenAI)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const results: SuiteResult[] = [];

  for (const entry of suitesToRun) {
    try {
      const mod = await import(entry.path);
      const suite = mod.default;
      if (!suite || typeof suite.run !== "function") {
        console.error(`  ✗ Suite "${entry.name}" does not export a valid BenchmarkSuite`);
        results.push({ suite: entry.name, results: [], passed: 0, failed: 1, duration: 0 });
        continue;
      }
      const result = await suite.run();
      results.push(result);
    } catch (err: unknown) {
      console.error(`  ✗ Suite "${entry.name}" failed to load: ${err instanceof Error ? err.message : String(err)}`);
      results.push({ suite: entry.name, results: [], passed: 0, failed: 1, duration: 0 });
    }
  }

  const { totalFailed } = printSummary(results);
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error("Fatal benchmark error:", err);
  process.exit(1);
});
