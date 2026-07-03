/**
 * Benchmark Harness — minimal test infrastructure for Career Autopilot benchmarks.
 * No external test framework dependency. Prints PASS/FAIL, summarizes results.
 */

export interface BenchmarkResult {
  suite: string;
  name: string;
  passed: boolean;
  message?: string;
  duration: number;
}

export interface SuiteResult {
  suite: string;
  results: BenchmarkResult[];
  passed: number;
  failed: number;
  duration: number;
}

type BenchmarkFn = () => void | Promise<void>;

interface BenchmarkCase {
  name: string;
  fn: BenchmarkFn;
}

export class BenchmarkSuite {
  private cases: BenchmarkCase[] = [];
  private suiteName: string;

  constructor(name: string) {
    this.suiteName = name;
  }

  add(name: string, fn: BenchmarkFn): void {
    this.cases.push({ name, fn });
  }

  async run(): Promise<SuiteResult> {
    const results: BenchmarkResult[] = [];
    const suiteStart = Date.now();

    console.log(`\n━━━ ${this.suiteName} ━━━`);

    for (const tc of this.cases) {
      const start = Date.now();
      try {
        await tc.fn();
        const duration = Date.now() - start;
        results.push({ suite: this.suiteName, name: tc.name, passed: true, duration });
        console.log(`  ✓ ${tc.name} (${duration}ms)`);
      } catch (err: unknown) {
        const duration = Date.now() - start;
        const message = err instanceof Error ? err.message : String(err);
        results.push({ suite: this.suiteName, name: tc.name, passed: false, message, duration });
        console.log(`  ✗ ${tc.name} (${duration}ms)`);
        console.log(`    → ${message}`);
      }
    }

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const duration = Date.now() - suiteStart;

    console.log(`  ${passed} passed, ${failed} failed (${duration}ms)\n`);

    return { suite: this.suiteName, results, passed, failed, duration };
  }
}

// --- Assertion helpers ---

export function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

export function assertInRange(value: number, min: number, max: number, label: string): void {
  if (value < min || value > max) {
    throw new Error(`${label}: expected ${min}–${max}, got ${value}`);
  }
}

export function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected "${expected}", got "${actual}"`);
  }
}

export function assertIncludes(arr: string[], item: string, label: string): void {
  if (!arr.includes(item)) {
    throw new Error(`${label}: expected array to include "${item}", got [${arr.slice(0, 5).join(", ")}]`);
  }
}

export function assertNotEmpty(arr: unknown[], label: string): void {
  if (!arr || arr.length === 0) {
    throw new Error(`${label}: expected non-empty array`);
  }
}

export function assertContainsAny(text: string, terms: string[], label: string): void {
  const lower = text.toLowerCase();
  const found = terms.some(t => lower.includes(t.toLowerCase()));
  if (!found) {
    throw new Error(`${label}: expected text to contain any of [${terms.slice(0, 5).join(", ")}]`);
  }
}

// --- Summary printer ---

export function printSummary(suites: SuiteResult[]): { totalPassed: number; totalFailed: number } {
  const totalPassed = suites.reduce((s, r) => s + r.passed, 0);
  const totalFailed = suites.reduce((s, r) => s + r.failed, 0);
  const totalDuration = suites.reduce((s, r) => s + r.duration, 0);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("BENCHMARK SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  for (const suite of suites) {
    const icon = suite.failed === 0 ? "✓" : "✗";
    console.log(`  ${icon} ${suite.suite}: ${suite.passed} passed, ${suite.failed} failed (${suite.duration}ms)`);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed (${totalDuration}ms)`);
  console.log(`STATUS: ${totalFailed === 0 ? "✓ ALL PASS" : "✗ FAILURES DETECTED"}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  return { totalPassed, totalFailed };
}
