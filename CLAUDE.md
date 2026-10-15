# Website (site template)

A marketing website built from one file: `site.json` at the repo root. Astro (static), deployed on Cloudflare Pages. Created from the BBPlatform site template; the owner edits content through BBPlatform's site builder, which writes `site.json` on the `draft` branch.

## Priorities (in order)
1. The owner's content and brand, exactly as given in `site.json`. Never invent copy, prices, testimonials, logos or figures.
2. UI/UX quality: clean, consistent sections; accessible; fast.
3. Reliability: `pnpm validate` and `pnpm check` green.

## How content works
- `site.json` holds everything: `brand`, `theme` (3 colours), `navigation`, `footer`, `pages` (key = URL path, e.g. `"/"`), `forms`.
- `site.schema.json` is its contract (generated; run `pnpm schema` after changing a schema in `packages/ui/src/schemas/`).
- Images and logos live in `assets/` and are referenced as `assets/<file>` (served at `/assets/<file>`).
- Accent colours are generated from `theme` by `packages/ui/src/lib/theme.ts` and adjusted for readability. Never hard-code a colour.
- New page = new key in `pages`. New section type = schema in `packages/ui/src/schemas/sections.ts` + component + a case in `SectionRenderer` + `pnpm schema`.

## Branches
- `draft`: work in progress; Cloudflare Pages gives it a preview URL. All edits go here.
- `main`: the live site. Changes reach it only when the owner approves (merge from `draft`).

## Skills
`frontend-design` before any UI work · `marketing-expert` before writing or reviewing copy · `seo-aeo` for titles, descriptions, FAQs and new pages. Design rules: `claude-design.md` and `claude-reference.md`. Detailed standards load from `.claude/rules/`.

## Structure
```
site.json             all content (brand, theme, navigation, footer, pages, forms)
site.schema.json      generated JSON Schema for site.json
assets/               logo, favicon, images
scripts/              apply-settings.mjs (builder answers → site.json), update-file.mjs (builder file edits), access-code.mjs (site access codes)
site-builder.files.json  files the site builder may edit (exact paths)
.site-builder/access.json  salted hash of the site's access code; never edit by hand or through the builder
packages/ui/src/      @blackboxops/ui: schemas, sections, components, theme, tokens — no site copy
apps/website/         Astro app that renders site.json
apps/forms-worker/    form endpoint for static hosting
.github/workflows/    update-settings (builder answers / file edits / restores → draft; needs the access code), verify-access, set-access-code (owner only), ensure-site (template only), check
```

## Commands
Node 22 (`nvm use`), pnpm. `pnpm dev` · `pnpm build` · `pnpm validate` (site.json only, lists every problem) · `pnpm test` · `pnpm test:e2e` (after a build) · `pnpm check` (format, lint, types, unit, build, e2e).
Apply builder answers locally: `pnpm apply-settings settings.json`.
Env: `SITE_URL` / `SITE_BASE` (deploy address) · `PUBLIC_SITE_INDEXABLE=true` at launch (off = noindex) · `PUBLIC_FORMS_ORIGIN` · `PUBLIC_TURNSTILE_SITE_KEY`.
Internal links go through `withBase()`.

## Git
Never commit to `main`, merge, or push without the owner's explicit confirmation. Work on `draft`.

## Done means
`pnpm check` passes, rendered at 360px and 1280px, and the report lists anything marked `[Pending: …]`.
