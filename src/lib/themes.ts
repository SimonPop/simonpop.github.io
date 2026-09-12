/*
 * Themes are a plain label now — no per-theme hue. The site's one accent
 * colour (--accent in global.css) is reserved for occasional brand notes
 * rather than for telling categories apart.
 */
export const THEME_META = {
	graph: { label: 'Graph' },
	ml: { label: 'ML' },
	genomics: { label: 'Genomics' },
	xai: { label: 'XAI' },
	language: { label: 'Language' },
} as const;

export type ThemeKey = keyof typeof THEME_META;
