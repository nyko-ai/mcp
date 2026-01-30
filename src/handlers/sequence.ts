import type { Env, SequenceResult, PatternIndex } from "../mcp/types";
import { fetchPatternIndex } from "../lib/github";
import { getCachedIndex, setCachedIndex } from "../lib/cache";

// Dependency graph for patterns
const PATTERN_DEPENDENCIES: Record<string, string[]> = {
  "supabase-google-oauth": ["supabase-client-nextjs"],
  "supabase-github-oauth": ["supabase-client-nextjs"],
  "supabase-magic-link": ["supabase-client-nextjs"],
  "supabase-protected-routes": ["supabase-client-nextjs"],
  "supabase-signout": ["supabase-client-nextjs"],
  "stripe-checkout-session": [],
  "stripe-webhook-handler": [],
  "stripe-customer-portal": ["stripe-checkout-session"],
  "supabase-rls-policies": ["supabase-client-nextjs"],
};

// Time estimates
const TIME_ESTIMATES: Record<string, number> = {
  "supabase-client-nextjs": 10,
  "supabase-google-oauth": 20,
  "supabase-github-oauth": 15,
  "supabase-magic-link": 15,
  "supabase-protected-routes": 10,
  "supabase-signout": 5,
  "stripe-checkout-session": 20,
  "stripe-webhook-handler": 15,
  "stripe-customer-portal": 10,
  "supabase-rls-policies": 15,
  "docker-compose-dev": 10,
  "github-actions-vercel": 10,
  "rate-limiting-upstash": 15,
};

export async function handleSequence(
  goal: string,
  alreadyImplemented: string[] | undefined,
  env: Env
): Promise<SequenceResult> {
  const implemented = new Set(alreadyImplemented ?? []);

  // Get index
  let index = await getCachedIndex(env);
  if (!index) {
    index = await fetchPatternIndex();
    await setCachedIndex(env, index);
  }

  // Find relevant patterns based on goal
  const relevantPatterns = findRelevantPatterns(goal, index);

  // Build sequence with dependencies
  const sequence = buildSequence(relevantPatterns, implemented, index);

  // Calculate total time
  const totalMinutes = sequence.reduce((sum, step) => {
    return sum + (TIME_ESTIMATES[step.id] ?? 10);
  }, 0);

  const totalTime = formatTimeEstimate(totalMinutes);

  return {
    sequence,
    total_time: totalTime,
  };
}

function findRelevantPatterns(goal: string, index: PatternIndex): string[] {
  const goalLower = goal.toLowerCase();
  const patterns: Set<string> = new Set();

  // Pattern matching rules
  const rules: Array<{ keywords: string[]; patterns: string[] }> = [
    {
      keywords: ["google", "oauth", "google auth"],
      patterns: ["supabase-google-oauth"],
    },
    {
      keywords: ["github", "github auth"],
      patterns: ["supabase-github-oauth"],
    },
    {
      keywords: ["magic link", "passwordless", "email auth"],
      patterns: ["supabase-magic-link"],
    },
    {
      keywords: ["protected", "routes", "middleware", "auth guard"],
      patterns: ["supabase-protected-routes"],
    },
    {
      keywords: ["sign out", "logout", "signout"],
      patterns: ["supabase-signout"],
    },
    {
      keywords: ["stripe", "checkout", "payment"],
      patterns: ["stripe-checkout-session"],
    },
    {
      keywords: ["webhook", "stripe webhook"],
      patterns: ["stripe-webhook-handler"],
    },
    {
      keywords: ["portal", "billing", "subscription manage"],
      patterns: ["stripe-customer-portal"],
    },
    {
      keywords: ["rls", "row level", "security policies"],
      patterns: ["supabase-rls-policies"],
    },
    {
      keywords: ["docker", "compose", "local dev"],
      patterns: ["docker-compose-dev"],
    },
    {
      keywords: ["github actions", "vercel", "ci/cd", "deploy"],
      patterns: ["github-actions-vercel"],
    },
    {
      keywords: ["rate limit", "upstash", "throttle"],
      patterns: ["rate-limiting-upstash"],
    },
    {
      keywords: ["auth", "authentication", "complete auth", "full auth"],
      patterns: [
        "supabase-client-nextjs",
        "supabase-google-oauth",
        "supabase-protected-routes",
      ],
    },
    {
      keywords: ["payments", "complete payments", "full payments"],
      patterns: [
        "stripe-checkout-session",
        "stripe-webhook-handler",
        "stripe-customer-portal",
      ],
    },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((kw) => goalLower.includes(kw))) {
      rule.patterns.forEach((p) => patterns.add(p));
    }
  }

  // If no patterns found, do a general search
  if (patterns.size === 0) {
    const terms = goalLower.split(/\s+/);
    for (const pattern of index.patterns) {
      const searchable = [pattern.name, pattern.description, ...pattern.tags]
        .join(" ")
        .toLowerCase();
      if (terms.some((t) => searchable.includes(t))) {
        patterns.add(pattern.id);
      }
    }
  }

  return Array.from(patterns);
}

function buildSequence(
  relevantPatterns: string[],
  implemented: Set<string>,
  index: PatternIndex
): Array<{ order: number; id: string; name: string; reason: string }> {
  const sequence: Array<{
    order: number;
    id: string;
    name: string;
    reason: string;
  }> = [];
  const added = new Set<string>();

  // Helper to get pattern name
  const getName = (id: string): string => {
    return index.patterns.find((p) => p.id === id)?.name ?? id;
  };

  // Recursive function to add pattern and its dependencies
  function addWithDeps(patternId: string, reason: string): void {
    if (added.has(patternId) || implemented.has(patternId)) {
      return;
    }

    // Add dependencies first
    const deps = PATTERN_DEPENDENCIES[patternId] ?? [];
    for (const dep of deps) {
      if (!added.has(dep) && !implemented.has(dep)) {
        addWithDeps(dep, `Required for ${getName(patternId)}`);
      }
    }

    // Add this pattern
    sequence.push({
      order: sequence.length + 1,
      id: patternId,
      name: getName(patternId),
      reason,
    });
    added.add(patternId);
  }

  // Add all relevant patterns
  for (const patternId of relevantPatterns) {
    addWithDeps(patternId, getPatternReason(patternId));
  }

  return sequence;
}

function getPatternReason(patternId: string): string {
  const reasons: Record<string, string> = {
    "supabase-client-nextjs": "Base Supabase setup",
    "supabase-google-oauth": "Google authentication",
    "supabase-github-oauth": "GitHub authentication",
    "supabase-magic-link": "Passwordless email login",
    "supabase-protected-routes": "Route protection",
    "supabase-signout": "Sign out functionality",
    "stripe-checkout-session": "Payment checkout",
    "stripe-webhook-handler": "Payment event handling",
    "stripe-customer-portal": "Subscription management",
    "supabase-rls-policies": "Database security",
    "docker-compose-dev": "Local development environment",
    "github-actions-vercel": "CI/CD deployment",
    "rate-limiting-upstash": "API rate limiting",
  };

  return reasons[patternId] ?? "Feature implementation";
}

function formatTimeEstimate(minutes: number): string {
  if (minutes <= 10) return "~10 min";
  if (minutes <= 15) return "10-15 min";
  if (minutes <= 30) return "20-30 min";
  if (minutes <= 45) return "30-45 min";
  if (minutes <= 60) return "45-60 min";
  return `${Math.round(minutes / 15) * 15} min`;
}
