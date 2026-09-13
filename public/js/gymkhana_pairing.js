(function () {
  const root = d3.select("#gymkhana-pairing-viz");
  if (root.empty()) return;
  root.style("flex-direction", "column").style("align-items", "center");

  const articleEl = document.querySelector(".article");
  const themeColor = (articleEl && getComputedStyle(articleEl).getPropertyValue("--theme-color").trim()) || "#0d7377";
  const treeTwoColor = "#c2760f";
  const cutColor = "#b8433d";

  // Node layout: two internal columns (0 = "A", 1 = "B") of 4 rows, plus two
  // terminals L and R. L is where Blue enters the board, R is where Blue must
  // reach — exactly the source/sink pair Blue needs to connect.
  const rowY = [40, 120, 200, 280];
  const colX = [140, 220];
  const nodePos = { L: { x: 40, y: 160 }, R: { x: 320, y: 160 } };
  for (let r = 0; r < 4; r++) {
    nodePos[`${r},0`] = { x: colX[0], y: rowY[r] };
    nodePos[`${r},1`] = { x: colX[1], y: rowY[r] };
  }
  const allNodeIds = Object.keys(nodePos);

  // The graph: 18 edges, split into two edge-disjoint spanning trees (T1, T2)
  // that together cover every edge exactly once. Verified offline: any legal
  // sequence of "cuts" can always be answered so the union-find over Blue's
  // claimed edges eventually connects L to R.
  const edgeDefs = [
    ["H0", "0,0", "0,1", 2], ["H1", "1,0", "1,1", 2], ["H2", "2,0", "2,1", 1], ["H3", "3,0", "3,1", 1],
    ["V00", "0,0", "1,0", 2], ["V10", "1,0", "2,0", 1], ["V20", "2,0", "3,0", 2],
    ["V01", "0,1", "1,1", 1], ["V11", "1,1", "2,1", 2], ["V21", "2,1", "3,1", 1],
    ["L0", "L", "0,0", 1], ["L1", "L", "1,0", 2], ["L2", "L", "2,0", 1], ["L3", "L", "3,0", 2],
    ["R0", "R", "0,1", 2], ["R1", "R", "1,1", 1], ["R2", "R", "2,1", 1], ["R3", "R", "3,1", 2],
  ];
  const byId = {};
  edgeDefs.forEach(([id, a, b, tree]) => { byId[id] = { id, a, b, tree, status: "unclaimed" }; });
  const allEdgeIds = edgeDefs.map((e) => e[0]);

  function treeColor(tree) { return tree === 1 ? themeColor : treeTwoColor; }

  // --- union-find over claimed edges (models "Blue's connectivity so far") ---
  function newUF() {
    const p = new Map(allNodeIds.map((n) => [n, n]));
    return p;
  }
  function find(p, x) {
    while (p.get(x) !== x) { p.set(x, p.get(p.get(x))); x = p.get(x); }
    return x;
  }
  function cloneUF(p) { return new Map(p); }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Randomized check: does the graph, contracted by `parent` and restricted to
  // `edgeIds`, still contain two edge-disjoint spanning trees? This is the
  // live content of Lehman's theorem for the *remaining* game.
  function hasTwoDisjointSpanningTrees(parent, edgeIds, attempts) {
    const roots = new Set(allNodeIds.map((n) => find(parent, n)));
    const target = roots.size - 1;
    if (target === 0) return true;
    for (let t = 0; t < attempts; t++) {
      const order = shuffle(edgeIds);
      const p1 = cloneUF(parent);
      let count = 0;
      const usedT1 = new Set();
      for (const id of order) {
        const e = byId[id];
        const ra = find(p1, e.a), rb = find(p1, e.b);
        if (ra !== rb) { p1.set(ra, rb); count++; usedT1.add(id); }
      }
      if (count !== target) continue;
      const remainder = edgeIds.filter((id) => !usedT1.has(id));
      const p2 = cloneUF(parent);
      let count2 = 0;
      for (const id of remainder) {
        const e = byId[id];
        const ra = find(p2, e.a), rb = find(p2, e.b);
        if (ra !== rb) { p2.set(ra, rb); count2++; }
      }
      if (count2 === target) return true;
    }
    return false;
  }

  // Blue's response to Red cutting `cutEdge`: try the paired tree first (the
  // clean textbook case), then fall back to any edge that keeps the
  // two-spanning-tree invariant alive (still always exists, per Lehman).
  function findResponse(parent, availableIds, cutEdge) {
    const oppositeTree = cutEdge.tree === 1 ? 2 : 1;
    const preferred = availableIds.filter((id) => byId[id].tree === oppositeTree);
    const rest = availableIds.filter((id) => byId[id].tree !== oppositeTree);
    for (const [pool, attempts] of [[shuffle(preferred), 60], [shuffle(rest), 60], [shuffle(availableIds), 400]]) {
      for (const f of pool) {
        const testParent = cloneUF(parent);
        const ef = byId[f];
        const rf1 = find(testParent, ef.a), rf2 = find(testParent, ef.b);
        if (rf1 !== rf2) testParent.set(rf1, rf2);
        const restEdges = availableIds.filter((id) => id !== f);
        if (hasTwoDisjointSpanningTrees(testParent, restEdges, attempts)) {
          return { id: f, fromPairedTree: byId[f].tree === oppositeTree };
        }
      }
    }
    return null;
  }

  // --- rendering ---
  const controls = root.append("div")
    .style("display", "flex").style("flex-wrap", "wrap").style("justify-content", "center")
    .style("gap", "0.75rem").style("margin-bottom", "0.75rem");

  const playBtn = controls.append("button")
    .text("Play a random Red move")
    .style("font-family", "var(--font-sans)").style("font-size", "0.85rem").style("font-weight", "600")
    .style("color", "#fff").style("background", themeColor).style("border", "none")
    .style("border-radius", "999px").style("padding", "0.5rem 1.1rem").style("cursor", "pointer");

  const resetBtn = controls.append("button")
    .text("Reset")
    .style("font-family", "var(--font-sans)").style("font-size", "0.85rem").style("font-weight", "600")
    .style("color", "var(--text-muted)").style("background", "var(--bg)")
    .style("border", "1px solid var(--border)").style("border-radius", "999px")
    .style("padding", "0.5rem 1.1rem").style("cursor", "pointer");

  const legend = root.append("div")
    .style("display", "flex").style("flex-wrap", "wrap").style("justify-content", "center")
    .style("gap", "1.1rem").style("margin-bottom", "0.5rem")
    .style("font-family", "var(--font-sans)").style("font-size", "0.78rem").style("color", "var(--text-muted)");
  function legendItem(color, label) {
    const item = legend.append("span").style("display", "inline-flex").style("align-items", "center").style("gap", "0.35rem");
    item.append("span").style("width", "14px").style("height", "3px").style("background", color).style("display", "inline-block").style("border-radius", "2px");
    item.append("span").text(label);
  }
  legendItem(themeColor, "Tree T₁");
  legendItem(treeTwoColor, "Tree T₂");
  legendItem(cutColor, "cut by Red");

  const svg = root.append("svg")
    .attr("viewBox", "0 0 360 320")
    .style("width", "100%").style("max-width", "360px");

  const edgeLayer = svg.append("g");
  const hitLayer = svg.append("g");
  const nodeLayer = svg.append("g");
  const pulseLayer = svg.append("g");

  const status = root.append("p")
    .style("font-family", "var(--font-sans)").style("font-size", "0.85rem").style("color", "var(--text)")
    .style("text-align", "center").style("max-width", "420px").style("min-height", "2.6em")
    .style("margin", "0.75rem 0 0")
    .text("Click any edge to play it as Red, or use the button above.");

  const roundLabel = root.append("p")
    .style("font-family", "var(--font-sans)").style("font-size", "0.78rem").style("color", "var(--text-muted)")
    .style("margin", "0.25rem 0 0")
    .text("Move 0 of 9");

  function edgePath(e) {
    const a = nodePos[e.a], b = nodePos[e.b];
    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  }

  let state, parent, processing;

  function resetState() {
    allEdgeIds.forEach((id) => { byId[id].status = "unclaimed"; });
    state = { round: 0 };
    parent = newUF();
    processing = false;
    status.text("Click any edge to play it as Red, or use the button above.");
    roundLabel.text("Move 0 of 9");
    draw();
  }

  function draw() {
    const edges = allEdgeIds.map((id) => byId[id]);

    const lines = edgeLayer.selectAll("line").data(edges, (d) => d.id);
    lines.enter().append("line").attr("id", (d) => `edge-${d.id}`)
      .merge(lines)
      .attr("x1", (d) => edgePath(d).x1).attr("y1", (d) => edgePath(d).y1)
      .attr("x2", (d) => edgePath(d).x2).attr("y2", (d) => edgePath(d).y2)
      .attr("stroke-linecap", "round")
      .transition().duration(250)
      .attr("stroke", (d) => d.status === "cut" ? cutColor : treeColor(d.tree))
      .attr("stroke-width", (d) => d.status === "claimed" ? 5 : 3)
      .attr("stroke-opacity", (d) => d.status === "cut" ? 0.55 : d.status === "claimed" ? 1 : 0.35)
      .attr("stroke-dasharray", (d) => d.status === "cut" ? "5,4" : null);

    const hits = hitLayer.selectAll("line").data(edges, (d) => d.id);
    hits.enter().append("line")
      .merge(hits)
      .attr("x1", (d) => edgePath(d).x1).attr("y1", (d) => edgePath(d).y1)
      .attr("x2", (d) => edgePath(d).x2).attr("y2", (d) => edgePath(d).y2)
      .attr("stroke", "transparent").attr("stroke-width", 16)
      .style("cursor", (d) => d.status === "unclaimed" ? "pointer" : "default")
      .on("click", (event, d) => { if (d.status === "unclaimed") handleCut(d.id); });

    const nodes = nodeLayer.selectAll("circle").data(allNodeIds.map((id) => ({ id, ...nodePos[id] })), (d) => d.id);
    nodes.enter().append("circle")
      .merge(nodes)
      .attr("cx", (d) => d.x).attr("cy", (d) => d.y)
      .attr("r", (d) => (d.id === "L" || d.id === "R") ? 10 : 6)
      .attr("fill", (d) => (d.id === "L" || d.id === "R") ? "var(--text)" : "var(--bg)")
      .attr("stroke", "var(--text)").attr("stroke-width", 1.5);

    const labels = nodeLayer.selectAll("text").data(["L", "R"].map((id) => ({ id, ...nodePos[id] })), (d) => d.id);
    labels.enter().append("text")
      .merge(labels)
      .attr("x", (d) => d.x).attr("y", (d) => d.y - 16)
      .attr("text-anchor", "middle")
      .style("font-family", "var(--font-display)").style("font-size", "0.8rem").style("font-weight", "700")
      .style("fill", "var(--text)")
      .text((d) => d.id);
  }

  function pulseAt(edgeId) {
    const e = byId[edgeId];
    const p = edgePath(e);
    const mx = (p.x1 + p.x2) / 2, my = (p.y1 + p.y2) / 2;
    pulseLayer.append("circle")
      .attr("cx", mx).attr("cy", my).attr("r", 2)
      .attr("fill", "none").attr("stroke", treeColor(e.tree)).attr("stroke-width", 2)
      .attr("opacity", 0.9)
      .transition().duration(500)
      .attr("r", 16).attr("opacity", 0)
      .remove();
  }

  function handleCut(edgeId) {
    if (processing) return;
    processing = true;
    const cutEdge = byId[edgeId];
    cutEdge.status = "cut";
    draw();

    setTimeout(() => {
      const available = allEdgeIds.filter((id) => byId[id].status === "unclaimed");
      const resp = available.length > 0 ? findResponse(parent, available, cutEdge) : null;

      if (resp) {
        byId[resp.id].status = "claimed";
        const ef = byId[resp.id];
        const r1 = find(parent, ef.a), r2 = find(parent, ef.b);
        if (r1 !== r2) parent.set(r1, r2);
        draw();
        pulseAt(resp.id);
        const treeMsg = resp.fromPairedTree
          ? `Blue replies with the paired edge from the other tree.`
          : `Blue replies with another edge that keeps both trees alive.`;
        status.text(`Red cuts an edge from T${cutEdge.tree}. ${treeMsg}`);
      } else {
        status.text(`Red cuts an edge from T${cutEdge.tree}. No more replies needed — board resolved.`);
      }

      state.round++;
      roundLabel.text(`Round ${state.round} of 9`);
      if (find(parent, "L") === find(parent, "R") && allEdgeIds.every((id) => byId[id].status !== "unclaimed")) {
        status.text(status.text() + " Blue's connection from L to R survived every cut.");
      }
      processing = false;
    }, 500);
  }

  playBtn.on("click", () => {
    if (processing) return;
    const available = allEdgeIds.filter((id) => byId[id].status === "unclaimed");
    if (available.length === 0) return;
    const pick = available[(Math.random() * available.length) | 0];
    handleCut(pick);
  });

  resetBtn.on("click", resetState);

  resetState();
})();
