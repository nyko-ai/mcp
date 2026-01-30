import type { Env, SearchResult } from "../mcp/types";
import { fetchPatternIndex } from "../lib/github";
import { getCachedIndex, setCachedIndex } from "../lib/cache";

export async function handleSearch(
  query: string,
  category: string | undefined,
  env: Env
): Promise<SearchResult> {
  // Get index (cached or fresh)
  let index = await getCachedIndex(env);
  if (!index) {
    index = await fetchPatternIndex();
    await setCachedIndex(env, index);
  }

  // Normalize query for search
  const searchTerms = query.toLowerCase().split(/\s+/);

  // Filter patterns
  let patterns = index.patterns;

  // Filter by category if specified
  if (category) {
    patterns = patterns.filter((p) => p.category === category);
  }

  // Search by query terms
  const scored = patterns
    .map((pattern) => {
      let score = 0;
      const searchableText = [
        pattern.name,
        pattern.description,
        ...pattern.tags,
        pattern.id,
        pattern.category,
      ]
        .join(" ")
        .toLowerCase();

      for (const term of searchTerms) {
        if (searchableText.includes(term)) {
          score += 1;
          // Boost for exact tag match
          if (pattern.tags.some((t) => t.toLowerCase() === term)) {
            score += 2;
          }
          // Boost for ID match
          if (pattern.id.toLowerCase().includes(term)) {
            score += 1;
          }
        }
      }

      return { pattern, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  // Format results
  const results = scored.map(({ pattern }) => ({
    id: pattern.id,
    name: pattern.name,
    description: pattern.description,
    category: pattern.category,
    difficulty: pattern.difficulty,
    status: pattern.status,
    // These would come from the full pattern, but we don't have them in the index
    time_estimate: undefined,
    requires: undefined,
    enables: undefined,
  }));

  return {
    patterns: results,
    total: results.length,
  };
}
