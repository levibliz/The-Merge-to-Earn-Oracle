import { loadConfig } from '../config/index.js';
import { NotFoundError } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import type { GitHubUser } from '../types/github.js';

const config = loadConfig();
const GITHUB_API_BASE = 'https://api.github.com';

export class GitHubService {
  private readonly headers: Record<string, string>;

  constructor() {
    this.headers = {
      Authorization: `Bearer ${config.github.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'merge-to-earn-oracle/1.0',
    };
  }

  async getUser(username: string): Promise<GitHubUser> {
    const url = `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}`;

    logger.debug({ username }, 'Fetching GitHub user profile');

    const response = await fetch(url, { headers: this.headers });

    if (!response.ok) {
      if (response.status === 404) {
        throw new NotFoundError(`GitHub user "${username}" not found`);
      }
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`,
      );
    }

    const user = (await response.json()) as GitHubUser;

    logger.debug({ username, hasBio: !!user.bio }, 'GitHub user fetched');

    return user;
  }
}
