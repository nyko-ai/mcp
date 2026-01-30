import type { Env } from "../mcp/types";
import {
  fetchPatternIndex,
  fetchPatternYaml,
  findPatternCategory,
} from "../lib/github";
import {
  getCachedIndex,
  setCachedIndex,
  getCachedPattern,
  setCachedPattern,
} from "../lib/cache";
import { PatternNotFoundError } from "../utils/errors";

interface SetupStep {
  provider: string;
  title: string;
  url: string;
  steps: string[];
}

interface EnvVarInfo {
  key: string;
  where_to_find: string;
}

interface SetupResult {
  pattern_id: string;
  pattern_name: string;
  setup_steps: SetupStep[];
  env_vars_needed: EnvVarInfo[];
}

export async function handleSetup(
  patternId: string,
  env: Env
): Promise<SetupResult> {
  // Check cache first
  let pattern = await getCachedPattern(env, patternId);

  if (!pattern) {
    // Get index to find category
    let index = await getCachedIndex(env);
    if (!index) {
      index = await fetchPatternIndex();
      await setCachedIndex(env, index);
    }

    const category = findPatternCategory(index, patternId);
    if (!category) {
      throw new PatternNotFoundError(patternId);
    }

    // Fetch the full pattern
    pattern = await fetchPatternYaml(patternId, category);
    await setCachedPattern(env, pattern);
  }

  // Extract and format external_setup
  const setupSteps: SetupStep[] = [];

  if (pattern.external_setup && Array.isArray(pattern.external_setup)) {
    for (const setup of pattern.external_setup) {
      // Handle both 'service' and 'provider' keys from YAML
      const setupData = setup as unknown as Record<string, unknown>;
      const providerName = setupData.service || setupData.provider || "Unknown";
      const url = (setupData.url as string) || "";
      const steps = (setupData.steps as string[]) || [];

      setupSteps.push({
        provider: normalizeProviderName(providerName as string),
        title: generateTitle(providerName as string),
        url,
        steps,
      });
    }
  }

  // Extract env_vars
  const envVarsNeeded: EnvVarInfo[] = [];

  // Handle env_vars.required structure from YAML
  const patternData = pattern as unknown as Record<string, unknown>;
  const envVars = patternData.env_vars as Record<string, unknown> | undefined;

  if (envVars?.required && Array.isArray(envVars.required)) {
    for (const envVar of envVars.required) {
      const varData = envVar as Record<string, unknown>;
      envVarsNeeded.push({
        key: varData.key as string,
        where_to_find: (varData.where_to_find as string) ||
                       (varData.description as string) ||
                       "Check pattern documentation",
      });
    }
  }

  // Also handle legacy env array format
  if (pattern.env && Array.isArray(pattern.env)) {
    for (const envVar of pattern.env) {
      // Avoid duplicates
      if (!envVarsNeeded.some(e => e.key === envVar.key)) {
        envVarsNeeded.push({
          key: envVar.key,
          where_to_find: envVar.description || "Check pattern documentation",
        });
      }
    }
  }

  return {
    pattern_id: pattern.id,
    pattern_name: pattern.name,
    setup_steps: setupSteps,
    env_vars_needed: envVarsNeeded,
  };
}

function normalizeProviderName(name: string): string {
  // Convert service names to provider identifiers
  const mappings: Record<string, string> = {
    "Google Cloud Console": "google_cloud",
    "Google Cloud": "google_cloud",
    "Supabase": "supabase",
    "Stripe": "stripe",
    "GitHub": "github",
    "Vercel": "vercel",
    "AWS": "aws",
    "Cloudflare": "cloudflare",
  };

  return mappings[name] || name.toLowerCase().replace(/\s+/g, "_");
}

function generateTitle(providerName: string): string {
  // Generate a descriptive title based on provider
  const titles: Record<string, string> = {
    "Google Cloud Console": "Create OAuth Credentials",
    "Google Cloud": "Create OAuth Credentials",
    "Supabase": "Configure Supabase Dashboard",
    "Stripe": "Configure Stripe Dashboard",
    "GitHub": "Configure GitHub Settings",
    "Vercel": "Configure Vercel Project",
  };

  return titles[providerName] || `Configure ${providerName}`;
}
