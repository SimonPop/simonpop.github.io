(function () {
  const root = d3.select("#gymkhana-exercise-viz");
  if (root.empty()) return;
  root.style("flex-direction", "column").style("align-items", "center");

  const articleEl = document.querySelector(".article");
  const themeColor = (articleEl && getComputedStyle(articleEl).getPropertyValue("--theme-color").trim()) || "#0d7377";
  const cutColor = "#b8433d";
  const okColor = "#2e8b57";

  // Same board as the Round 2 widget: 10 nodes, 18 edges. The tree field is
  // still used internally by findResponse/isValidReply (Blue's pairing
  // logic), but this widget deliberately doesn't color-code T1 vs T2 --
  // showing that would let a reader pattern-match "the other color" instead
  // of reasoning about what actually keeps Blue connected.
  const nodePos = { L: { x: 40, y: 160 }, R: { x: 320, y: 160 } };
  const rowY = [40, 120, 200, 280], colX = [140, 220];
  for (let r = 0; r < 4; r++) { nodePos[`${r},0`] = { x: colX[0], y: rowY[r] }; nodePos[`${r},1`] = { x: colX[1], y: rowY[r] }; }
  const allNodeIds = Object.keys(nodePos);

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

  function newUF() { return new Map(allNodeIds.map((n) => [n, n])); }
  function find(p, x) { while (p.get(x) !== x) { p.set(x, p.get(p.get(x))); x = p.get(x); } return x; }
  function cloneUF(p) { return new Map(p); }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

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
        if (hasTwoDisjointSpanningTrees(testParent, restEdges, attempts)) return { id: f };
      }
    }
    return null;
  }

  function isValidReply(parent, availableIds, guessId) {
    const testParent = cloneUF(parent);
    const eg = byId[guessId];
    const r1 = find(testParent, eg.a), r2 = find(testParent, eg.b);
    if (r1 !== r2) testParent.set(r1, r2);
    const rest = availableIds.filter((id) => id !== guessId);
    return hasTwoDisjointSpanningTrees(testParent, rest, 500);
  }

  const controls = root.append("div")
    .style("display", "flex").style("flex-wrap", "wrap").style("justify-content", "center")
    .style("gap", "0.75rem").style("margin-bottom", "0.75rem");

  const newBtn = controls.append("button")
    .text("New scenario")
    .style("font-family", "var(--font-sans)").style("font-size", "0.85rem").style("font-weight", "600")
    .style("color", "#fff").style("background", themeColor).style("border", "none")
    .style("border-radius", "999px").style("padding", "0.5rem 1.1rem").style("cursor", "pointer");

  const revealBtn = controls.append("button")
    .text("Reveal a valid reply")
    .style("font-family", "var(--font-sans)").style("font-size", "0.85rem").style("font-weight", "600")
    .style("color", "var(--text-muted)").style("background", "var(--bg)")
    .style("border", "1px solid var(--border)").style("border-radius", "999px")
    .style("padding", "0.5rem 1.1rem").style("cursor", "pointer");

  const svg = root.append("svg").attr("viewBox", "0 0 360 320").style("width", "100%").style("max-width", "360px");
  const edgeLayer = svg.append("g");
  const hitLayer = svg.append("g");
  const nodeLayer = svg.append("g");
  const pulseLayer = svg.append("g");

  const status = root.append("p")
    .style("font-family", "var(--font-sans)").style("font-size", "0.85rem").style("color", "var(--text)")
    .style("text-align", "center").style("max-width", "420px").style("min-height", "2.6em")
    .style("margin", "0.75rem 0 0");

  let parent, solved, revealedId, pendingCutId;

  function edgePath(e) { const a = nodePos[e.a], b = nodePos[e.b]; return { x1: a.x, y1: a.y, x2: b.x, y2: b.y }; }

  function pulseAt(edgeId, color) {
    const p = edgePath(byId[edgeId]);
    const mx = (p.x1 + p.x2) / 2, my = (p.y1 + p.y2) / 2;
    pulseLayer.append("circle").attr("cx", mx).attr("cy", my).attr("r", 2)
      .attr("fill", "none").attr("stroke", color).attr("stroke-width", 2).attr("opacity", 0.9)
      .transition().duration(500).attr("r", 16).attr("opacity", 0).remove();
  }

  function setupScenario(attempt = 0) {
    allEdgeIds.forEach((id) => (byId[id].status = "unclaimed"));
    parent = newUF();
    solved = false;
    revealedId = null;

    const rounds = 2 + ((Math.random() * 3) | 0); // 2..4 warm-up rounds
    for (let i = 0; i < rounds; i++) {
      const available = allEdgeIds.filter((id) => byId[id].status === "unclaimed");
      if (available.length < 2) break;
      const cutId = available[(Math.random() * available.length) | 0];
      byId[cutId].status = "cut";
      const remaining = allEdgeIds.filter((id) => byId[id].status === "unclaimed");
      const resp = findResponse(parent, remaining, byId[cutId]);
      if (!resp) break;
      byId[resp.id].status = "claimed";
      const ef = byId[resp.id];
      const r1 = find(parent, ef.a), r2 = find(parent, ef.b);
      if (r1 !== r2) parent.set(r1, r2);
    }

    // Blue already fully connected before the puzzle even starts -- degenerate,
    // any reply would trivially "work". Reroll for a real decision point.
    if (find(parent, "L") === find(parent, "R") && attempt < 20) {
      setupScenario(attempt + 1);
      return;
    }

    const available = allEdgeIds.filter((id) => byId[id].status === "unclaimed");
    pendingCutId = available[(Math.random() * available.length) | 0];
    byId[pendingCutId].status = "cut";

    status.text("Red just cut the highlighted edge. Click the edge Blue should claim to stay safely connected.");
    revealBtn.text("Reveal a valid reply");
    draw();
    pulseAt(pendingCutId, cutColor);
  }

  function draw() {
    const edges = allEdgeIds.map((id) => byId[id]);
    const lines = edgeLayer.selectAll("line").data(edges, (d) => d.id);
    lines.enter().append("line").attr("stroke-linecap", "round")
      .merge(lines)
      .attr("x1", (d) => edgePath(d).x1).attr("y1", (d) => edgePath(d).y1)
      .attr("x2", (d) => edgePath(d).x2).attr("y2", (d) => edgePath(d).y2)
      .attr("stroke", (d) => {
        if (d.id === pendingCutId) return cutColor;
        if (d.status === "cut") return cutColor;
        if (d.id === revealedId) return okColor;
        return themeColor;
      })
      .attr("stroke-width", (d) => (d.status === "claimed" || d.id === revealedId ? 5 : 3))
      .attr("stroke-opacity", (d) => (d.status === "cut" ? 0.55 : d.status === "claimed" ? 1 : d.id === revealedId ? 0.9 : 0.35))
      .attr("stroke-dasharray", (d) => (d.status === "cut" || d.id === revealedId ? "5,4" : null));

    const hits = hitLayer.selectAll("line").data(edges, (d) => d.id);
    hits.enter().append("line").merge(hits)
      .attr("x1", (d) => edgePath(d).x1).attr("y1", (d) => edgePath(d).y1)
      .attr("x2", (d) => edgePath(d).x2).attr("y2", (d) => edgePath(d).y2)
      .attr("stroke", "transparent").attr("stroke-width", 16)
      .style("cursor", (d) => (!solved && d.status === "unclaimed" ? "pointer" : "default"))
      .on("click", (event, d) => { if (!solved && d.status === "unclaimed") handleGuess(d.id); });

    const nodes = nodeLayer.selectAll("circle").data(allNodeIds.map((id) => ({ id, ...nodePos[id] })), (d) => d.id);
    nodes.enter().append("circle").merge(nodes)
      .attr("cx", (d) => d.x).attr("cy", (d) => d.y).attr("r", (d) => (d.id === "L" || d.id === "R" ? 10 : 6))
      .attr("fill", (d) => (d.id === "L" || d.id === "R" ? "var(--text)" : "var(--bg)"))
      .attr("stroke", "var(--text)").attr("stroke-width", 1.5);

    const labels = nodeLayer.selectAll("text").data(["L", "R"].map((id) => ({ id, ...nodePos[id] })), (d) => d.id);
    labels.enter().append("text").merge(labels)
      .attr("x", (d) => d.x).attr("y", (d) => d.y - 16).attr("text-anchor", "middle")
      .style("font-family", "var(--font-display)").style("font-size", "0.8rem").style("font-weight", "700")
      .style("fill", "var(--text)").text((d) => d.id);
  }

  function handleGuess(guessId) {
    const available = allEdgeIds.filter((id) => byId[id].status === "unclaimed");
    const ok = isValidReply(parent, available, guessId);
    if (ok) {
      byId[guessId].status = "claimed";
      const ef = byId[guessId];
      const r1 = find(parent, ef.a), r2 = find(parent, ef.b);
      if (r1 !== r2) parent.set(r1, r2);
      solved = true;
      draw();
      pulseAt(guessId, okColor);
      status.text("Correct — that edge keeps both trees alive, so Blue is still guaranteed to reach R. Try “New scenario” for another one.");
    } else {
      pulseAt(guessId, cutColor);
      status.text("Not quite — claiming that edge would let Red finish cutting Blue off eventually. Try a different edge.");
    }
  }

  newBtn.on("click", setupScenario);
  revealBtn.on("click", () => {
    if (solved) return;
    const available = allEdgeIds.filter((id) => byId[id].status === "unclaimed");
    const resp = findResponse(parent, available, byId[pendingCutId]);
    if (resp) {
      revealedId = resp.id;
      draw();
      status.text("One valid reply is highlighted in green — any edge that keeps both trees alive works just as well.");
    }
  });

  setupScenario();
})();
