export class PatternNotFoundError extends Error {
  constructor(patternId: string) {
    super(`Pattern not found: ${patternId}`);
    this.name = "PatternNotFoundError";
  }
}

export class InvalidRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRequestError";
  }
}

export class GitHubFetchError extends Error {
  constructor(url: string, status: number) {
    super(`Failed to fetch from GitHub: ${url} (status: ${status})`);
    this.name = "GitHubFetchError";
  }
}

export class CacheError extends Error {
  constructor(operation: string, message: string) {
    super(`Cache ${operation} failed: ${message}`);
    this.name = "CacheError";
  }
}
