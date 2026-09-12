(function () {
  const root = d3.select("#homophily-heterophily-viz");
  if (root.empty()) return;
  root.style("display", "flex").style("flex-direction", "column").style("align-items", "center").style("gap", "0.6rem");

  const themeEl = document.querySelector(".spark, .article");
  const themeColor = (themeEl && getComputedStyle(themeEl).getPropertyValue("--theme-color").trim()) || "#c23b6b";
  const colorA = themeColor;
  const colorB = "#4a5fd9";
  const K = 2;
  const GOLDEN_ANGLE = 2.399963;
  const width = 460, height = 230;

  // Fixed "embedding space" coordinates — these decide who is nearest to
  // whom, and never change. Only the on-screen layout (x/y) is re-arranged
  // by the simulation below, purely so each mode's wiring stays legible.
  function clusterNodes(cx, cy, n, color, group, idPrefix, scale) {
    const nodes = [];
    for (let i = 0; i < n; i++) {
      const r = scale * Math.sqrt(i + 0.5);
      const theta = i * GOLDEN_ANGLE;
      const x0 = cx + r * Math.cos(theta);
      const y0 = cy + r * Math.sin(theta);
      nodes.push({ id: `${idPrefix}${i}`, x0, y0, x: x0, y: y0, color, group });
    }
    return nodes;
  }

  const nodes = clusterNodes(width * 0.3, height / 2, 9, colorA, "A", "a", 16).concat(
    clusterNodes(width * 0.7, height / 2, 9, colorB, "B", "b", 16)
  );

  function embeddingDist(a, b) {
    return Math.hypot(a.x0 - b.x0, a.y0 - b.y0);
  }

  function nearestNeighbors(node, predicate) {
    return nodes
      .filter((n) => n.id !== node.id && predicate(n))
      .map((n) => ({ n, d: embeddingDist(node, n) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, K)
      .map((x) => x.n);
  }

  function buildEdges(mode) {
    const edgeMap = new Map();
    nodes.forEach((node) => {
      const predicate = mode === "homophily" ? (n) => n.color === node.color : (n) => n.color !== node.color;
      nearestNeighbors(node, predicate).forEach((nb) => {
        const key = [node.id, nb.id].sort().join("--");
        if (!edgeMap.has(key)) edgeMap.set(key, { key, source: node.id, target: nb.id });
      });
    });
    return Array.from(edgeMap.values());
  }

  // ---- legend ----
  const legend = root.append("div")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("gap", "1.2rem")
    .style("font-family", "var(--font-sans)")
    .style("font-size", "0.8rem")
    .style("color", "var(--text-muted)");

  [["Class A", colorA], ["Class B", colorB]].forEach(([label, color]) => {
    const item = legend.append("div").style("display", "flex").style("align-items", "center").style("gap", "0.4rem");
    item.append("span")
      .style("width", "10px")
      .style("height", "10px")
      .style("border-radius", "50%")
      .style("background", color)
      .style("display", "inline-block");
    item.append("span").text(label);
  });

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

  const homophilyBtn = styleToggle(controls.append("button").text("Homophily"));
  const heterophilyBtn = styleToggle(controls.append("button").text("Heterophily"));

  function paintToggles(active) {
    [[homophilyBtn, "homophily"], [heterophilyBtn, "heterophily"]].forEach(([btn, mode]) => {
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

  const edgeLayer = svg.append("g");
  const nodeLayer = svg.append("g");

  let linkSel = edgeLayer.selectAll("line.edge");

  const nodeSel = nodeLayer.selectAll("circle.node")
    .data(nodes, (d) => d.id)
    .join("circle")
    .attr("class", "node")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", 8)
    .attr("fill", (d) => d.color)
    .attr("stroke", "var(--bg)")
    .attr("stroke-width", 2);

  function ticked() {
    nodeSel.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    linkSel
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);
  }

  // Re-layout groups apart in homophily mode (so each color settles into
  // its own cluster), and around a shared center in heterophily mode (so
  // cross-color links can pull nodes into one legible mixed layout instead
  // of a tangle of long lines).
  function groupTargetX(mode) {
    return (d) => (mode === "homophily" ? (d.group === "A" ? width * 0.28 : width * 0.72) : width / 2);
  }

  const simulation = d3.forceSimulation(nodes)
    .alphaDecay(0.1)
    .force("charge", d3.forceManyBody().strength(-40))
    .force("collide", d3.forceCollide(13))
    .force("x", d3.forceX(groupTargetX("homophily")).strength(0.06))
    .force("y", d3.forceY(height / 2).strength(0.08))
    .on("tick", ticked);

  const EDGE_FADE_OUT = 220;
  const REPOSITION_WAIT = 700;
  let pendingTimer = null;

  function drawEdges(mode, alpha) {
    const edges = buildEdges(mode);
    simulation.force(
      "link",
      d3.forceLink(edges).id((d) => d.id).distance(30).strength(mode === "homophily" ? 0.85 : 0.5)
    );
    simulation.alpha(alpha).restart();

    linkSel = edgeLayer.selectAll("line.edge")
      .data(edges, (d) => d.key)
      .join((enter) =>
        enter.append("line")
          .attr("class", "edge")
          .attr("stroke", themeColor)
          .attr("stroke-width", 1.5)
          .style("opacity", 0)
          .call((sel) => sel.transition().duration(300).style("opacity", 0.55))
      );
  }

  // First paint: no old edges to clear, so skip straight to drawing.
  function renderInitial(mode) {
    paintToggles(mode);
    status.text(
      mode === "homophily"
        ? "Each node links to its 2 nearest same-colored neighbors."
        : "Each node links to its 2 nearest differently-colored neighbors."
    );
    simulation.force("x", d3.forceX(groupTargetX(mode)).strength(0.06));
    drawEdges(mode, 1);
  }

  // On toggle: fade the old edges out, let the nodes drift to their new
  // arrangement free of any edge pull, then once they've settled draw and
  // fade in the new mode's edges.
  function render(mode) {
    paintToggles(mode);
    status.text(
      mode === "homophily"
        ? "Each node links to its 2 nearest same-colored neighbors."
        : "Each node links to its 2 nearest differently-colored neighbors."
    );
    clearTimeout(pendingTimer);

    edgeLayer.selectAll("line.edge").transition().duration(EDGE_FADE_OUT).style("opacity", 0).remove();
    linkSel = edgeLayer.selectAll("line.edge");

    pendingTimer = setTimeout(() => {
      simulation.force("link", null);
      simulation.force("x", d3.forceX(groupTargetX(mode)).strength(0.06));
      simulation.alpha(1).restart();

      pendingTimer = setTimeout(() => drawEdges(mode, 0.3), REPOSITION_WAIT);
    }, EDGE_FADE_OUT);
  }

  homophilyBtn.on("click", () => render("homophily"));
  heterophilyBtn.on("click", () => render("heterophily"));

  renderInitial("homophily");
})();
