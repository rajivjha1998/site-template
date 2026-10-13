import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { siteConfigSchema } from '@blackboxops/ui/schemas/site-config.ts';

/**
 * The whole site comes from one file: `site.json` at the repo root (brand, theme,
 * navigation, footer, pages, forms). It loads as a single entry with id `site`.
 */
export const collections = {
  site: defineCollection({
    loader: file('../../site.json', {
      parser: (text) => ({ site: JSON.parse(text) as Record<string, unknown> }),
    }),
    schema: siteConfigSchema,
  }),
};
