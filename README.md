# Crucible

**Crucible** is the open research journal and experimental log for [Inference Foundry](https://github.com/Inference-Foundry). It hosts teardowns and analyses that emphasize mathematics, hardware context, and reproducible measurements—not hype summaries.

## Live site

GitHub Pages publishes this repository as a static site:

**[https://inference-foundry.github.io/Crucible/](https://inference-foundry.github.io/Crucible/)**

## Repository layout

| Path | Purpose |
|------|---------|
| `index.html` | Journal home with topic filters and search |
| `templates/article-template.html` | Starting point for long-form articles |
| `css/site.css` | Shared stylesheet |
| `js/content-filter.js` | Tag filters, search, URL hash state |
| `assets/images/` | Organization logo |
| `CONTENT_GUIDE.md` | Editorial and formatting expectations |

## Contributing

1. Read `CONTENT_GUIDE.md`.
2. Copy `templates/article-template.html` into a sensible path (for example under `articles/` when that convention exists) and fill every section.
3. Open a pull request on [Inference-Foundry/Crucible](https://github.com/Inference-Foundry/Crucible).

Deployments run from `.github/workflows/deploy-pages.yml` on pushes to `main`.
