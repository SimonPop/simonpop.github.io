(function () {
  const root = d3.select("#my_dataviz");
  if (root.empty()) return;

  const articleEl = document.querySelector(".article");
  const style = articleEl ? getComputedStyle(articleEl) : null;
  const cssVar = (name, fallback) => (style && style.getPropertyValue(name).trim()) || fallback;
  const themeColor = cssVar("--theme-color", "#0d7377");
  const mutedColor = cssVar("--text-muted", "#6b665d");
  const bgColor = cssVar("--bg", "#fcfbf8");

  const onion = {"directed": false, "multigraph": false, "graph": {}, "nodes": [{"id": 1, "x": 49.99999992904209, "y": 1.395536891404651e-07, "radius": 2.0, "color": "#9ecae1"}, {"id": 27, "x": 49.44154017067982, "y": 7.4521140606765, "radius": 2.0, "color": "#9ecae1"}, {"id": 47, "x": 47.77863912796788, "y": 14.737759659640362, "radius": 2.0, "color": "#9ecae1"}, {"id": 3, "x": 45.04844241550392, "y": 21.69418794411768, "radius": 2.0, "color": "#9ecae1"}, {"id": 33, "x": 41.311937505778864, "y": 28.166005134940914, "radius": 2.0, "color": "#9ecae1"}, {"id": 48, "x": 36.65259474327693, "y": 34.00863718607769, "radius": 2.0, "color": "#9ecae1"}, {"id": 6, "x": 31.174489798166576, "y": 39.09157525753656, "radius": 2.0, "color": "#9ecae1"}, {"id": 25, "x": 24.99999845666545, "y": 43.30127250110096, "radius": 2.0, "color": "#9ecae1"}, {"id": 51, "x": 18.26704884691817, "y": 46.54368768854326, "radius": 2.0, "color": "#9ecae1"}, {"id": 7, "x": 11.126048819560346, "y": 48.746395216048256, "radius": 2.0, "color": "#9ecae1"}, {"id": 19, "x": 3.7365059918331918, "y": 49.860188469156554, "radius": 2.0, "color": "#9ecae1"}, {"id": 50, "x": -3.736504572674984, "y": 49.860191449388786, "radius": 2.0, "color": "#9ecae1"}, {"id": 8, "x": -11.12604740040214, "y": 48.746395216048256, "radius": 2.0, "color": "#9ecae1"}, {"id": 9, "x": -18.267051898108317, "y": 46.54368768854326, "radius": 2.0, "color": "#9ecae1"}, {"id": 36, "x": -25.000002997971716, "y": 43.30126952086873, "radius": 2.0, "color": "#9ecae1"}, {"id": 13, "x": -31.174489869124482, "y": 39.09157525753656, "radius": 2.0, "color": "#9ecae1"}, {"id": 12, "x": -36.65259481423483, "y": 34.00863420584546, "radius": 2.0, "color": "#9ecae1"}, {"id": 40, "x": -41.31193757673677, "y": 28.166005134940914, "radius": 2.0, "color": "#9ecae1"}, {"id": 14, "x": -45.04844248646182, "y": 21.694190924349915, "radius": 2.0, "color": "#9ecae1"}, {"id": 69, "x": -47.77864217915801, "y": 14.737756679408125, "radius": 2.0, "color": "#9ecae1"}, {"id": 16, "x": -49.441540241637725, "y": 7.4521162958506775, "radius": 2.0, "color": "#9ecae1"}, {"id": 28, "x": -50.0, "y": -4.231585136431659e-06, "radius": 2.0, "color": "#9ecae1"}, {"id": 60, "x": -49.441540241637725, "y": -7.452113036511062, "radius": 2.0, "color": "#9ecae1"}, {"id": 17, "x": -47.77864217915801, "y": -14.737753420068515, "radius": 2.0, "color": "#9ecae1"}, {"id": 24, "x": -45.04844248646182, "y": -21.694187665010304, "radius": 2.0, "color": "#9ecae1"}, {"id": 39, "x": -41.311940556969, "y": -28.16599889536906, "radius": 2.0, "color": "#9ecae1"}, {"id": 61, "x": -36.65259183400259, "y": -34.00863690697031, "radius": 2.0, "color": "#9ecae1"}, {"id": 26, "x": -31.174480928427773, "y": -39.09158093889366, "radius": 2.0, "color": "#9ecae1"}, {"id": 53, "x": -24.999995547391123, "y": -43.30127222199358, "radius": 2.0, "color": "#9ecae1"}, {"id": 31, "x": -18.267050407992198, "y": -46.543687409435876, "radius": 2.0, "color": "#9ecae1"}, {"id": 32, "x": -11.126050380634375, "y": -48.746394936940874, "radius": 2.0, "color": "#9ecae1"}, {"id": 63, "x": -3.7365135133716936, "y": -49.86018819004917, "radius": 2.0, "color": "#9ecae1"}, {"id": 34, "x": 3.736514932529902, "y": -49.86018819004917, "radius": 2.0, "color": "#9ecae1"}, {"id": 57, "x": 11.126051799792581, "y": -48.746394936940874, "radius": 2.0, "color": "#9ecae1"}, {"id": 35, "x": 18.267050337034284, "y": -46.543687409435876, "radius": 2.0, "color": "#9ecae1"}, {"id": 43, "x": 24.999995476433213, "y": -43.30127222199358, "radius": 2.0, "color": "#9ecae1"}, {"id": 52, "x": 31.174480857469867, "y": -39.09158093889366, "radius": 2.0, "color": "#9ecae1"}, {"id": 41, "x": 36.6526007037414, "y": -34.00863094650584, "radius": 2.0, "color": "#9ecae1"}, {"id": 66, "x": 41.311940486011096, "y": -28.16599889536906, "radius": 2.0, "color": "#9ecae1"}, {"id": 54, "x": 45.04844241550392, "y": -21.694187665010304, "radius": 2.0, "color": "#9ecae1"}, {"id": 56, "x": 47.77863912796788, "y": -14.737763850881342, "radius": 2.0, "color": "#9ecae1"}, {"id": 11, "x": -5.795444194080306e-07, "y": 33.33333306844575, "radius": 3.0, "color": "#c6dbef"}, {"id": 67, "x": 49.44154017067982, "y": -7.452122722265832, "radius": 2.0, "color": "#9ecae1"}, {"id": 58, "x": -7.152952118603109e-07, "y": 20.0, "radius": 5.0, "color": "#fd8d3c"}, {"id": 20, "x": -33.33333157832969, "y": -2.3014782362423765e-06, "radius": 3.0, "color": "#c6dbef"}, {"id": 59, "x": 1.2749978292790748e-06, "y": -33.33333184321727, "radius": 3.0, "color": "#c6dbef"}, {"id": 18, "x": -23.57022413817505, "y": 23.57022562829111, "radius": 3.0, "color": "#c6dbef"}, {"id": 21, "x": -23.57022612499649, "y": -23.570222416241187, "radius": 3.0, "color": "#c6dbef"}, {"id": 42, "x": 23.570225893178687, "y": 23.57022562829111, "radius": 3.0, "color": "#c6dbef"}, {"id": 29, "x": 23.570221919535804, "y": -23.57022837670551, "radius": 3.0, "color": "#c6dbef"}, {"id": 65, "x": 33.33333333333333, "y": 6.126142394931732e-07, "radius": 3.0, "color": "#c6dbef"}, {"id": 2, "x": 24.999999652273324, "y": 5.463923416424402e-07, "radius": 4.0, "color": "#e6550d"}, {"id": 15, "x": 4.967876779064048e-07, "y": -24.999998907215314, "radius": 4.0, "color": "#e6550d"}, {"id": 38, "x": -24.99999925494199, "y": -1.6391770249273204e-06, "radius": 4.0, "color": "#e6550d"}, {"id": 23, "x": -8.941190148253885e-07, "y": 25.0, "radius": 4.0, "color": "#e6550d"}, {"id": 0, "x": 19.99999972181866, "y": 4.371138733139522e-07, "radius": 5.0, "color": "#fd8d3c"}, {"id": 22, "x": -7.1428560784884745, "y": -12.371791951149051, "radius": 7.0, "color": "#fdd0a2"}, {"id": 49, "x": -13.483617608257658, "y": 9.79642102509005, "radius": 6.0, "color": "#fdae6b"}, {"id": 5, "x": -19.999999403953595, "y": -1.3113416199418567e-06, "radius": 5.0, "color": "#fd8d3c"}, {"id": 46, "x": 3.974301423251239e-07, "y": -19.999999125772256, "radius": 5.0, "color": "#fd8d3c"}, {"id": 44, "x": 0.0, "y": 0.0, "radius": 9.0, "color": "#74c476"}, {"id": 62, "x": 5.150285019982408, "y": -15.850941812523459, "radius": 6.0, "color": "#fdae6b"}, {"id": 55, "x": 0.0, "y": 0.0, "radius": 8.0, "color": "#31a354"}, {"id": 4, "x": 16.666666666666664, "y": 0.0, "radius": 6.0, "color": "#fdae6b"}, {"id": 68, "x": 5.150282536455468, "y": 15.850942805934235, "radius": 6.0, "color": "#fdae6b"}, {"id": 30, "x": -13.483616614846882, "y": -9.796422018500826, "radius": 6.0, "color": "#fdae6b"}, {"id": 45, "x": -7.1428582072258076, "y": 12.371791667317408, "radius": 7.0, "color": "#fdd0a2"}, {"id": 64, "x": 14.285714285714285, "y": 2.838316446071884e-07, "radius": 7.0, "color": "#fdd0a2"}, {"id": 10, "x": 9.090909090909092, "y": 3.97376257152163e-07, "radius": 11.0, "color": "#c7e9c0"}, {"id": 37, "x": -9.090909090909092, "y": -3.97376257152163e-07, "radius": 11.0, "color": "#c7e9c0"}], "links": [{"source": 1, "target": 27, "color": "#9ecae1"}, {"source": 1, "target": 47, "color": "#9ecae1"}, {"source": 27, "target": 28, "color": "#9ecae1"}, {"source": 47, "target": 57, "color": "#9ecae1"}, {"source": 3, "target": 33, "color": "#9ecae1"}, {"source": 3, "target": 48, "color": "#9ecae1"}, {"source": 33, "target": 31, "color": "#9ecae1"}, {"source": 48, "target": 69, "color": "#9ecae1"}, {"source": 6, "target": 25, "color": "#9ecae1"}, {"source": 6, "target": 51, "color": "#9ecae1"}, {"source": 25, "target": 12, "color": "#9ecae1"}, {"source": 51, "target": 35, "color": "#9ecae1"}, {"source": 7, "target": 19, "color": "#9ecae1"}, {"source": 7, "target": 50, "color": "#9ecae1"}, {"source": 19, "target": 14, "color": "#9ecae1"}, {"source": 50, "target": 13, "color": "#9ecae1"}, {"source": 8, "target": 9, "color": "#9ecae1"}, {"source": 8, "target": 36, "color": "#9ecae1"}, {"source": 9, "target": 13, "color": "#9ecae1"}, {"source": 36, "target": 52, "color": "#9ecae1"}, {"source": 12, "target": 40, "color": "#9ecae1"}, {"source": 40, "target": 32, "color": "#9ecae1"}, {"source": 14, "target": 69, "color": "#9ecae1"}, {"source": 16, "target": 28, "color": "#9ecae1"}, {"source": 16, "target": 60, "color": "#9ecae1"}, {"source": 60, "target": 26, "color": "#9ecae1"}, {"source": 17, "target": 24, "color": "#9ecae1"}, {"source": 17, "target": 39, "color": "#9ecae1"}, {"source": 24, "target": 61, "color": "#9ecae1"}, {"source": 39, "target": 31, "color": "#9ecae1"}, {"source": 61, "target": 54, "color": "#9ecae1"}, {"source": 26, "target": 53, "color": "#9ecae1"}, {"source": 53, "target": 34, "color": "#9ecae1"}, {"source": 32, "target": 63, "color": "#9ecae1"}, {"source": 63, "target": 56, "color": "#9ecae1"}, {"source": 34, "target": 57, "color": "#9ecae1"}, {"source": 35, "target": 43, "color": "#9ecae1"}, {"source": 43, "target": 41, "color": "#9ecae1"}, {"source": 52, "target": 54, "color": "#9ecae1"}, {"source": 41, "target": 66, "color": "#9ecae1"}, {"source": 66, "target": 67, "color": "#9ecae1"}, {"source": 56, "target": 11, "color": "#3182bd"}, {"source": 11, "target": 20, "color": "#c6dbef"}, {"source": 11, "target": 59, "color": "#c6dbef"}, {"source": 67, "target": 58, "color": "#3182bd"}, {"source": 58, "target": 65, "color": "#3182bd"}, {"source": 58, "target": 2, "color": "#3182bd"}, {"source": 58, "target": 0, "color": "#fd8d3c"}, {"source": 58, "target": 5, "color": "#fd8d3c"}, {"source": 20, "target": 29, "color": "#c6dbef"}, {"source": 20, "target": 21, "color": "#c6dbef"}, {"source": 59, "target": 42, "color": "#c6dbef"}, {"source": 59, "target": 65, "color": "#c6dbef"}, {"source": 18, "target": 21, "color": "#c6dbef"}, {"source": 18, "target": 42, "color": "#c6dbef"}, {"source": 18, "target": 29, "color": "#c6dbef"}, {"source": 21, "target": 29, "color": "#c6dbef"}, {"source": 42, "target": 65, "color": "#c6dbef"}, {"source": 2, "target": 15, "color": "#e6550d"}, {"source": 2, "target": 38, "color": "#e6550d"}, {"source": 2, "target": 23, "color": "#e6550d"}, {"source": 15, "target": 38, "color": "#e6550d"}, {"source": 15, "target": 23, "color": "#e6550d"}, {"source": 15, "target": 0, "color": "#3182bd"}, {"source": 38, "target": 23, "color": "#e6550d"}, {"source": 38, "target": 49, "color": "#3182bd"}, {"source": 23, "target": 22, "color": "#3182bd"}, {"source": 0, "target": 5, "color": "#fd8d3c"}, {"source": 0, "target": 46, "color": "#fd8d3c"}, {"source": 0, "target": 44, "color": "#3182bd"}, {"source": 22, "target": 46, "color": "#3182bd"}, {"source": 22, "target": 4, "color": "#3182bd"}, {"source": 22, "target": 64, "color": "#fdd0a2"}, {"source": 22, "target": 45, "color": "#fdd0a2"}, {"source": 22, "target": 10, "color": "#3182bd"}, {"source": 22, "target": 44, "color": "#3182bd"}, {"source": 49, "target": 4, "color": "#fdae6b"}, {"source": 49, "target": 30, "color": "#fdae6b"}, {"source": 49, "target": 62, "color": "#fdae6b"}, {"source": 49, "target": 68, "color": "#fdae6b"}, {"source": 49, "target": 64, "color": "#3182bd"}, {"source": 5, "target": 46, "color": "#fd8d3c"}, {"source": 5, "target": 62, "color": "#3182bd"}, {"source": 5, "target": 55, "color": "#3182bd"}, {"source": 46, "target": 62, "color": "#3182bd"}, {"source": 46, "target": 55, "color": "#3182bd"}, {"source": 44, "target": 45, "color": "#3182bd"}, {"source": 44, "target": 55, "color": "#3182bd"}, {"source": 62, "target": 4, "color": "#fdae6b"}, {"source": 62, "target": 30, "color": "#fdae6b"}, {"source": 62, "target": 68, "color": "#fdae6b"}, {"source": 55, "target": 30, "color": "#3182bd"}, {"source": 55, "target": 45, "color": "#3182bd"}, {"source": 55, "target": 37, "color": "#3182bd"}, {"source": 55, "target": 10, "color": "#3182bd"}, {"source": 4, "target": 68, "color": "#fdae6b"}, {"source": 4, "target": 30, "color": "#fdae6b"}, {"source": 4, "target": 45, "color": "#3182bd"}, {"source": 68, "target": 30, "color": "#fdae6b"}, {"source": 68, "target": 10, "color": "#3182bd"}, {"source": 68, "target": 64, "color": "#3182bd"}, {"source": 30, "target": 64, "color": "#3182bd"}, {"source": 45, "target": 64, "color": "#fdd0a2"}, {"source": 45, "target": 10, "color": "#3182bd"}, {"source": 45, "target": 37, "color": "#3182bd"}, {"source": 64, "target": 37, "color": "#3182bd"}, {"source": 64, "target": 10, "color": "#3182bd"}]};

  // --- Layout: group nodes into concentric shells by their onion "radius"
  // (a k-core-like layer index, not a pixel radius), lowest = outer skin,
  // highest = innermost core. Within a shell, order nodes by walking the
  // shell's own same-layer edges (these form the ring itself), so the ring
  // renders as the closed loop it actually is instead of a random scatter.
  function layoutOnion(nodes, links) {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const shellIds = Array.from(new Set(nodes.map((n) => n.radius))).sort((a, b) => a - b);

    const sameLayerAdjacency = new Map(nodes.map((n) => [n.id, []]));
    links.forEach((l) => {
      const a = byId.get(l.source);
      const b = byId.get(l.target);
      if (a.radius === b.radius) {
        sameLayerAdjacency.get(a.id).push(b.id);
        sameLayerAdjacency.get(b.id).push(a.id);
      }
    });

    function ringOrder(ids) {
      const remaining = new Set(ids);
      const ordered = [];
      let current = ids[0];
      while (remaining.size) {
        ordered.push(current);
        remaining.delete(current);
        const next = (sameLayerAdjacency.get(current) || []).find((id) => remaining.has(id));
        current = next !== undefined ? next : remaining.values().next().value;
      }
      return ordered;
    }

    // Ring pixel radii: outer skin gets the most room, the core collapses
    // toward the centre, spaced so every shell reads as a distinct band.
    const shellRadius = d3.scalePow().exponent(0.85)
      .domain([0, shellIds.length - 1])
      .range([16, 190]);

    // Each ring starts at a different angle (the golden angle keeps the
    // offsets from ever lining back up), so thin inner shells don't all
    // stack their one or two nodes into the same radial spoke.
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    shellIds.forEach((shellId, shellIndex) => {
      const idsInShell = nodes.filter((n) => n.radius === shellId).map((n) => n.id);
      const order = ringOrder(idsInShell);
      const r = shellRadius(shellIds.length - 1 - shellIndex);
      const rotation = shellIndex * goldenAngle;
      order.forEach((id, i) => {
        const angle = (i / order.length) * 2 * Math.PI + rotation - Math.PI / 2;
        const node = byId.get(id);
        node.x = r * Math.cos(angle);
        node.y = r * Math.sin(angle);
        node.shellIndex = shellIndex;
      });
    });

    return { shellIds, shellRadius };
  }

  const { shellIds, shellRadius } = layoutOnion(onion.nodes, onion.links);
  const nodeById = new Map(onion.nodes.map((n) => [n.id, n]));

  // Colour: a single hue ramp from the site's muted grey (outer skin) to its
  // accent (the core), so the graph reads as one system with the rest of the
  // site rather than an unrelated rainbow.
  const layerColor = d3.scaleLinear()
    .domain([0, shellIds.length - 1])
    .range([mutedColor, themeColor])
    .interpolate(d3.interpolateLab);

  const nodeRadius = d3.scaleLinear().domain([0, shellIds.length - 1]).range([3.5, 8]);

  const width = root.node().getBoundingClientRect().width;
  const height = Math.min(width, 560);
  const extent = shellRadius(shellIds.length - 1) + 16;
  const scale = Math.min(width, height) / 2 / extent;

  const svg = root.append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  const layer = svg.append("g").attr("transform", `scale(${scale})`);

  // Faint guide rings behind everything: the concentric bands that make this
  // read as an onion cross-section at a glance, before a single node is seen.
  layer.append("g")
    .selectAll("circle")
    .data(shellIds.map((_, i) => shellRadius(shellIds.length - 1 - i)))
    .join("circle")
    .attr("r", (d) => d)
    .attr("fill", "none")
    .attr("stroke", "var(--border)")
    .attr("stroke-dasharray", "2,4")
    .attr("stroke-width", 1);

  function linkPath(d) {
    const a = nodeById.get(d.source);
    const b = nodeById.get(d.target);
    if (a.shellIndex === b.shellIndex) {
      // Both points sit on the same origin-centred ring, but a generic
      // two-point arc is ambiguous: a fixed sweep flag traces the ring only
      // for one rotational order and bows through the interior for the
      // other. Deriving the sweep from the actual angle to the origin keeps
      // the arc glued to the ring both ways round.
      const r = Math.hypot(a.x, a.y);
      const angleA = Math.atan2(a.y, a.x);
      const angleB = Math.atan2(b.y, b.x);
      const delta = ((angleB - angleA + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
      const sweep = delta > 0 ? 1 : 0;
      return `M${a.x},${a.y} A${r},${r} 0 0,${sweep} ${b.x},${b.y}`;
    }
    return `M${a.x},${a.y} L${b.x},${b.y}`;
  }

  const linkPaths = layer.append("g")
    .attr("fill", "none")
    .selectAll("path")
    .data(onion.links)
    .join("path")
    .attr("d", linkPath)
    .attr("stroke", (d) => layerColor(Math.min(nodeById.get(d.source).shellIndex, nodeById.get(d.target).shellIndex)))
    .attr("stroke-width", (d) => (nodeById.get(d.source).shellIndex === nodeById.get(d.target).shellIndex ? 1.4 : 0.9))
    .attr("stroke-opacity", (d) => (nodeById.get(d.source).shellIndex === nodeById.get(d.target).shellIndex ? 0.55 : 0.3));

  const node = layer.append("g")
    .selectAll("circle")
    .data(onion.nodes)
    .join("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", (d) => nodeRadius(d.shellIndex))
    .attr("fill", (d) => layerColor(d.shellIndex))
    .attr("stroke", bgColor)
    .attr("stroke-width", 1.5)
    .style("cursor", "grab");

  node.append("title").text((d) => `Node ${d.id} — layer ${d.radius}`);

  // Dragging is purely cosmetic here (no physics to fight): a node moves,
  // its own links follow, everything else stays put.
  node.call(
    d3.drag()
      .on("start", function () { d3.select(this).style("cursor", "grabbing"); })
      .on("drag", function (event, d) {
        d.x = event.x / scale;
        d.y = event.y / scale;
        d3.select(this).attr("cx", d.x).attr("cy", d.y);
        linkPaths.attr("d", linkPath);
      })
      .on("end", function () { d3.select(this).style("cursor", "grab"); })
  );
})();
