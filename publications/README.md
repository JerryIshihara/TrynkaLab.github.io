# Publication records

Add one Markdown file per publication to this folder. The website reads the
frontmatter as structured metadata and displays the Markdown body as a short
plain-text summary on the Publications page.

Use this format:

```md
---
title: "Paper title"
authors:
  - "First Author"
  - "Second Author"
year: 2026
date: "2026-02-11"
type: preprint
venue: "bioRxiv"
citation: "2026.02.10.704860"
doi: "10.64898/2026.02.10.704860"
url: "https://doi.org/10.64898/2026.02.10.704860"
codeUrl: "https://github.com/TrynkaLab/example"
---

One short summary paragraph shown on the website.
```

Required fields are `title`, `authors`, `year`, `date`, `type`, `venue`, and
`url`. `type` must be either `article` or `preprint`; `date` must use
`YYYY-MM-DD`. `citation`, `doi`, and `codeUrl` are optional.

`npm run dev` and `npm run build` validate these files and generate
`theme/generated/publications.ts`. Do not edit that generated file directly.
`README.md` and files whose names begin with `_` are ignored by the loader.
