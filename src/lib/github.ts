import type { PatternIndex, Pattern } from "../mcp/types";
import { GitHubFetchError, PatternNotFoundError } from "../utils/errors";
import * as yaml from "js-yaml";

const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/nyko-ai/patterns/main";

export async function fetchPatternIndex(): Promise<PatternIndex> {
  const url = `${GITHUB_RAW_BASE}/patterns/_index.json`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "nyko-mcp/1.0.0",
    },
  });

  if (!response.ok) {
    throw new GitHubFetchError(url, response.status);
  }

  const data = await response.json();
  return data as PatternIndex;
}

export async function fetchPatternYaml(
  patternId: string,
  category: string
): Promise<Pattern> {
  const url = `${GITHUB_RAW_BASE}/patterns/${category}/${patternId}.yaml`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "nyko-mcp/1.0.0",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new PatternNotFoundError(patternId);
    }
    throw new GitHubFetchError(url, response.status);
  }

  const yamlText = await response.text();
  const pattern = yaml.load(yamlText) as Pattern;

  // Ensure id and category are set
  pattern.id = patternId;
  pattern.category = category;

  return pattern;
}

export function findPatternCategory(
  index: PatternIndex,
  patternId: string
): string | null {
  const entry = index.patterns.find((p) => p.id === patternId);
  return entry?.category ?? null;
}
