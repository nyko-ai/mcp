import { Redis } from "@upstash/redis/cloudflare";
import type { Env, PatternIndex, Pattern } from "../mcp/types";

const INDEX_CACHE_KEY = "nyko:index";
const PATTERN_CACHE_PREFIX = "nyko:pattern:";
const DEFAULT_TTL = 3600; // 1 hour

function getRedisClient(env: Env): Redis | null {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export async function getCachedIndex(env: Env): Promise<PatternIndex | null> {
  const redis = getRedisClient(env);
  if (!redis) return null;

  try {
    const cached = await redis.get<PatternIndex>(INDEX_CACHE_KEY);
    return cached;
  } catch {
    // Cache errors are non-fatal
    return null;
  }
}

export async function setCachedIndex(
  env: Env,
  index: PatternIndex
): Promise<void> {
  const redis = getRedisClient(env);
  if (!redis) return;

  try {
    await redis.set(INDEX_CACHE_KEY, index, { ex: DEFAULT_TTL });
  } catch {
    // Cache errors are non-fatal
  }
}

export async function getCachedPattern(
  env: Env,
  patternId: string
): Promise<Pattern | null> {
  const redis = getRedisClient(env);
  if (!redis) return null;

  try {
    const cached = await redis.get<Pattern>(
      `${PATTERN_CACHE_PREFIX}${patternId}`
    );
    return cached;
  } catch {
    return null;
  }
}

export async function setCachedPattern(
  env: Env,
  pattern: Pattern
): Promise<void> {
  const redis = getRedisClient(env);
  if (!redis) return;

  try {
    await redis.set(`${PATTERN_CACHE_PREFIX}${pattern.id}`, pattern, {
      ex: DEFAULT_TTL,
    });
  } catch {
    // Cache errors are non-fatal
  }
}

export async function getCachedOrFetch<T>(
  env: Env,
  key: string,
  fetcher: () => Promise<T>,
  ttl = DEFAULT_TTL
): Promise<T> {
  const redis = getRedisClient(env);

  if (redis) {
    try {
      const cached = await redis.get<T>(key);
      if (cached) return cached;
    } catch {
      // Continue to fetch
    }
  }

  const fresh = await fetcher();

  if (redis) {
    try {
      await redis.set(key, fresh, { ex: ttl });
    } catch {
      // Non-fatal
    }
  }

  return fresh;
}
