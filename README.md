# Green Galaxy Blog

This repo hosts an Astro-powered static site that syncs markdown content from a private content repository and deploys to Cloudflare Pages. It extends the Astro basics starter with custom layouts, long-form posts, and novel chapters under `src/content`.

## Prerequisites

- Node 22.x (see `.nvmrc` or run `nvm use`)
- pnpm 8+ (global) for package management
- SSH access to `git@github.com:Jenway/blog_content.git` when fetching content

## Quick Start

```bash
pnpm install
pnpm dev:content  # optional: refresh external markdown before starting dev server
```

Visit `http://localhost:4321` to preview the site with hot reload.

## Key Commands

| Command            | Purpose                                                    |
| ------------------ | ---------------------------------------------------------- |
| `pnpm dev`         | Start Astro dev server without refreshing remote content   |
| `pnpm dev:content` | Clean and re-clone remote content, then start dev server   |
| `pnpm build`       | Generate a static production build into `dist/` (verified) |
| `pnpm build:ci`    | CI-friendly build that re-syncs content before compiling   |
| `pnpm preview`     | Serve the built site locally                               |
| `pnpm lint`        | Run ESLint (requires Node 22 to avoid internal assertion)  |
| `pnpm typecheck`   | Run `tsc --noEmit`; ensure `typescript` is installed       |
| `pnpm format`      | Format sources with Prettier + Astro plugin                |
| `pnpm check`       | Sequentially run `format`, `lint`, and `typecheck`         |

## Content Workflow

Content is git-cloned into `src/content/`. Avoid editing generated markdown directly—contribute upstream and refresh locally with the fetch scripts. Use `pnpm clean:content` to remove stale syncs before cloning again.

## Deployment Notes

Build outputs deploy via Cloudflare Wrangler (`wrangler.toml`). Coordinate environment variables with the ops team before changing deployment settings.
