import { useSite } from '@rspress/core/runtime';
import { IconGithub, SvgWrapper } from '@rspress/core/theme-original';
import { useEffect, useState } from 'react';
import './index.css';

interface RepositoryCounts {
  stars: number;
  forks: number;
}

export function GitHubActions() {
  const { site } = useSite();
  const repository = site.themeConfig.socialLinks
    .map(link => link.content)
    .find(content => /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(content));
  const repositoryUrl = repository?.replace(/\/$/, '') ?? '';
  const repositoryName = repositoryUrl.replace('https://github.com/', '');
  const [counts, setCounts] = useState<RepositoryCounts | null>(null);

  useEffect(() => {
    if (!repositoryName) {
      return;
    }

    let cancelled = false;

    fetch(`https://api.github.com/repos/${repositoryName}`)
      .then(response => response.ok ? response.json() : Promise.reject(response.status))
      .then((data: { stargazers_count: number; forks_count: number }) => {
        if (!cancelled) {
          setCounts({ stars: data.stargazers_count, forks: data.forks_count });
        }
      })
      .catch(() => {
        // Keep the actions usable when GitHub is unavailable or rate-limited.
      });

    return () => {
      cancelled = true;
    };
  }, [repositoryName]);

  if (!repository) {
    return null;
  }

  return (
    <div className="github-actions" aria-label="GitHub repository actions">
      <a
        className="github-action github-action--repository"
        href={repositoryUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open repository on GitHub"
        title="Open repository on GitHub"
      >
        <SvgWrapper icon={IconGithub} className="github-action__icon" />
      </a>
      <a
        className="github-action"
        href={repositoryUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Open the repository to star it on GitHub"
      >
        Star <span className="github-action__count" aria-live="polite">
          {counts?.stars.toLocaleString() ?? '–'}
        </span>
      </a>
      <a
        className="github-action"
        href={`${repositoryUrl}/fork`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Fork <span className="github-action__count" aria-live="polite">
          {counts?.forks.toLocaleString() ?? '–'}
        </span>
      </a>
    </div>
  );
}
