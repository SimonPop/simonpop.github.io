import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Themes decided in docs/ROADMAP.md Phase 0. Network Science, Graph Theory and
// GraphML (the site's previous categories) were originally consolidated into
// "graphml", then later split back into "graph" (pure graph theory) and "ml"
// (learned models on graphs) once that merge proved too coarse.
export const THEMES = ['graph', 'ml', 'genomics', 'xai', 'language'] as const;

const articles = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		theme: z.enum(THEMES),
		tags: z.array(z.string()).default([]),
		author: z.string().default('Simon Popelier'),
		summary: z.string(),
		// Legacy per-article D3.js visualizations, injected as <script src="/js/...">
		// at the bottom of the article (see src/layouts/ArticleLayout.astro).
		js: z.array(z.string()).default([]),
		draft: z.boolean().default(false),
	}),
});

const sparks = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/sparks' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		theme: z.enum(THEMES),
		tags: z.array(z.string()).default([]),
		// Slug of the long-form article this Spark is an entry point to, if any.
		article: z.string().optional(),
		// Per-spark D3.js visualizations, injected as <script src="/js/...">
		// after the spark body (see src/layouts/SparkLayout.astro).
		js: z.array(z.string()).default([]),
		draft: z.boolean().default(false),
	}),
});

export const collections = { articles, sparks };
