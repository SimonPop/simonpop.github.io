(function () {
  const root = d3.select("#tree-onion-viz");
  if (root.empty()) return;
  root.style("flex-direction", "column").style("align-items", "center");

  const articleEl = document.querySelector(".article");
  const themeColor = (articleEl && getComputedStyle(articleEl).getPropertyValue("--theme-color").trim()) || "#4a5fd9";
  const fadedColor = "#c7cad6";

  // A small "decreasingly branching tree": one hub connected to 4 branches,
  // each branch ending in a single leaf.
  const treeGraph = {
    width: 300,
    height: 240,
    nodes: [
      { id: 0, x: 150, y: 36 },
      { id: 1, x: 60, y: 120 }, { id: 2, x: 115, y: 120 }, { id: 3, x: 185, y: 120 }, { id: 4, x: 240, y: 120 },
      { id: 5, x: 60, y: 204 }, { id: 6, x: 115, y: 204 }, { id: 7, x: 185, y: 204 }, { id: 8, x: 240, y: 204 },
    ],
    edges: [
      [0, 1], [0, 2], [0, 3], [0, 4],
      [1, 5], [2, 6], [3, 7], [4, 8],
    ],
  };

  // A small "onion": one core connected to every node of a single ring, the
  // ring nodes also connected to their two ring neighbors.
  const ringSize = 8;
  const onionNodes = [{ id: 0, x: 150, y: 150 }];
  const onionEdges = [];
  for (let i = 0; i < ringSize; i++) {
    const angle = (i / ringSize) * 2 * Math.PI - Math.PI / 2;
    onionNodes.push({ id: i + 1, x: 150 + 100 * Math.cos(angle), y: 150 + 100 * Math.sin(angle) });
    onionEdges.push([0, i + 1]);
    onionEdges.push([i + 1, (i + 1) % ringSize + 1]);
  }
  const onionGraph = { width: 300, height: 300, nodes: onionNodes, edges: onionEdges };

  function degree(graph) {
    const deg = new Map(graph.nodes.map((n) => [n.id, 0]));
    graph.edges.forEach(([a, b]) => {
      deg.set(a, deg.get(a) + 1);
      deg.set(b, deg.get(b) + 1);
    });
    return deg;
  }

  function components(nodes, edges) {
    const parent = new Map(nodes.map((n) => [n.id, n.id]));
    function find(x) {
      while (parent.get(x) !== x) {
        parent.set(x, parent.get(parent.get(x)));
        x = parent.get(x);
      }
      return x;
    }
    edges.forEach(([a, b]) => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent.set(ra, rb);
    });
    const groups = new Map();
    nodes.forEach((n) => {
      const r = find(n.id);
      if (!groups.has(r)) groups.set(r, []);
      groups.get(r).push(n.id);
    });
    return [...groups.values()].sort((a, b) => b.length - a.length);
  }

  function buildPanel(container, label, graph) {
    const deg = degree(graph);
    const hubId = [...deg.entries()].sort((a, b) => b[1] - a[1])[0][0];

    const panel = container.append("div").style("text-align", "center").style("flex", "1 1 260px");
    panel.append("div")
      .style("font-family", "var(--font-display)")
      .style("font-weight", "700")
      .style("margin-bottom", "0.4rem")
      .text(label);

    const svg = panel.append("svg")
      .attr("viewBox", `0 0 ${graph.width} ${graph.height}`)
      .style("width", "100%")
      .style("max-width", "280px");

    const linkLayer = svg.append("g");
    const nodeLayer = svg.append("g");
    const stat = panel.append("p")
      .style("font-size", "0.85rem")
      .style("color", "var(--text-muted)")
      .style("margin", "0.5rem 0 0");

    function render(removedId) {
      const activeNodes = graph.nodes.filter((n) => n.id !== removedId);
      const activeEdges = graph.edges
        .filter(([a, b]) => a !== removedId && b !== removedId)
        .map(([a, b]) => ({ source: graph.nodes.find((n) => n.id === a), target: graph.nodes.find((n) => n.id === b) }));

      const comps = components(activeNodes, graph.edges.filter(([a, b]) => a !== removedId && b !== removedId));
      const largest = comps.length ? comps[0] : [];
      const inMain = new Set(largest);

      const linkSel = linkLayer.selectAll("line").data(activeEdges, (d) => `${d.source.id}-${d.target.id}`);
      linkSel.exit().remove();
      linkSel.enter()
        .append("line")
        .attr("stroke-width", 2)
        .merge(linkSel)
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y)
        .attr("stroke", (d) => (inMain.has(d.source.id) && inMain.has(d.target.id) ? themeColor : fadedColor));

      const nodeSel = nodeLayer.selectAll("circle").data(activeNodes, (d) => d.id);
      nodeSel.exit().transition().duration(300).attr("r", 0).remove();
      nodeSel.enter()
        .append("circle")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", 0)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .merge(nodeSel)
        .transition().duration(300)
        .attr("r", (d) => (d.id === hubId ? 10 : 7))
        .attr("fill", (d) => (inMain.has(d.id) ? themeColor : fadedColor));

      stat.text(`Main component: ${largest.length} / ${graph.nodes.length} nodes (${Math.round((largest.length / graph.nodes.length) * 100)}%)`);
    }

    render(null);
    return render;
  }

  const controls = root.append("div")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("gap", "0.75rem")
    .style("margin-bottom", "1rem");

  const removeBtn = controls.append("button")
    .text("Remove highest-degree node")
    .style("font-family", "var(--font-sans)")
    .style("font-size", "0.85rem")
    .style("font-weight", "600")
    .style("color", "#fff")
    .style("background", themeColor)
    .style("border", "none")
    .style("border-radius", "999px")
    .style("padding", "0.5rem 1.1rem")
    .style("cursor", "pointer");

  const resetBtn = controls.append("button")
    .text("Reset")
    .style("font-family", "var(--font-sans)")
    .style("font-size", "0.85rem")
    .style("font-weight", "600")
    .style("color", "var(--text-muted)")
    .style("background", "var(--bg)")
    .style("border", "1px solid var(--border)")
    .style("border-radius", "999px")
    .style("padding", "0.5rem 1.1rem")
    .style("cursor", "pointer");

  const panels = root.append("div")
    .style("display", "flex")
    .style("flex-wrap", "wrap")
    .style("justify-content", "center")
    .style("gap", "1.5rem");

  const renderTree = buildPanel(panels, "Tree", treeGraph);
  const renderOnion = buildPanel(panels, "Onion", onionGraph);

  let removed = false;
  removeBtn.on("click", () => {
    if (removed) return;
    removed = true;
    const treeHub = [...degree(treeGraph).entries()].sort((a, b) => b[1] - a[1])[0][0];
    const onionHub = [...degree(onionGraph).entries()].sort((a, b) => b[1] - a[1])[0][0];
    renderTree(treeHub);
    renderOnion(onionHub);
  });

  resetBtn.on("click", () => {
    removed = false;
    renderTree(null);
    renderOnion(null);
  });
})();
