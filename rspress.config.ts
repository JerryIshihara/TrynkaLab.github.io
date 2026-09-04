import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

const siteBase = (process.env.SITE_BASE ?? '').replace(/\/$/, '');

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  base: `${siteBase}/`,
  lang: 'en',
  title: 'Trynka Lab',
  themeConfig: {
    darkMode: 'light',
    search: false,
    nav: [
      { text: 'About us', link: 'https://www.sanger.ac.uk/group/trynka-group/' },
      { text: 'Publications', link: '/publications/' },
      {
        text: 'Software',
        items: [
          { text: 'sc-blipper', link: '/software/sc-blipper/' },
          { text: 'tglow', link: '/software/tglow/' },
        ],
      },
    ],
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/TrynkaLab',
      },
    ],
  },
});
