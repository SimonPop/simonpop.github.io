(function () {
  const root = d3.select("#percolation-viz");
  if (root.empty()) return;

  const N = 10;
  const width = 480;
  const height = 480;
  const margin = 24;
  const step = (width - 2 * margin) / (N - 1);

  const palette = d3.schemeTableau10;
  const isolatedColor = "#c7cad6";

  function buildLattice() {
    const nodes = [];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        nodes.push({ id: i * N + j, x: margin + j * step, y: margin + i * step });
      }
    }
    const edges = [];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const id = i * N + j;
        if (j < N - 1) edges.push({ source: id, target: id + 1, t: Math.random() });
        if (i < N - 1) edges.push({ source: id, target: id + N, t: Math.random() });
      }
    }
    return { nodes, edges };
  }

  let { nodes, edges } = buildLattice();

  const controls = root.append("div").style("display", "flex")
    .style("flex-wrap", "wrap")
    .style("align-items", "center")
    .style("gap", "0.5rem 1.25rem")
    .style("margin-bottom", "0.85rem")
    .style("font-family", "var(--font-sans)")
    .style("font-size", "0.9rem")
    .style("color", "var(--text-muted)");

  const pRow = controls.append("label").style("display", "flex").style("align-items", "center").style("gap", "0.5rem");
  pRow.append("span").text("p =");
  const slider = pRow.append("input")
    .attr("type", "range")
    .attr("min", 0)
    .attr("max", 1)
    .attr("step", 0.01)
    .attr("value", 0.5)
    .style("width", "160px");
  const pValue = pRow.append("span").style("font-weight", "600").style("color", "var(--text)").text("0.50");

  const statSpan = controls.append("span");
  statSpan.append("strong").style("color", "var(--text)").text("Largest cluster: ");
  const statValue = statSpan.append("span").text("—");

  const reshuffle = controls.append("button")
    .text("Reshuffle")
    .style("margin-left", "auto")
    .style("font-family", "var(--font-sans)")
    .style("font-size", "0.85rem")
    .style("font-weight", "600")
    .style("color", "var(--text-muted)")
    .style("background", "var(--bg)")
    .style("border", "1px solid var(--border)")
    .style("border-radius", "999px")
    .style("padding", "0.3rem 0.85rem")
    .style("cursor", "pointer");

  const svg = root.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .style("max-width", `${width}px`)
    .style("display", "block")
    .style("margin", "0 auto");

  const edgeLayer = svg.append("g");
  const nodeLayer = svg.append("g");

  function components(keptEdges) {
    const parent = new Map(nodes.map((n) => [n.id, n.id]));
    function find(x) {
      while (parent.get(x) !== x) {
        parent.set(x, parent.get(parent.get(x)));
        x = parent.get(x);
      }
      return x;
    }
    keptEdges.forEach((e) => {
      const ra = find(e.source);
      const rb = find(e.target);
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

  function render(p) {
    const kept = edges.filter((e) => e.t >= p);
    const comps = components(kept);

    const colorByNode = new Map();
    let colorIndex = 0;
    comps.forEach((comp) => {
      const color = comp.length > 1 ? palette[colorIndex++ % palette.length] : isolatedColor;
      comp.forEach((id) => colorByNode.set(id, color));
    });

    const nodeById = new Map(nodes.map((n) => [n.id, n]));

    const edgeSel = edgeLayer.selectAll("line").data(kept, (d) => `${d.source}-${d.target}`);
    const edgeMerge = edgeSel.enter()
      .append("line")
      .attr("stroke-width", 1.5)
      .merge(edgeSel);
    edgeSel.exit().remove();
    edgeMerge
      .attr("x1", (d) => nodeById.get(d.source).x)
      .attr("y1", (d) => nodeById.get(d.source).y)
      .attr("x2", (d) => nodeById.get(d.target).x)
      .attr("y2", (d) => nodeById.get(d.target).y)
      .attr("stroke", (d) => colorByNode.get(d.source));

    const nodeSel = nodeLayer.selectAll("circle").data(nodes, (d) => d.id);
    const nodeMerge = nodeSel.enter()
      .append("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 5)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .merge(nodeSel);
    nodeMerge.transition().duration(120).attr("fill", (d) => colorByNode.get(d.id));

    const largest = comps.length ? comps[0].length : 0;
    statValue.text(`${Math.round((largest / nodes.length) * 100)}%`);
    pValue.text(p.toFixed(2));
  }

  slider.on("input", function () {
    render(+this.value);
  });

  reshuffle.on("click", function () {
    ({ nodes, edges } = buildLattice());
    edgeLayer.selectAll("line").remove();
    nodeLayer.selectAll("circle").remove();
    render(+slider.property("value"));
  });

  render(0.5);
})();
