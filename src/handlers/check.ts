import type { Env, CheckResult, CompatibilityIssue } from "../mcp/types";
import { fetchPatternIndex, findPatternCategory } from "../lib/github";
import { getCachedIndex, setCachedIndex } from "../lib/cache";
import { PatternNotFoundError } from "../utils/errors";

// Pattern requirements (package -> minimum version)
const PATTERN_REQUIREMENTS: Record<string, Record<string, string>> = {
  "supabase-client-nextjs": {
    next: ">=14.0.0",
    "@supabase/supabase-js": ">=2.49.0",
    "@supabase/ssr": ">=0.5.0",
  },
  "supabase-google-oauth": {
    next: ">=14.0.0",
    "@supabase/supabase-js": ">=2.49.0",
    "@supabase/ssr": ">=0.5.0",
  },
  "supabase-github-oauth": {
    next: ">=14.0.0",
    "@supabase/supabase-js": ">=2.49.0",
    "@supabase/ssr": ">=0.5.0",
  },
  "supabase-magic-link": {
    next: ">=14.0.0",
    "@supabase/supabase-js": ">=2.49.0",
    "@supabase/ssr": ">=0.5.0",
  },
  "supabase-protected-routes": {
    next: ">=14.0.0",
    "@supabase/supabase-js": ">=2.49.0",
    "@supabase/ssr": ">=0.5.0",
  },
  "supabase-signout": {
    next: ">=14.0.0",
    "@supabase/supabase-js": ">=2.49.0",
    "@supabase/ssr": ">=0.5.0",
  },
  "stripe-checkout-session": {
    next: ">=14.0.0",
    stripe: ">=14.0.0",
  },
  "stripe-webhook-handler": {
    next: ">=14.0.0",
    stripe: ">=14.0.0",
  },
  "stripe-customer-portal": {
    next: ">=14.0.0",
    stripe: ">=14.0.0",
  },
  "supabase-rls-policies": {},
  "docker-compose-dev": {},
  "github-actions-vercel": {},
  "rate-limiting-upstash": {
    next: ">=14.0.0",
    "@upstash/ratelimit": ">=2.0.0",
    "@upstash/redis": ">=1.34.0",
  },
};

export async function handleCheck(
  patternId: string,
  dependencies: Record<string, string>,
  env: Env
): Promise<CheckResult> {
  // Verify pattern exists
  let index = await getCachedIndex(env);
  if (!index) {
    index = await fetchPatternIndex();
    await setCachedIndex(env, index);
  }

  const category = findPatternCategory(index, patternId);
  if (!category) {
    throw new PatternNotFoundError(patternId);
  }

  const requirements = PATTERN_REQUIREMENTS[patternId] ?? {};
  const issues: CompatibilityIssue[] = [];
  const missing: string[] = [];

  for (const [pkg, requiredVersion] of Object.entries(requirements)) {
    const currentVersion = dependencies[pkg] || dependencies[`${pkg}`];

    if (!currentVersion) {
      missing.push(pkg);
      continue;
    }

    // Check version compatibility
    if (!isVersionCompatible(currentVersion, requiredVersion)) {
      issues.push({
        type: "version_mismatch",
        package: pkg,
        current: currentVersion,
        required: requiredVersion,
        severity: "error",
      });
    }
  }

  const compatible = issues.length === 0 && missing.length === 0;

  // Build install command for missing packages
  let installCommand: string | undefined;
  if (missing.length > 0) {
    const installs = missing.map((pkg) => {
      const version = requirements[pkg];
      // Extract minimum version from requirement
      const minVersion = version?.replace(/[>=<^~]/g, "") ?? "latest";
      return `${pkg}@^${minVersion}`;
    });
    installCommand = `npm install ${installs.join(" ")}`;
  }

  return {
    compatible,
    issues,
    missing,
    install_command: installCommand,
  };
}

function isVersionCompatible(current: string, required: string): boolean {
  // Clean version strings
  const cleanCurrent = current.replace(/[\^~>=<]/g, "").split("-")[0];
  const cleanRequired = required.replace(/[\^~>=<]/g, "").split("-")[0];

  const currentParts = cleanCurrent.split(".").map(Number);
  const requiredParts = cleanRequired.split(".").map(Number);

  // If required starts with >=, check if current >= required
  if (required.startsWith(">=")) {
    for (let i = 0; i < 3; i++) {
      const curr = currentParts[i] ?? 0;
      const req = requiredParts[i] ?? 0;
      if (curr > req) return true;
      if (curr < req) return false;
    }
    return true; // Equal
  }

  // Default: major version must match, minor/patch can be higher
  if (currentParts[0] !== requiredParts[0]) {
    return currentParts[0] > requiredParts[0];
  }

  return true;
}
