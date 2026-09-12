/*
 * Geometry for the procedural "spark" motif: a bright core, curved tapering
 * rays, and a few drifting particles. renderSparkSvg() below emits this
 * figure as static SVG at build time (no JS shipped) — used for the site
 * mark (SparkGlyph.astro / SparkMark.astro).
 *
 * hashSeed() and mulberry32() (the seeded RNG) are also reused by
 * SparkOrb.astro for its own, unrelated liquid-blob animation.
 */

/*
 * The spark motif's own palette — one fixed seed, nine rays, drawn in
 * variations of a single blue-green rather than a multicolour wheel. Both
 * the header mark (SparkMark.astro) and each spark page's hero glyph
 * (SparkLayout) draw from this one constant, so the motif reads as the same
 * mark everywhere rather than drifting per context.
 */
export const BRAND_SEED = 'simon-popelier';
export const BRAND_RAYS = 9;
export const SPARK_TEAL = ['#4fb3ac', '#0d7377', '#0a4f52'];
export const BRAND_WHEEL = SPARK_TEAL;
export const SPARK_PALETTE = SPARK_TEAL;

/*
 * Particle radii below are absolute pixels rather than a fraction of `size`, so
 * the motif is deliberately not scale-invariant: drawn small it reads as a few
 * bold dots, drawn large as fine sparks around a wide halo. The brand mark is
 * therefore pinned to one drawing size and only ever scaled from it — the
 * header and the favicon both rasterise this exact figure, never a redraw at
 * another size, which would come out as a different mark.
 */
export const BRAND_SIZE = 22;

export const SIZE_PULSE_RANGE = 0.28;
export const DIST_PULSE_RANGE = 0.16;

export interface Particle {
	distFactor: number;
	angleJitter: number;
	radius: number;
	maxRadius: number;
	alpha: number;
	speedFactor: number;
	sizePulseSpeed: number;
	sizePulsePhase: number;
	distPulseSpeed: number;
	distPulsePhase: number;
}

export interface RayParams {
	angleOffset: number;
	length: number;
	curve: number;
	speedFactor: number;
	particles: Particle[];
}

export interface SparkParams {
	baseAngle: number;
	rays: RayParams[];
}

export function hashSeed(seed: string): number {
	let h = 1779033703 ^ seed.length;
	for (let i = 0; i < seed.length; i++) {
		h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
		h = (h << 13) | (h >>> 19);
	}
	return h >>> 0;
}

export function mulberry32(seed: number) {
	let a = seed;
	return function () {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function hexToRgb(hex: string) {
	const clean = hex.replace('#', '');
	const r = parseInt(clean.substring(0, 2), 16);
	const g = parseInt(clean.substring(2, 4), 16);
	const b = parseInt(clean.substring(4, 6), 16);
	return { r, g, b };
}

export function buildParams(seed: string, rayOverride?: number): SparkParams {
	const rng = mulberry32(hashSeed(seed));
	const rayCount = rayOverride ?? 7 + Math.floor(rng() * 6);
	const baseAngle = rng() * Math.PI * 2;
	const rays: RayParams[] = [];

	for (let i = 0; i < rayCount; i++) {
		const angleOffset = (i / rayCount) * Math.PI * 2 + (rng() - 0.5) * 0.35;
		const length = 0.26 + rng() * 0.14;
		const curve = (0.05 + rng() * 0.09) * (rng() < 0.5 ? 1 : -1);
		const speedFactor = 0.85 + rng() * 0.3;
		const particleCount = 1 + Math.floor(rng() * 2);
		const particles: Particle[] = [];
		for (let p = 0; p < particleCount; p++) {
			const radius = 0.8 + rng() * 1.6;
			particles.push({
				distFactor: 1.2 + rng() * 0.35,
				angleJitter: (rng() - 0.5) * 0.4,
				radius,
				maxRadius: radius * (1 + SIZE_PULSE_RANGE),
				alpha: 0.35 + rng() * 0.35,
				speedFactor: 0.4 + rng() * 0.9,
				sizePulseSpeed: 0.6 + rng() * 0.8,
				sizePulsePhase: rng() * Math.PI * 2,
				distPulseSpeed: 0.18 + rng() * 0.22,
				distPulsePhase: rng() * Math.PI * 2,
			});
		}
		rays.push({ angleOffset, length, curve, speedFactor, particles });
	}

	return { baseAngle, rays };
}

/**
 * Soft-clamp a particle's distance so only the tail of its pulse eases into the
 * frame edge instead of snapping against it. Mirrors the canvas renderer.
 */
export function clampDistance(rawDist: number, safeMax: number): number {
	const softStart = safeMax * 0.7;
	if (rawDist <= softStart || safeMax <= softStart) return rawDist;
	return softStart + (safeMax - softStart) * (1 - Math.exp(-(rawDist - softStart) / (safeMax - softStart)));
}

const round = (n: number) => Math.round(n * 100) / 100;

/*
 * Gradient ids have to be unique within a document, and nothing stops the same
 * seed being drawn twice on one page at two different sizes. Seed alone would
 * collide and the second copy would silently pick up the first one's gradient
 * geometry — its rays sized for the wrong box — so counter the ids.
 */
let svgInstance = 0;

export interface SparkSvgOptions {
	seed: string;
	/** Single colour, or the first entry of `colors` when that is given. */
	color: string;
	size?: number;
	/**
	 * Width and height to display at, when they should differ from the size the
	 * figure is drawn at. The viewBox stays `size`, so the drawing keeps the
	 * proportions it has at `size` and is simply scaled into the box.
	 */
	displaySize?: number;
	rays?: number;
	/** One colour per ray, cycled — used by the multicolour brand mark. */
	colors?: string[];
	/** Accessible name; pass null for a purely decorative mark. */
	label?: string | null;
	class?: string;
}

/**
 * The same figure paint() draws at rotation = 0 and pulseTime = 0, as a static
 * SVG string. Gradient ids are namespaced by seed so several marks can coexist
 * on one page.
 */
export function renderSparkSvg({
	seed,
	color,
	size = 220,
	displaySize,
	rays: rayOverride,
	colors,
	label = 'Procedurally generated illustration',
	class: className = 'spark-glyph',
}: SparkSvgOptions): string {
	const params = buildParams(seed, rayOverride);
	const palette = (colors && colors.length > 0 ? colors : [color]).map(hexToRgb);
	const uid = `sp-${hashSeed(seed).toString(36)}-${(svgInstance++).toString(36)}`;
	const cx = size / 2;
	const cy = size / 2;

	const defs: string[] = [];
	const shapes: string[] = [];

	params.rays.forEach((ray, i) => {
		const c = palette[i % palette.length];
		const rgb = `${c.r},${c.g},${c.b}`;
		const angle = params.baseAngle + ray.angleOffset;
		const length = size * ray.length;
		const curve = size * ray.curve;

		const tipX = cx + Math.cos(angle) * length;
		const tipY = cy + Math.sin(angle) * length;
		const perp = angle + Math.PI / 2;
		const ctrlDist = length * 0.55;
		const ctrl1X = cx + Math.cos(angle) * ctrlDist + Math.cos(perp) * curve;
		const ctrl1Y = cy + Math.sin(angle) * ctrlDist + Math.sin(perp) * curve;
		const ctrl2X = cx + Math.cos(angle) * ctrlDist - Math.cos(perp) * curve;
		const ctrl2Y = cy + Math.sin(angle) * ctrlDist - Math.sin(perp) * curve;

		const gradId = `${uid}-r${i}`;
		defs.push(
			`<linearGradient id="${gradId}" gradientUnits="userSpaceOnUse" x1="${round(cx)}" y1="${round(cy)}" x2="${round(tipX)}" y2="${round(tipY)}">` +
				`<stop offset="0" stop-color="rgb(${rgb})" stop-opacity="0.55"/>` +
				`<stop offset="1" stop-color="rgb(${rgb})" stop-opacity="0"/>` +
				`</linearGradient>`,
		);
		shapes.push(
			`<path d="M${round(cx)} ${round(cy)}Q${round(ctrl1X)} ${round(ctrl1Y)} ${round(tipX)} ${round(tipY)}Q${round(ctrl2X)} ${round(ctrl2Y)} ${round(cx)} ${round(cy)}Z" fill="url(#${gradId})"/>`,
		);

		for (const particle of ray.particles) {
			const particleAngle = params.baseAngle + ray.angleOffset + particle.angleJitter;
			const displayRadius = particle.radius * (1 + SIZE_PULSE_RANGE * Math.sin(particle.sizePulsePhase));
			const rawDist = length * particle.distFactor * (1 + DIST_PULSE_RANGE * Math.sin(particle.distPulsePhase));
			const safeMax = Math.max(size / 2 - particle.maxRadius - 1.5, 0);
			const dist = clampDistance(rawDist, safeMax);
			shapes.push(
				`<circle cx="${round(cx + Math.cos(particleAngle) * dist)}" cy="${round(cy + Math.sin(particleAngle) * dist)}" r="${round(displayRadius)}" fill="rgb(${rgb})" fill-opacity="${round(particle.alpha)}"/>`,
			);
		}
	});

	const core = palette[0];
	const coreRgb = `${core.r},${core.g},${core.b}`;
	const coreRadius = size * 0.1;
	defs.push(
		`<radialGradient id="${uid}-core" gradientUnits="userSpaceOnUse" cx="${round(cx)}" cy="${round(cy)}" r="${round(coreRadius)}">` +
			`<stop offset="0" stop-color="rgb(${coreRgb})" stop-opacity="0.95"/>` +
			`<stop offset="0.7" stop-color="rgb(${coreRgb})" stop-opacity="0.5"/>` +
			`<stop offset="1" stop-color="rgb(${coreRgb})" stop-opacity="0"/>` +
			`</radialGradient>`,
	);
	shapes.push(`<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(coreRadius)}" fill="url(#${uid}-core)"/>`);

	const a11y = label
		? ` role="img" aria-label="${label.replace(/"/g, '&quot;')}"`
		: ' role="presentation" aria-hidden="true" focusable="false"';

	return (
		`<svg class="${className}" width="${displaySize ?? size}" height="${displaySize ?? size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"${a11y}>` +
		`<defs>${defs.join('')}</defs>${shapes.join('')}</svg>`
	);
}
