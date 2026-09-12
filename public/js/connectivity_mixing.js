(function () {
  const root = d3.select("#connectivity-mixing-viz");
  if (root.empty()) return;
  root.style("display", "flex").style("flex-direction", "column").style("align-items", "center").style("gap", "0.6rem");

  const themeEl = document.querySelector(".spark, .article");
  const themeColor = (themeEl && getComputedStyle(themeEl).getPropertyValue("--theme-color").trim()) || "#4a5fd9";
  const baseColor = (themeEl && getComputedStyle(themeEl).getPropertyValue("--border").trim()) || "#cbd5e1";
  const width = 500, height = 260;

  // Two fixed graphs of equal size (10 nodes) so the only thing that
  // differs between them is topology, not scale. "Expander" is a circulant
  // graph (ring + chords) with no narrow cut anywhere. "Bottleneck" is two
  // five-node cliques joined by a single bridge edge — everything inside a
  // clique is close, but the only way across is that one edge, exactly the
  // low-λ₂ case the article describes.
  const N = 10;
  const R = 95;
  const center = { x: width / 2, y: height / 2 + 6 };

  function ringNodes() {
    return d3.range(N).map((i) => {
      const theta = (i / N) * 2 * Math.PI - Math.PI / 2;
      return { id: i, x: center.x + R * Math.cos(theta), y: center.y + R * Math.sin(theta) };
    });
  }

  function expanderEdges() {
    const edges = [];
    for (let i = 0; i < N; i++) {
      edges.push([i, (i + 1) % N]); // ring
      edges.push([i, (i + 3) % N]); // chords for expansion
    }
    // de-dup (a chord and its mirror can coincide when N is small)
    const seen = new Set();
    return edges.filter(([a, b]) => {
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function bottleneckEdges() {
    const cliqueA = [0, 1, 2, 3, 4];
    const cliqueB = [5, 6, 7, 8, 9];
    const pairs = (arr) => arr.flatMap((a, i) => arr.slice(i + 1).map((b) => [a, b]));
    return [...pairs(cliqueA), ...pairs(cliqueB), [2, 7]]; // single bridge edge
  }

  const graphs = {
    expander: { nodes: ringNodes(), edges: expanderEdges(), label: "Expander" },
    bottleneck: { nodes: ringNodes(), edges: bottleneckEdges(), label: "Bottleneck" },
  };

  const START = 0;

  let mode = "expander";
  let adj, deg, totalDeg, stationary, dist, step, timer;

  function buildAdjacency() {
    const g = graphs[mode];
    adj = new Map(g.nodes.map((n) => [n.id, []]));
    g.edges.forEach(([a, b]) => {
      adj.get(a).push(b);
      adj.get(b).push(a);
    });
    deg = new Map(g.nodes.map((n) => [n.id, adj.get(n.id).length]));
    totalDeg = d3.sum([...deg.values()]);
    stationary = new Map(g.nodes.map((n) => [n.id, deg.get(n.id) / totalDeg]));
  }

  function resetWalk() {
    clearInterval(timer);
    timer = null;
    step = 0;
    dist = new Map(graphs[mode].nodes.map((n) => [n.id, n.id === START ? 1 : 0]));
  }

  function advanceStep() {
    const next = new Map(graphs[mode].nodes.map((n) => [n.id, 0]));
    for (const [i, p] of dist) {
      if (p === 0) continue;
      const neighbors = adj.get(i);
      const share = p / neighbors.length;
      for (const j of neighbors) next.set(j, next.get(j) + share);
    }
    dist = next;
    step += 1;
  }

  function totalVariation() {
    let s = 0;
    for (const [i, p] of dist) s += Math.abs(p - stationary.get(i));
    return s / 2;
  }

  // ---- controls ----
  const controls = root.append("div")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("gap", "0.6rem")
    .style("flex-wrap", "wrap");

  function styleBtn(sel) {
    return sel
      .style("font-family", "var(--font-sans)")
      .style("font-size", "0.85rem")
      .style("font-weight", "600")
      .style("border-radius", "999px")
      .style("padding", "0.45rem 1rem")
      .style("cursor", "pointer")
      .style("transition", "background 0.15s, color 0.15s, border-color 0.15s");
  }

  const expanderBtn = styleBtn(controls.append("button").text("Expander"));
  const bottleneckBtn = styleBtn(controls.append("button").text("Bottleneck"));

  const actions = root.append("div")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("gap", "0.6rem")
    .style("flex-wrap", "wrap");

  const stepBtn = styleBtn(actions.append("button").text("Step →"));
  const playBtn = styleBtn(actions.append("button").text("Play ▶"));
  const resetBtn = styleBtn(actions.append("button").text("Reset ↺"));

  function paintModeToggles() {
    [[expanderBtn, "expander"], [bottleneckBtn, "bottleneck"]].forEach(([btn, m]) => {
      const isActive = m === mode;
      btn
        .style("border", isActive ? "1px solid " + themeColor : "1px solid var(--border)")
        .style("background", isActive ? themeColor : "var(--bg)")
        .style("color", isActive ? "#fff" : "var(--text-muted)");
    });
  }

  function paintPlayBtn() {
    const playing = !!timer;
    playBtn.text(playing ? "Pause ❚❚" : "Play ▶");
  }

  [stepBtn, playBtn, resetBtn].forEach((b) =>
    b.style("border", "1px solid var(--border)").style("background", "var(--bg)").style("color", "var(--text-muted)")
  );

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

  const edgeLayer = svg.append("g");
  const nodeLayer = svg.append("g");

  const R_MIN = 6, R_MAX = 22;
  const colorScale = d3.interpolateRgb(baseColor, themeColor);
  // Fixed domain rather than per-frame min/max: step 0 is a spike of 1.0 at
  // the start node and 0 elsewhere, so a relative scale would make every
  // later, flatter frame look identical. Capping at 0.5 keeps the start
  // node from clipping while still giving mid-range probabilities visible
  // contrast.
  const valueScale = d3.scaleLinear().domain([0, 0.5]).clamp(true);

  function render() {
    const g = graphs[mode];
    paintModeToggles();
    paintPlayBtn();

    edgeLayer
      .selectAll("line.edge")
      .data(g.edges, (d) => `${mode}-${d[0]}-${d[1]}`)
      .join("line")
      .attr("class", "edge")
      .attr("x1", (d) => g.nodes[d[0]].x)
      .attr("y1", (d) => g.nodes[d[0]].y)
      .attr("x2", (d) => g.nodes[d[1]].x)
      .attr("y2", (d) => g.nodes[d[1]].y)
      .attr("stroke", "var(--border)")
      .attr("stroke-width", 1.2)
      .style("opacity", 0.6);

    const nodeSel = nodeLayer
      .selectAll("circle.node")
      .data(g.nodes, (d) => d.id)
      .join("circle")
      .attr("class", "node")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("stroke", (d) => (d.id === START ? themeColor : "var(--bg)"))
      .attr("stroke-width", (d) => (d.id === START ? 3 : 2));

    nodeSel
      .transition()
      .duration(350)
      .attr("r", (d) => R_MIN + valueScale(dist.get(d.id)) * (R_MAX - R_MIN))
      .attr("fill", (d) => colorScale(valueScale(dist.get(d.id))));

    nodeSel.selectAll("title").remove();
    nodeSel.append("title").text((d) => `node ${d.id}: p = ${dist.get(d.id).toFixed(3)}`);

    const tv = totalVariation();
    const label = g.label.toLowerCase();
    status.text(
      step === 0
        ? `Walker starts at the highlighted node on the ${label} graph.`
        : `Step ${step} on the ${label} graph — distance from spread-out ≈ ${tv.toFixed(2)}.`
    );
  }

  function switchMode(next) {
    if (mode === next) return;
    mode = next;
    buildAdjacency();
    resetWalk();
    render();
  }

  expanderBtn.on("click", () => switchMode("expander"));
  bottleneckBtn.on("click", () => switchMode("bottleneck"));

  stepBtn.on("click", () => {
    clearInterval(timer);
    timer = null;
    advanceStep();
    render();
  });

  resetBtn.on("click", () => {
    resetWalk();
    render();
  });

  playBtn.on("click", () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
      render();
      return;
    }
    timer = setInterval(() => {
      if (step >= 25 || totalVariation() < 0.02) {
        clearInterval(timer);
        timer = null;
        render();
        return;
      }
      advanceStep();
      render();
    }, 700);
    render();
  });

  buildAdjacency();
  resetWalk();
  render();
})();
