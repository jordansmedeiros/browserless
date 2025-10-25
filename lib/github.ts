/**
 * GitHub API integration for fetching repository statistics
 * Syncs with README.md badges and displays real-time data
 */

export interface GitHubStats {
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  description: string | null;
  htmlUrl: string;
  license: {
    name: string;
    spdxId: string;
  } | null;
  defaultBranch: string;
  latestRelease?: {
    tagName: string;
    publishedAt: string;
    htmlUrl: string;
  };
}

interface GitHubRepoResponse {
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  description: string | null;
  html_url: string;
  license: {
    name: string;
    spdx_id: string;
  } | null;
  default_branch: string;
}

interface GitHubReleaseResponse {
  tag_name: string;
  published_at: string;
  html_url: string;
}

/**
 * Fallback values if GitHub API fails
 * These should be updated periodically to reflect approximate values
 */
const FALLBACK_STATS: GitHubStats = {
  stars: 50,
  forks: 10,
  openIssues: 5,
  watchers: 20,
  description: 'Plataforma open source de automação judicial brasileira',
  htmlUrl: 'https://github.com/your-org/browserless',
  license: {
    name: 'Server Side Public License, Version 1',
    spdxId: 'SSPL-1.0',
  },
  defaultBranch: 'main',
};

/**
 * Fetches repository statistics from GitHub API
 * Uses ISR (Incremental Static Regeneration) with 1 hour revalidation
 *
 * @param owner - Repository owner (GitHub username or org)
 * @param repo - Repository name
 * @returns Repository statistics
 */
export async function getGitHubStats(
  owner: string = 'browserless',
  repo: string = 'browserless',
): Promise<GitHubStats> {
  try {
    // Fetch repository data
    const repoResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        next: { revalidate: 3600 }, // Revalidate every 1 hour
        headers: {
          Accept: 'application/vnd.github.v3+json',
          // Add GitHub token if available (prevents rate limiting)
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
      },
    );

    if (!repoResponse.ok) {
      throw new Error(
        `GitHub API error: ${repoResponse.status} ${repoResponse.statusText}`,
      );
    }

    const repoData: GitHubRepoResponse = await repoResponse.json();

    // Try to fetch latest release (optional)
    let latestRelease: GitHubStats['latestRelease'] | undefined;
    try {
      const releaseResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
        {
          next: { revalidate: 3600 },
          headers: {
            Accept: 'application/vnd.github.v3+json',
            ...(process.env.GITHUB_TOKEN && {
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            }),
          },
        },
      );

      if (releaseResponse.ok) {
        const releaseData: GitHubReleaseResponse =
          await releaseResponse.json();
        latestRelease = {
          tagName: releaseData.tag_name,
          publishedAt: releaseData.published_at,
          htmlUrl: releaseData.html_url,
        };
      }
    } catch (releaseError) {
      // Release fetch is optional, don't fail if it doesn't work
      console.warn('Failed to fetch latest release:', releaseError);
    }

    return {
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssues: repoData.open_issues_count,
      watchers: repoData.watchers_count,
      description: repoData.description,
      htmlUrl: repoData.html_url,
      license: repoData.license
        ? {
            name: repoData.license.name,
            spdxId: repoData.license.spdx_id,
          }
        : null,
      defaultBranch: repoData.default_branch,
      latestRelease,
    };
  } catch (error) {
    console.error('Failed to fetch GitHub stats, using fallback:', error);
    return FALLBACK_STATS;
  }
}

/**
 * Formats a number with K/M suffixes for large numbers
 * Example: 1234 -> "1.2K", 1234567 -> "1.2M"
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Formats a date as relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
  return `${Math.floor(diffDays / 365)} anos atrás`;
}
