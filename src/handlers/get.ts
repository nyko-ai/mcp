import type { Env, Pattern } from "../mcp/types";
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

export async function handleGet(
  patternId: string,
  hasSrcDir: boolean | undefined,
  env: Env
): Promise<{ pattern: Pattern }> {
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

  // Adjust file paths if project uses src/ directory
  if (hasSrcDir && pattern.files) {
    pattern = {
      ...pattern,
      files: pattern.files.map((file) => ({
        ...file,
        path: adjustPathForSrcDir(file.path),
      })),
    };
  }

  return { pattern };
}

function adjustPathForSrcDir(path: string): string {
  // Common patterns that should be in src/
  const srcPrefixes = ["lib/", "utils/", "components/", "hooks/", "app/"];

  for (const prefix of srcPrefixes) {
    if (path.startsWith(prefix)) {
      return `src/${path}`;
    }
  }

  return path;
}
