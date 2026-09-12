export const THEME_META = {
	graph: { label: 'Graph', color: '#4a5fd9' },
	ml: { label: 'ML', color: '#c23b6b' },
	genomics: { label: 'Genomics', color: '#14805c' },
	xai: { label: 'XAI', color: '#b85c0d' },
	language: { label: 'Language', color: '#7c4de0' },
} as const;

export type ThemeKey = keyof typeof THEME_META;
