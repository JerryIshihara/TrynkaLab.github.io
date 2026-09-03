import { useNav, useSite } from '@rspress/core/runtime';
import {
  NavHamburger,
  Search,
  SocialLinks,
  SwitchAppearance,
} from '@rspress/core/theme-original';
import {
  NavLangs,
  NavMenu,
  NavMenuDivider,
  NavVersions,
} from '@rspress/core/theme-original/components/Nav/NavMenu';
import { isDarkModeSwitchEnabled } from '@rspress/shared';
import type { NavProps } from '@rspress/core/theme-original';
import { GitHubActions } from '../GitHubActions';
import { NavTitle } from '../NavTitle';
import '@rspress/core/theme-original/components/Nav/index.css';

export function Nav(props: NavProps) {
  const { beforeNavTitle, afterNavTitle, beforeNavMenu, afterNavMenu } = props;
  const navList = useNav();
  const { site } = useSite();
  const hasRepositoryActions = site.themeConfig.socialLinks.some(link =>
    /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(link.content),
  );
  const hasAppearanceSwitch = isDarkModeSwitchEnabled(
    site.themeConfig.darkMode,
  );

  return (
    <header className="rp-nav">
      <div className="rp-nav__left">
        {beforeNavTitle}
        <NavTitle />
        <NavMenu menuItems={navList} position="left" />
        {afterNavTitle}
      </div>

      <div className="rp-nav__right">
        {beforeNavMenu}
        {site.themeConfig.search !== false && <Search />}
        <NavMenu menuItems={navList} position="right" />
        <div className="rp-nav__others">
          <NavMenuDivider />
          <NavLangs />
          <NavVersions />
          {hasRepositoryActions ? <GitHubActions /> : <SocialLinks />}
          {hasAppearanceSwitch && <SwitchAppearance />}
        </div>
        <NavHamburger />
        {afterNavMenu}
      </div>
    </header>
  );
}
