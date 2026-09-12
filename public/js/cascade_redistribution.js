(function () {
  const root = d3.select("#cascade-viz");
  if (root.empty()) return;
  root.style("display", "flex").style("flex-direction", "column").style("align-items", "center").style("gap", "0.6rem");

  const themeEl = document.querySelector(".spark, .article");
  const themeColor = (themeEl && getComputedStyle(themeEl).getPropertyValue("--theme-color").trim()) || "#4a5fd9";
  const baseColor = (themeEl && getComputedStyle(themeEl).getPropertyValue("--border").trim()) || "#cbd5e1";
  const dangerColor = "#b8433d";
  const width = 480, height = 260;

  // A hub-and-spoke network: Hub carries the most structural traffic, the
  // five Ring nodes (wired in a cycle, plus a spoke to the Hub) carry a
  // moderate amount, and the five Leaf nodes (one per ring node) carry the
  // least. Capacities follow Crucitti et al. (2004)'s model: C_i = alpha *
  // L_i(0), a single tolerance parameter shared across the network. A low
  // alpha means every node is already running close to its own capacity —
  // "maximizing the regime" — which is exactly what leaves no slack to
  // absorb anyone else's failure.
  const ROLE_LOAD0 = { hub: 40, ring: 22, leaf: 8 };
  const ROLE_RADIUS = { hub: 24, ring: 16, leaf: 11 };
  const REGIMES = {
    low: { alpha: 1.8, label: "Low utilization" },
    high: { alpha: 1.08, label: "High utilization" },
  };

  const RING_IDS = ["A", "B", "C", "D", "E"];
  const R1 = 66, R2 = 118;
  const hubPos = { x: width / 2, y: height / 2 };

  const nodes = [{ id: "Hub", role: "hub", x: hubPos.x, y: hubPos.y }];
  RING_IDS.forEach((letter, i) => {
    const angle = -Math.PI / 2 + i * ((2 * Math.PI) / RING_IDS.length);
    nodes.push({ id: letter, role: "ring", x: hubPos.x + R1 * Math.cos(angle), y: hubPos.y + R1 * Math.sin(angle) });
    nodes.push({ id: `${letter}1`, role: "leaf", x: hubPos.x + R2 * Math.cos(angle), y: hubPos.y + R2 * Math.sin(angle) });
  });
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  const edges = [];
  RING_IDS.forEach((letter, i) => {
    edges.push({ source: "Hub", target: letter });
    edges.push({ source: letter, target: `${letter}1` });
    edges.push({ source: letter, target: RING_IDS[(i + 1) % RING_IDS.length] });
  });

  const radiusOf = (id) => ROLE_RADIUS[nodeById.get(id).role];

  let capacity = new Map();
  let load = new Map();
  let deadSet = new Set();
  let regime = "low";
  let animating = false;
  let timers = [];

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

  const lowBtn = styleToggle(controls.append("button").text(REGIMES.low.label));
  const highBtn = styleToggle(controls.append("button").text(REGIMES.high.label));
  const triggerBtn = styleToggle(controls.append("button").text("Fail the hub"))
    .style("border", "1px solid " + themeColor)
    .style("background", themeColor)
    .style("color", "#fff");

  function paintToggles(active) {
    [[lowBtn, "low"], [highBtn, "high"]].forEach(([btn, key]) => {
      const isActive = key === active;
      btn
        .style("border", isActive ? "1px solid " + themeColor : "1px solid var(--border)")
        .style("background", isActive ? themeColor : "var(--bg)")
        .style("color", isActive ? "#fff" : "var(--text-muted)");
    });
  }

  function setTriggerEnabled(enabled) {
    triggerBtn
      .attr("disabled", enabled ? null : true)
      .style("opacity", enabled ? 1 : 0.5)
      .style("cursor", enabled ? "pointer" : "default");
  }

  const status = root.append("div")
    .style("font-family", "var(--font-sans)")
    .style("font-size", "0.85rem")
    .style("font-style", "italic")
    .style("color", "var(--text-muted)")
    .style("text-align", "center")
    .style("min-height", "2.4em");

  // ---- svg ----
  const svg = root.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("width", "100%")
    .style("max-width", "460px");

  const edgeLayer = svg.append("g");
  const nodeLayer = svg.append("g");

  const edgeSel = edgeLayer.selectAll("line.edge")
    .data(edges)
    .join("line")
    .attr("class", "edge")
    .attr("x1", (d) => nodeById.get(d.source).x)
    .attr("y1", (d) => nodeById.get(d.source).y)
    .attr("x2", (d) => nodeById.get(d.target).x)
    .attr("y2", (d) => nodeById.get(d.target).y)
    .attr("stroke", "var(--border)")
    .attr("stroke-width", 1.2);

  const nodeG = nodeLayer.selectAll("g.node")
    .data(nodes, (d) => d.id)
    .join("g")
    .attr("class", "node")
    .attr("transform", (d) => `translate(${d.x},${d.y})`);

  // Each node is a gauge: the outer ring's radius is fixed by capacity, and
  // the inner disc fills up to show current load as a fraction of it.
  nodeG.append("circle")
    .attr("class", "cap-ring")
    .attr("r", (d) => radiusOf(d.id))
    .attr("fill", "none")
    .attr("stroke", "var(--border)")
    .attr("stroke-width", 1.5);

  nodeG.append("circle").attr("class", "load-fill").attr("r", 0);
  nodeG.append("title");

  const legend = root.append("p")
    .style("font-family", "var(--font-sans)")
    .style("font-size", "0.78rem")
    .style("color", "var(--text-muted)")
    .style("text-align", "center")
    .style("margin", "0")
    .text("Ring size is capacity, the fill is current load. Hover a node for exact numbers.");

  const colorScale = d3.interpolateRgb(baseColor, themeColor);

  function updateVisuals(duration) {
    const applyTo = (sel) => (duration ? sel.transition().duration(duration) : sel);

    applyTo(nodeG).attr("opacity", (d) => (deadSet.has(d.id) ? 0.32 : 1));

    nodeG.select(".cap-ring").attr("stroke-dasharray", (d) => (deadSet.has(d.id) ? "3,3" : null));

    applyTo(nodeG.select(".load-fill"))
      .attr("r", (d) => {
        if (deadSet.has(d.id)) return 0;
        const frac = load.get(d.id) / capacity.get(d.id);
        return Math.min(frac, 1) * radiusOf(d.id) * 0.82;
      })
      .attr("fill", (d) => {
        const frac = load.get(d.id) / capacity.get(d.id);
        return frac > 1 ? dangerColor : colorScale(Math.max(0, frac));
      });

    nodeG.select("title").text((d) => {
      if (deadSet.has(d.id)) return `${d.id}: failed`;
      const frac = load.get(d.id) / capacity.get(d.id);
      return `${d.id}: ${load.get(d.id).toFixed(1)} / ${capacity.get(d.id).toFixed(1)} (${Math.round(frac * 100)}%)`;
    });

    applyTo(edgeSel).attr("opacity", (d) => (deadSet.has(d.source) || deadSet.has(d.target) ? 0.1 : 0.55));
  }

  function resetState(key) {
    timers.forEach(clearTimeout);
    timers = [];
    animating = false;
    regime = key;
    deadSet = new Set();
    const alpha = REGIMES[key].alpha;
    capacity = new Map(nodes.map((n) => [n.id, alpha * ROLE_LOAD0[n.role]]));
    load = new Map(nodes.map((n) => [n.id, ROLE_LOAD0[n.role]]));
    paintToggles(key);
    setTriggerEnabled(true);
    status.text(
      key === "low"
        ? "Every node keeps plenty of headroom below its capacity. Click “Fail the hub” to see what happens."
        : "Every node runs at roughly the same tight utilization to maximize throughput. Click “Fail the hub” to see what happens."
    );
    updateVisuals(0);
  }

  // Removing a node hands its entire load to whatever remains, split in
  // proportion to each survivor's own capacity — the same three-step loop
  // described in the article: redistribute, check for overflow, repeat.
  function computeCascade(startId) {
    const localAlive = new Set(nodes.map((n) => n.id));
    const localLoad = new Map(load);
    let toFail = [startId];
    const rounds = [];

    while (toFail.length) {
      let redistributeTotal = 0;
      toFail.forEach((id) => {
        redistributeTotal += localLoad.get(id);
        localAlive.delete(id);
      });
      const aliveIds = [...localAlive];
      const capSum = aliveIds.reduce((s, id) => s + capacity.get(id), 0);
      if (capSum > 0) {
        aliveIds.forEach((id) => {
          const share = redistributeTotal * (capacity.get(id) / capSum);
          localLoad.set(id, localLoad.get(id) + share);
        });
      }
      const newlyFailed = aliveIds.filter((id) => localLoad.get(id) > capacity.get(id));
      rounds.push({ failedNow: [...toFail], redistributeTotal, loadSnapshot: new Map(localLoad), newlyFailed });
      toFail = newlyFailed;
    }
    return rounds;
  }

  function playRounds(rounds, idx) {
    if (idx >= rounds.length) {
      animating = false;
      setTriggerEnabled(true);
      status.text(
        deadSet.size === nodes.length
          ? `Total collapse — all ${nodes.length} nodes failed. At this tolerance, no survivor ever had enough spare capacity to absorb its share.`
          : `Cascade stops here — ${deadSet.size} of ${nodes.length} nodes failed. Everyone left had enough headroom to absorb the rest.`
      );
      return;
    }

    const r = rounds[idx];
    r.failedNow.forEach((id) => deadSet.add(id));
    status.text(
      idx === 0
        ? `${r.failedNow.join(", ")} fails.`
        : `Overloaded, ${r.failedNow.join(", ")} ${r.failedNow.length > 1 ? "fail" : "fails"} too.`
    );
    updateVisuals(500);

    timers.push(
      setTimeout(() => {
        load = r.loadSnapshot;
        status.text(
          r.newlyFailed.length === 0
            ? `Its load spreads across the ${nodes.length - deadSet.size} nodes still standing — every one of them stays under capacity.`
            : `Its load spreads across the network, tipping ${r.newlyFailed.join(", ")} over capacity too.`
        );
        updateVisuals(600);

        timers.push(setTimeout(() => playRounds(rounds, idx + 1), 900));
      }, 600)
    );
  }

  lowBtn.on("click", () => resetState("low"));
  highBtn.on("click", () => resetState("high"));

  triggerBtn.on("click", () => {
    if (animating) return;
    resetState(regime);
    animating = true;
    setTriggerEnabled(false);
    const rounds = computeCascade("Hub");
    playRounds(rounds, 0);
  });

  resetState("low");
})();
