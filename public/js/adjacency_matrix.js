(function () {
	const nodesOrder = ['a', 'b', 'c', 'd', 'e'];
	const matrix = [
		[0.9, 0.4, 0.6, 0.0, 0.3],
		[0.0, 0.0, 0.5, 0.0, 0.7],
		[0.5, 0.6, 0.0, 0.4, 0.0],
		[0.0, 0.0, 0.0, 0.8, 0.0],
		[0.0, 0.6, 0.5, 0.0, 0.0],
	];

	const root = document.getElementById('adjacency_matrix_viz');
	if (!root) return;

	const articleEl = document.querySelector('.article');
	const articleStyle = articleEl ? getComputedStyle(articleEl) : null;
	const themeColor = (articleStyle && articleStyle.getPropertyValue('--theme-color').trim()) || '#4a5fd9';
	// Markers are rendered outside the normal render tree, so var(--text-muted) does not
	// resolve inside <marker> content in some browsers: resolve it to a literal color first.
	const mutedColor = (articleStyle && articleStyle.getPropertyValue('--text-muted').trim()) || '#666c7e';
	const colorScale = d3.scaleLinear().domain([0, 1]).range(['#eef0fb', themeColor]);

	const width = 640, height = 310;
	const svg = d3.select(root).append('svg')
		.attr('viewBox', `0 0 ${width} ${height}`)
		.attr('width', '100%');

	// --- Matrix ---
	const mLeft = 60, mTop = 40, cell = 34;
	const mg = svg.append('g').attr('transform', `translate(${mLeft},${mTop})`);

	mg.selectAll('.col-label')
		.data(nodesOrder)
		.enter()
		.append('text')
		.attr('x', (d, i) => i * cell + cell / 2 - 1)
		.attr('y', -10)
		.attr('text-anchor', 'middle')
		.attr('font-family', 'var(--font-display)')
		.attr('font-weight', 700)
		.attr('font-size', 13)
		.attr('fill', 'var(--text)')
		.text((d) => d);

	mg.selectAll('.row-label')
		.data(nodesOrder)
		.enter()
		.append('text')
		.attr('x', -14)
		.attr('y', (d, i) => i * cell + cell / 2 + 4)
		.attr('text-anchor', 'middle')
		.attr('font-family', 'var(--font-display)')
		.attr('font-weight', 700)
		.attr('font-size', 13)
		.attr('fill', 'var(--text)')
		.text((d) => d);

	const cellData = [];
	matrix.forEach((row, i) => row.forEach((v, j) => cellData.push({ i, j, v })));

	const cells = mg.selectAll('rect.cell')
		.data(cellData)
		.enter()
		.append('rect')
		.attr('class', 'cell')
		.attr('x', (d) => d.j * cell)
		.attr('y', (d) => d.i * cell)
		.attr('width', cell - 2)
		.attr('height', cell - 2)
		.attr('rx', 3)
		.attr('fill', (d) => (d.v > 0 ? colorScale(d.v) : 'var(--bg)'))
		.attr('stroke', 'var(--border)')
		.attr('stroke-width', 1)
		.style('cursor', (d) => (d.v > 0 ? 'pointer' : 'default'));

	// --- Graph ---
	const NODE_R = 15;
	const gCenterX = 430, gCenterY = 160, R = 110;
	const angle = (i) => -Math.PI / 2 + (2 * Math.PI * i) / nodesOrder.length;
	const nodePos = nodesOrder.map((d, i) => ({
		id: d,
		x: gCenterX + R * Math.cos(angle(i)),
		y: gCenterY + R * Math.sin(angle(i)),
	}));

	svg.append('defs').append('marker')
		.attr('id', 'dsl-adj-arrow')
		.attr('viewBox', '0 0 10 10')
		.attr('refX', 8)
		.attr('refY', 5)
		// userSpaceOnUse keeps the arrowhead a fixed absolute size; the default
		// "strokeWidth" units would scale it by the 2.5px stroke, making it roughly
		// as wide as the nodes themselves and causing it to overlap neighboring edges.
		.attr('markerUnits', 'userSpaceOnUse')
		.attr('markerWidth', 6)
		.attr('markerHeight', 6)
		.attr('orient', 'auto-start-reverse')
		.append('path')
		.attr('d', 'M0,0 L10,5 L0,10 z')
		.attr('fill', mutedColor);

	const gg = svg.append('g');

	const edgeData = [];
	matrix.forEach((row, i) => row.forEach((v, j) => {
		if (v > 0 && i !== j) edgeData.push({ i, j, v });
	}));
	const selfLoops = [];
	matrix.forEach((row, i) => {
		if (row[i] > 0) selfLoops.push({ i, v: row[i] });
	});

	// Pulls a point back toward another point by `dist`, so edges stop at a node's
	// boundary instead of its center (otherwise the arrowhead is drawn crashing into
	// the node, half-hidden underneath its circle).
	function pullBack(p, toward, dist) {
		const dx = p.x - toward.x, dy = p.y - toward.y;
		const norm = Math.hypot(dx, dy) || 1;
		return { x: p.x - (dx / norm) * dist, y: p.y - (dy / norm) * dist };
	}

	function edgeControl(d) {
		const s = nodePos[d.i], t = nodePos[d.j];
		const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
		const dx = t.x - s.x, dy = t.y - s.y;
		const norm = Math.hypot(dx, dy) || 1;
		const curve = 22;
		return { x: mx - (dy / norm) * curve, y: my + (dx / norm) * curve };
	}

	function edgePath(d) {
		const s = nodePos[d.i], t = nodePos[d.j];
		const c = edgeControl(d);
		const ns = pullBack(s, c, NODE_R + 1);
		const nt = pullBack(t, c, NODE_R + 2);
		return `M${ns.x},${ns.y} Q${c.x},${c.y} ${nt.x},${nt.y}`;
	}

	const edges = gg.selectAll('path.edge')
		.data(edgeData)
		.enter()
		.append('path')
		.attr('class', 'edge')
		.attr('d', edgePath)
		.attr('fill', 'none')
		.attr('stroke', (d) => colorScale(d.v))
		.attr('stroke-width', 2.5)
		.attr('marker-end', 'url(#dsl-adj-arrow)')
		.style('cursor', 'pointer');

	const loops = gg.selectAll('circle.loop')
		.data(selfLoops)
		.enter()
		.append('circle')
		.attr('class', 'loop')
		.attr('cx', (d) => nodePos[d.i].x + 20)
		.attr('cy', (d) => nodePos[d.i].y - 20)
		.attr('r', 10)
		.attr('fill', 'none')
		.attr('stroke', (d) => colorScale(d.v))
		.attr('stroke-width', 2.5)
		.style('cursor', 'pointer');

	const nodeSel = gg.selectAll('circle.node')
		.data(nodePos)
		.enter()
		.append('circle')
		.attr('class', 'node')
		.attr('cx', (d) => d.x)
		.attr('cy', (d) => d.y)
		.attr('r', NODE_R)
		.attr('fill', 'var(--bg)')
		.attr('stroke', 'var(--text)')
		.attr('stroke-width', 1.5)
		.style('cursor', 'pointer');

	gg.selectAll('text.node-label')
		.data(nodePos)
		.enter()
		.append('text')
		.attr('class', 'node-label')
		.attr('x', (d) => d.x)
		.attr('y', (d) => d.y + 5)
		.attr('text-anchor', 'middle')
		.attr('font-family', 'var(--font-display)')
		.attr('font-weight', 700)
		.attr('font-size', 13)
		.attr('fill', 'var(--text)')
		.style('pointer-events', 'none')
		.text((d) => d.id);

	// --- Interactions ---
	function dim() {
		cells.attr('opacity', (d) => (d.v > 0 ? 0.2 : 1));
		edges.attr('opacity', 0.12);
		loops.attr('opacity', 0.12);
	}
	function reset() {
		cells.attr('opacity', 1);
		edges.attr('opacity', 1);
		loops.attr('opacity', 1);
	}
	function highlightPair(i, j) {
		dim();
		cells.filter((d) => d.i === i && d.j === j).attr('opacity', 1);
		if (i === j) {
			loops.filter((d) => d.i === i).attr('opacity', 1);
		} else {
			edges.filter((d) => d.i === i && d.j === j).attr('opacity', 1);
		}
	}

	cells.on('mouseenter', function (event, d) {
		if (d.v === 0) return;
		highlightPair(d.i, d.j);
	}).on('mouseleave', reset);

	edges.on('mouseenter', function (event, d) {
		highlightPair(d.i, d.j);
	}).on('mouseleave', reset);

	loops.on('mouseenter', function (event, d) {
		highlightPair(d.i, d.i);
	}).on('mouseleave', reset);

	nodeSel.on('mouseenter', function (event, d) {
		const idx = nodesOrder.indexOf(d.id);
		dim();
		cells.filter((c) => c.i === idx || c.j === idx).attr('opacity', 1);
		edges.filter((e) => e.i === idx || e.j === idx).attr('opacity', 1);
		loops.filter((l) => l.i === idx).attr('opacity', 1);
	}).on('mouseleave', reset);
})();
