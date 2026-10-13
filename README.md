# Website

This website is generated from **`site.json`**. Edit it through the BBPlatform site builder, or by hand.

## Setup
```sh
nvm use          # Node 22
corepack enable  # pnpm
pnpm install
pnpm dev         # http://localhost:4321
```

## Commands
| Command | What it does |
|---|---|
| `pnpm dev` | Local dev server |
| `pnpm validate` | Check `site.json` and list every problem |
| `pnpm build` | Static build to `apps/website/dist` |
| `pnpm apply-settings <file>` | Apply site-builder answers (flat JSON) to `site.json` |
| `pnpm schema` | Regenerate `site.schema.json` after a schema change |
| `pnpm check` | Format, lint, types, unit tests, build, end-to-end |

## What lives where
| Path | Contents |
|---|---|
| `site.json` | Brand, colours, navigation, footer, pages, forms |
| `assets/` | Logo, favicon, images |
| `draft` branch | Unpublished changes (preview link) |
| `main` branch | The live site |

## Hosting (Cloudflare Pages)
Connect the repo in Cloudflare Pages with:
- Build command: `pnpm build`
- Output directory: `apps/website/dist`
- Production branch: `main`; preview branches: `draft`
- Environment variables: `NODE_VERSION=22`, `SITE_URL=https://<your domain>`
