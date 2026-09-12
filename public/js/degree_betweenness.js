(function () {
  const root = d3.select("#degree-betweenness-viz");
  if (root.empty()) return;
  root.style("display", "flex").style("flex-direction", "column").style("align-items", "center").style("gap", "0.6rem");

  const themeEl = document.querySelector(".spark, .article");
  const themeColor = (themeEl && getComputedStyle(themeEl).getPropertyValue("--theme-color").trim()) || "#c23b6b";
  const baseColor = (themeEl && getComputedStyle(themeEl).getPropertyValue("--border").trim()) || "#cbd5e1";
  const width = 500, height = 230;

  // Fixed graph: two six-node cliques (drawn as hexagrams — every member
  // pairwise connected, so every shortest path between clique-mates is a
  // direct edge and stays inside the cluster) joined by a single bridge
  // node. Every clique member ends up with high degree; almost all of them
  // have zero betweenness, since the clique never needs to route through
  // anyone. The bridge has the lowest degree in the whole graph, yet it's
  // the only way across — so its betweenness dwarfs everyone else's.
  //
  // Each clique sits on a circle of radius CLIQUE_R, with one vertex (A1 /
  // B1) aimed straight at the bridge, GAP away from it. That ratio is tuned
  // so no edge — including the two spokes into the bridge — ever passes
  // close to a node it isn't connected to (regular-polygon complete graphs
  // only cross other *edges* in the interior, never another *vertex*, so
  // this stays clean at any size). GAP also has to clear 2×R_MAX: A1 and
  // Bridge can both sit near the top of the betweenness scale at once, and
  // if their centers were closer than the sum of their radii they'd overlap.
  const CLIQUE_R = 70;
  const GAP = 60;
  const bridgeX = width / 2;
  const centerA = { x: bridgeX - CLIQUE_R - GAP, y: height / 2 };
  const centerB = { x: bridgeX + CLIQUE_R + GAP, y: height / 2 };

  function hexPoints(center, angleOffsetDeg) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const theta = ((angleOffsetDeg + i * 60) * Math.PI) / 180;
      pts.push({ x: center.x + CLIQUE_R * Math.cos(theta), y: center.y + CLIQUE_R * Math.sin(theta) });
    }
    return pts;
  }

  const ptsA = hexPoints(centerA, 0); // A1 at angle 0 — points right, at the bridge
  const ptsB = hexPoints(centerB, 180); // B1 at angle 180 — points left, at the bridge

  const cliqueA = ["A1", "A2", "A3", "A4", "A5", "A6"];
  const cliqueB = ["B1", "B2", "B3", "B4", "B5", "B6"];

  const nodes = [
    ...cliqueA.map((id, i) => ({ id, x: ptsA[i].x, y: ptsA[i].y, cluster: "A" })),
    { id: "Bridge", x: bridgeX, y: height / 2, cluster: "bridge" },
    ...cliqueB.map((id, i) => ({ id, x: ptsB[i].x, y: ptsB[i].y, cluster: "B" })),
  ];

  const pairs = (arr) => arr.flatMap((a, i) => arr.slice(i + 1).map((b) => [a, b]));

  const edges = [...pairs(cliqueA), ...pairs(cliqueB), ["Bridge", "A1"], ["Bridge", "B1"]].map(
    ([source, target]) => ({ source, target })
  );

  const adj = new Map(nodes.map((n) => [n.id, new Set()]));
  edges.forEach(({ source, target }) => {
    adj.get(source).add(target);
    adj.get(target).add(source);
  });

  function degreeCentrality() {
    return new Map(nodes.map((n) => [n.id, adj.get(n.id).size]));
  }

  // Brandes' algorithm for unweighted, undirected betweenness centrality.
  function betweennessCentrality() {
    const ids = nodes.map((n) => n.id);
    const C = new Map(ids.map((id) => [id, 0]));
    for (const s of ids) {
      const S = [];
      const P = new Map(ids.map((id) => [id, []]));
      const sigma = new Map(ids.map((id) => [id, 0]));
      sigma.set(s, 1);
      const d = new Map(ids.map((id) => [id, -1]));
      d.set(s, 0);
      const Q = [s];
      while (Q.length) {
        const v = Q.shift();
        S.push(v);
        for (const w of adj.get(v)) {
          if (d.get(w) < 0) {
            Q.push(w);
            d.set(w, d.get(v) + 1);
          }
          if (d.get(w) === d.get(v) + 1) {
            sigma.set(w, sigma.get(w) + sigma.get(v));
            P.get(w).push(v);
          }
        }
      }
      const delta = new Map(ids.map((id) => [id, 0]));
      while (S.length) {
        const w = S.pop();
        for (const v of P.get(w)) {
          delta.set(v, delta.get(v) + (sigma.get(v) / sigma.get(w)) * (1 + delta.get(w)));
        }
        if (w !== s) C.set(w, C.get(w) + delta.get(w));
      }
    }
    // Each shortest path was counted from both endpoints' perspective.
    for (const id of ids) C.set(id, C.get(id) / 2);
    return C;
  }

  const scores = {
    degree: degreeCentrality(),
    betweenness: betweennessCentrality(),
  };

  const R_MIN = 6, R_MAX = 22;
  const colorScale = d3.interpolateRgb(baseColor, themeColor);

  // A linear scale spanning the actual min..max of each metric, not 0..max —
  // otherwise values that are all far from zero (e.g. degrees 2, 4, 5) get
  // squeezed into a narrow slice of the size/color range and look nearly
  // identical.
  function normalized(mode, id) {
    const vals = [...scores[mode].values()];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const v = scores[mode].get(id);
    return max > min ? (v - min) / (max - min) : 1;
  }

  function radiusFor(mode, id) {
    return R_MIN + normalized(mode, id) * (R_MAX - R_MIN);
  }

  function colorFor(mode, id) {
    return colorScale(normalized(mode, id));
  }

  function labelFor(mode, id) {
    const v = scores[mode].get(id);
    return mode === "degree" ? `${id}: degree ${v}` : `${id}: betweenness ${v.toFixed(1)}`;
  }

  // ---- controls ----
  const controls = root.append("div")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("gap", "0.6rem")
    .style("flex-wrap", "wrap");

  function styleToggle(sel) {
    return sel
      .style("font-family", "var(--font-sans)")
      .style("font-size", "0.85rem")
      .style("font-weight", "600")
      .style("border-radius", "999px")
      .style("padding", "0.45rem 1rem")
      .style("cursor", "pointer")
      .style("transition", "background 0.15s, color 0.15s, border-color 0.15s");
  }

  const degreeBtn = styleToggle(controls.append("button").text("Degree"));
  const betweennessBtn = styleToggle(controls.append("button").text("Betweenness"));

  function paintToggles(active) {
    [[degreeBtn, "degree"], [betweennessBtn, "betweenness"]].forEach(([btn, mode]) => {
      const isActive = mode === active;
      btn
        .style("border", isActive ? "1px solid " + themeColor : "1px solid var(--border)")
        .style("background", isActive ? themeColor : "var(--bg)")
        .style("color", isActive ? "#fff" : "var(--text-muted)");
    });
  }

  const status = root.append("div")
    .style("font-family", "var(--font-sans)")
    .style("font-size", "0.85rem")
    .style("font-style", "italic")
    .style("color", "var(--text-muted)")
    .style("text-align", "center");

  // ---- svg ----
  const svg = root.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("width", "100%")
    .style("max-width", "440px");

  svg.append("g")
    .selectAll("line.edge")
    .data(edges)
    .join("line")
    .attr("class", "edge")
    .attr("x1", (d) => nodes.find((n) => n.id === d.source).x)
    .attr("y1", (d) => nodes.find((n) => n.id === d.source).y)
    .attr("x2", (d) => nodes.find((n) => n.id === d.target).x)
    .attr("y2", (d) => nodes.find((n) => n.id === d.target).y)
    .attr("stroke", "var(--border)")
    .attr("stroke-width", 1.2)
    .style("opacity", 0.6);

  const nodeSel = svg.append("g")
    .selectAll("circle.node")
    .data(nodes, (d) => d.id)
    .join("circle")
    .attr("class", "node")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("stroke", "var(--bg)")
    .attr("stroke-width", 2);

  nodeSel.append("title");

  function render(mode) {
    paintToggles(mode);
    status.text(
      mode === "degree"
        ? "Node size and color scale with how many neighbors each node has."
        : "Node size and color scale with how many shortest paths pass through each node."
    );
    nodeSel
      .transition()
      .duration(400)
      .attr("r", (d) => radiusFor(mode, d.id))
      .attr("fill", (d) => colorFor(mode, d.id));
    nodeSel.select("title").text((d) => labelFor(mode, d.id));
  }

  degreeBtn.on("click", () => render("degree"));
  betweennessBtn.on("click", () => render("betweenness"));

  render("degree");
})();
