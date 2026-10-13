import { z } from 'astro/zod';
import {
  captureSchema,
  ctaSchema,
  headingFields,
  hrefSchema,
  iconSchema,
  mediaSchema,
  text,
} from './common';

/**
 * Page sections as data. Each schema's `type` maps to a component in `sections/`
 * (see sections/SectionRenderer.astro). Content files list sections in order; the build fails on any
 * field that doesn't match these schemas. `text(n)` and `.max(n)` are density budgets.
 */

export const heroSection = z.strictObject({
  type: z.literal('hero'),
  layout: z.enum(['split', 'centered']).default('split'),
  /** Short context line above the H1 (e.g. the industry); omit unless it informs. */
  context: text(40).optional(),
  /** Hero copy is short on purpose: a 3–6 word headline and a one-line lede. */
  title: text(34),
  titleAccent: text(24).optional(),
  lede: text(100),
  /** Email-first capture shown in place of the primary button. */
  capture: captureSchema.optional(),
  ctas: z.array(ctaSchema).max(2).default([]),
  /** Quiet line under the buttons. */
  note: text(80).optional(),
  media: mediaSchema.optional(),
  band: headingFields.band,
});

export const logoStripSection = z.strictObject({
  type: z.literal('logoStrip'),
  label: z.string().min(1),
  items: z.array(z.strictObject({ name: z.string().min(1), href: hrefSchema.optional() })).min(1),
  band: headingFields.band,
});

export const statStripSection = z.strictObject({
  type: z.literal('statStrip'),
  ...headingFields,
  title: z.string().optional(),
  items: z
    .array(z.strictObject({ value: z.string().min(1), label: z.string().min(1) }))
    .min(2)
    .max(4),
  source: z.string().optional(),
});

export const featureGridSection = z.strictObject({
  type: z.literal('featureGrid'),
  ...headingFields,
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  variant: z.enum(['plain', 'cards']).default('plain'),
  items: z
    .array(
      z.strictObject({
        icon: iconSchema.optional(),
        title: text(40),
        body: text(110),
        href: hrefSchema.optional(),
        linkLabel: z.string().optional(),
      }),
    )
    .min(2)
    .max(4),
  ctas: z.array(ctaSchema).max(2).default([]),
});

export const tabbedShowcaseSection = z.strictObject({
  type: z.literal('tabbedShowcase'),
  ...headingFields,
  tabs: z
    .array(
      z.strictObject({
        label: text(24),
        icon: iconSchema.optional(),
        title: text(40),
        body: text(170),
        bullets: z.array(text(50)).max(3).default([]),
        link: ctaSchema.optional(),
        media: mediaSchema,
      }),
    )
    .min(2)
    .max(4),
});

export const splitSection = z.strictObject({
  type: z.literal('split'),
  ...headingFields,
  /** Paragraphs; the first should answer the heading on its own (AEO). */
  body: z.array(text(220)).min(1).max(2),
  bullets: z.array(text(60)).max(3).default([]),
  ctas: z.array(ctaSchema).max(2).default([]),
  media: mediaSchema.optional(),
  /** Put the media on the left. */
  reverse: z.boolean().default(false),
});

export const stepsSection = z.strictObject({
  type: z.literal('steps'),
  ...headingFields,
  steps: z
    .array(z.strictObject({ icon: iconSchema.optional(), title: text(32), body: text(80) }))
    .min(2)
    .max(5),
  ctas: z.array(ctaSchema).max(2).default([]),
});

export const comparisonTableSection = z.strictObject({
  type: z.literal('comparisonTable'),
  ...headingFields,
  /** Column headings after the first (row-label) column. */
  columns: z
    .array(z.strictObject({ name: z.string().min(1), highlight: z.boolean().default(false) }))
    .min(2)
    .max(5),
  groups: z
    .array(
      z.strictObject({
        label: z.string().optional(),
        rows: z
          .array(
            z.strictObject({
              label: z.string().min(1),
              /** `true` = included, `false` = not included, string = a value. */
              values: z.array(z.union([z.boolean(), z.string()])),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
  /** Accessible words for the ✓ / — marks. */
  yesLabel: z.string().default('Included'),
  noLabel: z.string().default('Not included'),
});

export const pricingTableSection = z.strictObject({
  type: z.literal('pricingTable'),
  ...headingFields,
  plans: z
    .array(
      z.strictObject({
        name: z.string().min(1),
        price: z.string().min(1),
        period: z.string().optional(),
        summary: text(80),
        features: z.array(text(60)).min(1).max(6),
        cta: ctaSchema,
        highlight: z.boolean().default(false),
        highlightLabel: z.string().optional(),
      }),
    )
    .min(1)
    .max(4),
  note: z.string().optional(),
});

export const testimonialSection = z.strictObject({
  type: z.literal('testimonial'),
  band: headingFields.band,
  quote: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
});

export const pageCardsSection = z.strictObject({
  type: z.literal('pageCards'),
  ...headingFields,
  /** List every page whose `card.group` matches. */
  group: z.string().min(1),
  /** Only pages with this tag (e.g. `prebuilt`). */
  tag: z.string().optional(),
  /** Group cards under these tag headings, in this order. */
  groupByTags: z.array(z.strictObject({ tag: z.string(), heading: z.string() })).optional(),
  /** Leave out the page being rendered. */
  excludeCurrent: z.boolean().default(true),
  columns: z.union([z.literal(2), z.literal(3)]).default(3),
  linkLabel: z.string().default('Learn more'),
});

export const tierLadderSection = z.strictObject({
  type: z.literal('tierLadder'),
  ...headingFields,
  tiers: z
    .array(
      z.strictObject({
        name: z.string().min(1),
        requirement: z.string().min(1),
        benefits: z.array(text(60)).min(1).max(4),
      }),
    )
    .min(2)
    .max(5),
});

export const faqSection = z.strictObject({
  type: z.literal('faq'),
  ...headingFields,
  /** Answers of 40–60 words read well and get quoted by answer engines. */
  items: z
    .array(z.strictObject({ q: text(90), a: text(380) }))
    .min(1)
    .max(5),
});

export const ctaPanelSection = z.strictObject({
  type: z.literal('ctaPanel'),
  ...headingFields,
  /** Email-first capture shown above the buttons. */
  capture: captureSchema.optional(),
  ctas: z.array(ctaSchema).max(2).default([]),
  note: z.string().optional(),
});

export const formSection = z.strictObject({
  type: z.literal('form'),
  ...headingFields,
  /** id of a form in `src/content/forms/`. */
  form: z.string().min(1),
  bullets: z.array(text(60)).max(4).default([]),
  bulletsTitle: z.string().optional(),
  media: mediaSchema.optional(),
});

export const sectionSchema = z.discriminatedUnion('type', [
  heroSection,
  logoStripSection,
  statStripSection,
  featureGridSection,
  tabbedShowcaseSection,
  splitSection,
  stepsSection,
  comparisonTableSection,
  pricingTableSection,
  testimonialSection,
  pageCardsSection,
  tierLadderSection,
  faqSection,
  ctaPanelSection,
  formSection,
]);

export type Section = z.infer<typeof sectionSchema>;
export type SectionOf<T extends Section['type']> = Extract<Section, { type: T }>;
