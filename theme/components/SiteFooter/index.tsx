import { useSite } from '@rspress/core/runtime';

import { Logo } from '../Logo';
import './index.css';

export function SiteFooter() {
  const { site } = useSite();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__logos">
        <a className="site-footer__sanger-link" href="https://www.sanger.ac.uk/">
          <img
            className="site-footer__sanger-logo"
            src={`${site.base}brand/logo-sanger-white.svg`}
            alt="Wellcome Sanger Institute"
          />
        </a>
        <span className="site-footer__logo-separator" aria-hidden="true" />
        <Logo variant="white" />
      </div>
      <small className="site-footer__copyright">© {year} Trynka Lab</small>
    </footer>
  );
}
