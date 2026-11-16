import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const VISUALS = ['dcc', 'design-system', 'wp-starter', 'omelanski', 'qa-agent', 'delivery-loop'] as const;

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    /** What was delivered: the big title on cards, the case page and in SEO. */
    title: z.string(),
    /** Short name for tight spots (the menu pills); falls back to the title. */
    short: z.string().optional(),
    /** Who it was for, shown as a small chip; own projects have none. */
    client: z.string().optional(),
    summary: z.string(),
    meta: z.string(),
    tags: z.array(z.string()),
    order: z.number(),
    visual: z.enum(VISUALS),
    links: z.array(z.object({ label: z.string(), href: z.url() })),
    origin: z.literal('home.pl').optional(),
  }),
});

export const collections = { projects };
