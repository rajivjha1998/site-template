import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';
import { siteConfigSchema } from '@blackboxops/ui/schemas/site-config.ts';

// Checks site.json in one run and lists every problem in plain words, so whoever edits it
// (a person, the site builder or AI) can fix them all at once. `pnpm validate` runs this.
const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));
const raw = readFileSync(`${repoRoot}site.json`, 'utf8');
const json: unknown = JSON.parse(raw);
const parsed = siteConfigSchema.safeParse(json);

describe('site.json', () => {
  it('matches the site schema', () => {
    const problems = parsed.success
      ? []
      : parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
    expect(problems).toEqual([]);
  });

  it('references only asset files that exist', () => {
    const paths = [...raw.matchAll(/"(assets\/[^"]+)"/g)].map((m) => m[1]!);
    expect(paths.filter((p) => !existsSync(`${repoRoot}${p}`))).toEqual([]);
  });

  it('references only forms that exist', () => {
    if (!parsed.success) return;
    const ids = new Set(Object.keys(parsed.data.forms));
    const used = [...[...raw.matchAll(/"form"\s*:\s*"([^"]+)"/g)].map((m) => m[1]!)];
    expect(used.filter((id) => !ids.has(id))).toEqual([]);
  });

  it('keeps copy free of em dashes (they read as machine-written)', () => {
    expect(raw.includes('—')).toBe(false);
  });
});

// site.schema.json is the published contract for the site builder, AI and editors.
// Regenerate with `pnpm schema` after changing any schema in packages/ui/src/schemas.
describe('site.schema.json', () => {
  it('is in sync with the Zod schemas', () => {
    const generated = `${JSON.stringify(
      z.toJSONSchema(siteConfigSchema, { io: 'input', unrepresentable: 'any' }),
      null,
      2,
    )}\n`;
    const file = `${repoRoot}site.schema.json`;
    if (process.env.UPDATE_SCHEMA) writeFileSync(file, generated);
    expect(existsSync(file) ? readFileSync(file, 'utf8') : '').toBe(generated);
  });
});
