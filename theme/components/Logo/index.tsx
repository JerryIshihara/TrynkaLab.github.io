import { useSite } from '@rspress/core/runtime';
import './index.css';

interface LogoProps {
  variant?: 'default' | 'white';
}

export function Logo({ variant = 'default' }: LogoProps) {
  const { site } = useSite();
  const isWhite = variant === 'white';

  return (
    <a
      href={site.base}
      className={`rp-nav__title__link rp-link site-logo${isWhite ? ' site-logo--white' : ''}`}
    >
      <img
        className="site-logo__mark"
        src={`${site.base}brand/trynka-lab-logo${isWhite ? '-white' : ''}.svg`}
        alt=""
      />
      <span className="site-logo__text">{site.title}</span>
    </a>
  );
}
