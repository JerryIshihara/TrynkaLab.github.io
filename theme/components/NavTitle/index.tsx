import { useSite } from '@rspress/core/runtime';
import { NavTitle as DefaultNavTitle } from '@rspress/core/theme-original';
import './index.css';

export function NavTitle() {
  const { site } = useSite();
  const isSoftwareDocs = (site.multiVersion?.versions.length ?? 0) > 0;

  if (!isSoftwareDocs) {
    return <DefaultNavTitle />;
  }

  const softwareBase = site.base;
  const portalBase = softwareBase.replace(/\/software\/[^/]+\/?$/, '/');

  return (
    <div className="rp-nav__title software-nav-title">
      <a href={portalBase} className="rp-nav__title__link rp-link">
        Trynka Lab
      </a>
      <span className="software-nav-title__separator" aria-hidden="true">|</span>
      <a href={softwareBase} className="rp-nav__title__link rp-link">
        {site.title}
      </a>
    </div>
  );
}
