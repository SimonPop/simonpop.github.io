(function () {
	const nodesOrder = ['a', 'b', 'c', 'd', 'e'];
	const vectors = {
		a: [0.90, 0.10, 0.60, 0.30],
		b: [0.20, 0.85, 0.40, 0.70],
		c: [0.75, 0.20, 0.55, 0.35],
		d: [0.10, 0.90, 0.30, 0.80],
		e: [0.50, 0.50, 0.50, 0.50],
	};

	const root = document.getElementById('similarity_viz');
	if (!root) return;

	const articleEl = document.querySelector('.article');
	const articleStyle = articleEl ? getComputedStyle(articleEl) : null;
	const themeColor = (articleStyle && articleStyle.getPropertyValue('--theme-color').trim()) || '#4a5fd9';
	const mutedColor = (articleStyle && articleStyle.getPropertyValue('--text-muted').trim()) || '#666c7e';

	function cosine(u, v) {
		let dot = 0, nu = 0, nv = 0;
		for (let i = 0; i < u.length; i++) {
			dot += u[i] * v[i];
			nu += u[i] * u[i];
			nv += v[i] * v[i];
		}
		return dot / (Math.sqrt(nu) * Math.sqrt(nv));
	}

	const tint = (color, t) => d3.interpolateRgb('#ffffff', color)(t);

	const width = 620, height = 250;
	const svg = d3.select(root).append('svg')
		.attr('viewBox', `0 0 ${width} ${height}`)
		.attr('width', '100%');

	const rowY = {};
	nodesOrder.forEach((d, i) => { rowY[d] = 205 - i * 40; });

	// Row content spans from the node circle (starts ~x=11) to the last feature
	// square (ends at 55 + 4*26 = 159); the highlight ring must cover all of it.
	const ringLeft = 8, ringRight = 55 + 4 * 26 + 6;

	// --- Rows: node + feature vector, one square per dimension shaded by its value ---
	// All squares share the same color scale (not one hue per dimension) so that two
	// similar vectors visibly produce the same shading pattern at a glance.
	const rings = {};
	nodesOrder.forEach((d) => {
		const y = rowY[d];

		rings[d] = svg.append('rect')
			.attr('x', ringLeft).attr('y', y - 19)
			.attr('width', ringRight - ringLeft).attr('height', 38)
			.attr('rx', 8)
			.attr('fill', 'none')
			.attr('stroke', themeColor)
			.attr('stroke-width', 2)
			.attr('opacity', 0)
			.style('pointer-events', 'none');

		const g = svg.append('g').attr('class', 'sim-row').attr('data-id', d).style('cursor', 'pointer');

		g.append('circle')
			.attr('cx', 25).attr('cy', y).attr('r', 14)
			.attr('fill', 'var(--bg)').attr('stroke', 'var(--text)').attr('stroke-width', 1.5);
		g.append('text')
			.attr('x', 25).attr('y', y + 5).attr('text-anchor', 'middle')
			.attr('font-family', 'var(--font-display)').attr('font-weight', 700).attr('font-size', 13)
			.attr('fill', 'var(--text)').style('pointer-events', 'none')
			.text(d);

		vectors[d].forEach((v, j) => {
			g.append('rect')
				.attr('x', 55 + j * 26).attr('y', y - 11)
				.attr('width', 22).attr('height', 22).attr('rx', 3)
				.attr('fill', tint(themeColor, v))
				.attr('stroke', 'var(--border)').attr('stroke-width', 1);
		});
	});

	// --- Formula: f_sim(vec_x, vec_y) = <result square + value>, live-updated ---
	const fx = 250, fy = 125;

	const hint = svg.append('text')
		.attr('x', fx).attr('y', fy - 55)
		.attr('font-family', 'var(--font-sans)').attr('font-size', 11).attr('fill', mutedColor);

	const formula = svg.append('text')
		.attr('x', fx).attr('y', fy)
		.attr('font-family', 'var(--font-mono)').attr('font-size', 16).attr('fill', 'var(--text)');

	const resultSquare = svg.append('rect')
		.attr('width', 26).attr('height', 26).attr('rx', 4)
		.attr('y', fy - 19)
		.attr('stroke', 'var(--text)').attr('stroke-width', 1.5)
		.attr('fill', 'var(--surface)');

	const resultValue = svg.append('text')
		.attr('y', fy + 40)
		.attr('font-family', 'var(--font-mono)').attr('font-size', 13).attr('fill', 'var(--text)')
		.attr('text-anchor', 'middle');

	function render(a, b) {
		if (!a) {
			hint.text('Click a node to pin it as the first vector.');
			formula.text('f_sim(vec_x, vec_y) = ?');
		} else if (!b || b === a) {
			hint.text(`Hover another node to compare it with vec_${a}.`);
			formula.text(`f_sim(vec_${a}, vec_?) = `);
		} else {
			hint.text(`Comparing vec_${a} against vec_${b}. Click a node to pin a different one.`);
			formula.text(`f_sim(vec_${a}, vec_${b}) = `);
		}

		const fw = formula.node().getComputedTextLength();
		const sx = fx + fw + 6;
		resultSquare.attr('x', sx);

		if (a && b && b !== a) {
			const sim = cosine(vectors[a], vectors[b]);
			resultSquare.attr('fill', tint(themeColor, sim)).attr('stroke', 'var(--text)');
			resultValue.attr('x', sx + 13).text(sim.toFixed(2));
		} else {
			resultSquare.attr('fill', 'var(--surface)').attr('stroke', 'var(--border)');
			resultValue.attr('x', sx + 13).text('');
		}
	}

	function updateRings(a, b) {
		nodesOrder.forEach((d) => {
			rings[d].attr('opacity', d === a ? 1 : d === b ? 0.4 : 0);
		});
	}

	let pinned = 'a';
	let hovered = 'b';

	function refresh() {
		updateRings(pinned, hovered);
		render(pinned, hovered);
	}

	svg.selectAll('g.sim-row')
		.on('click', function () {
			const id = d3.select(this).attr('data-id');
			if (pinned === id) {
				pinned = null;
				hovered = null;
			} else {
				pinned = id;
				if (hovered === pinned) hovered = null;
			}
			refresh();
		})
		.on('mouseenter', function () {
			const id = d3.select(this).attr('data-id');
			if (pinned && id !== pinned) {
				hovered = id;
				refresh();
			}
		});

	refresh();
})();
