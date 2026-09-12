(function () {
  const root = d3.select("#gymkhana-board-dual-viz");
  if (root.empty()) return;
  root.style("flex-direction", "column").style("align-items", "center");

  const articleEl = document.querySelector(".article");
  const blueColor = (articleEl && getComputedStyle(articleEl).getPropertyValue("--theme-color").trim()) || "#4a5fd9";
  const redColor = "#b8433d";

  // Bridg-it's real board: a grid of dots colored like a checkerboard by
  // parity of (row+col). Every unit cell has exactly one Blue corner-pair
  // (the two same-parity-even corners) and one Red corner-pair -- its two
  // diagonals. Blue plays the Blue diagonal in any cell, Red plays the Red
  // diagonal in the same cell; the two always cross at the cell's center.
  // This makes Blue's and Red's graphs perfectly symmetric: exactly one
  // possible edge of each color per cell, always.
  const N = 5; // N x N dots -> (N-1) x (N-1) cells
  const spacing = 45;
  const originX = 50, originY = 55;

  const dots = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    dots.push({ id: `P-${i}-${j}`, i, j, x: originX + j * spacing, y: originY + i * spacing, blue: (i + j) % 2 === 0 });
  }
  const posOf = {};
  dots.forEach((d) => (posOf[d.id] = d));

  const blueEdges = [], redEdges = [];
  for (let i = 0; i < N - 1; i++) {
    for (let j = 0; j < N - 1; j++) {
      const TL = `P-${i}-${j}`, TR = `P-${i}-${j + 1}`, BL = `P-${i + 1}-${j}`, BR = `P-${i + 1}-${j + 1}`;
      const tlBlue = (i + j) % 2 === 0;
      const blueEnds = tlBlue ? [TL, BR] : [TR, BL];
      const redEnds = tlBlue ? [TR, BL] : [TL, BR];
      blueEdges.push({ id: `BD-${i}-${j}`, a: blueEnds[0], b: blueEnds[1], i, j });
      redEdges.push({ id: `RD-${i}-${j}`, a: redEnds[0], b: redEnds[1], i, j });
    }
  }
  const byId = {};
  blueEdges.forEach((e) => (byId[e.id] = e));
  redEdges.forEach((e) => (byId[e.id] = e));

  // Crossing partner: always the other-colored diagonal of the very same cell.
  function crossingOfBlue(e) { return `RD-${e.i}-${e.j}`; }
  function crossingOfRed(e) { return `BD-${e.i}-${e.j}`; }

  const controls = root.append("div")
    .style("display", "flex").style("flex-wrap", "wrap").style("justify-content", "center")
    .style("gap", "0.5rem").style("margin-bottom", "0.75rem");

  let mode = "both";
  let selected = null;

  function tabButton(label, value) {
    return controls.append("button")
      .text(label)
      .attr("data-mode", value)
      .style("font-family", "var(--font-sans)").style("font-size", "0.85rem").style("font-weight", "600")
      .style("border", "1px solid var(--border)").style("border-radius", "999px")
      .style("padding", "0.4rem 0.9rem").style("cursor", "pointer")
      .on("click", () => { mode = value; selected = null; render(); });
  }
  const btnBoth = tabButton("Physical board", "both");
  const btnBlue = tabButton("Blue's graph", "blue");
  const btnRed = tabButton("Red's dual graph", "red");

  const svg = root.append("svg")
    .attr("viewBox", "0 0 290 280")
    .style("width", "100%").style("max-width", "290px");

  const barLayer = svg.append("g");
  const edgeLayer = svg.append("g");
  const hitLayer = svg.append("g");
  const nodeLayer = svg.append("g");

  const caption = root.append("p")
    .style("font-family", "var(--font-sans)").style("font-size", "0.85rem").style("color", "var(--text)")
    .style("text-align", "center").style("max-width", "420px").style("min-height", "2.6em")
    .style("margin", "0.75rem 0 0");

  function updateButtonStyles() {
    [btnBoth, btnBlue, btnRed].forEach((b) => {
      const active = b.attr("data-mode") === mode;
      b.style("background", active ? blueColor : "var(--bg)")
        .style("color", active ? "#fff" : "var(--text-muted)")
        .style("border-color", active ? blueColor : "var(--border)");
    });
  }

  function edgeCoords(e) {
    const a = posOf[e.a], b = posOf[e.b];
    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  }

  function render() {
    updateButtonStyles();

    const showBlue = mode === "both" || mode === "blue";
    const showRed = mode === "both" || mode === "red";

    const bars = [
      { id: "top", show: showBlue, x: originX - 5, y: 24, w: (N - 1) * spacing + 10, h: 14, color: blueColor, label: "TOP (Blue)" },
      { id: "bottom", show: showBlue, x: originX - 5, y: 245, w: (N - 1) * spacing + 10, h: 14, color: blueColor, label: "BOTTOM (Blue)" },
      { id: "left", show: showRed, x: 15, y: originY - 5, w: 14, h: (N - 1) * spacing + 10, color: redColor, label: "LEFT" },
      { id: "right", show: showRed, x: 258, y: originY - 5, w: 14, h: (N - 1) * spacing + 10, color: redColor, label: "RIGHT" },
    ];
    const barSel = barLayer.selectAll("rect").data(bars, (d) => d.id);
    barSel.enter().append("rect").merge(barSel)
      .attr("x", (d) => d.x).attr("y", (d) => d.y).attr("width", (d) => d.w).attr("height", (d) => d.h)
      .attr("rx", 4).attr("fill", (d) => d.color).attr("opacity", (d) => (d.show ? 0.85 : 0));
    const labelSel = barLayer.selectAll("text").data(bars, (d) => d.id);
    labelSel.enter().append("text").merge(labelSel)
      .attr("x", (d) => d.x + d.w / 2).attr("y", (d) => d.y + d.h / 2 + 3)
      .attr("transform", (d) => (d.id === "left" || d.id === "right" ? `rotate(-90, ${d.x + d.w / 2}, ${d.y + d.h / 2})` : null))
      .attr("text-anchor", "middle")
      .style("font-family", "var(--font-sans)").style("font-size", "0.6rem").style("font-weight", "700")
      .style("fill", "#fff").style("opacity", (d) => (d.show ? 1 : 0))
      .text((d) => d.label);

    const edges = [];
    if (showBlue) blueEdges.forEach((e) => edges.push({ ...e, color: blueColor }));
    if (showRed) redEdges.forEach((e) => edges.push({ ...e, color: redColor }));

    function partnerOf(id) {
      if (!selected) return null;
      return selected.startsWith("BD") ? crossingOfBlue(byId[selected]) : crossingOfRed(byId[selected]);
    }
    function edgeOpacity(d) {
      if (mode !== "both" || !selected) return mode === "both" ? 0.55 : 0.9;
      const partner = partnerOf();
      return d.id === selected || d.id === partner ? 1 : 0.15;
    }
    function edgeWidth(d) {
      if (mode !== "both" || !selected) return 3;
      const partner = partnerOf();
      return d.id === selected || d.id === partner ? 4.5 : 3;
    }

    const lines = edgeLayer.selectAll("line").data(edges, (d) => d.id);
    lines.exit().remove();
    lines.enter().append("line").attr("stroke-linecap", "round")
      .merge(lines)
      .attr("x1", (d) => edgeCoords(d).x1).attr("y1", (d) => edgeCoords(d).y1)
      .attr("x2", (d) => edgeCoords(d).x2).attr("y2", (d) => edgeCoords(d).y2)
      .attr("stroke", (d) => d.color)
      .attr("stroke-opacity", edgeOpacity)
      .attr("stroke-width", edgeWidth);

    const hits = hitLayer.selectAll("line").data(mode === "both" ? edges : [], (d) => d.id);
    hits.exit().remove();
    hits.enter().append("line")
      .merge(hits)
      .attr("x1", (d) => edgeCoords(d).x1).attr("y1", (d) => edgeCoords(d).y1)
      .attr("x2", (d) => edgeCoords(d).x2).attr("y2", (d) => edgeCoords(d).y2)
      .attr("stroke", "transparent").attr("stroke-width", 12)
      .style("cursor", "pointer")
      .on("click", (event, d) => { selected = selected === d.id ? null : d.id; render(); });

    const shownDots = dots.filter((d) => (d.blue && showBlue) || (!d.blue && showRed));
    const nodeSel = nodeLayer.selectAll("circle").data(shownDots, (d) => d.id);
    nodeSel.exit().remove();
    nodeSel.enter().append("circle")
      .merge(nodeSel)
      .attr("cx", (d) => d.x).attr("cy", (d) => d.y).attr("r", 5)
      .attr("fill", (d) => (d.blue ? blueColor : redColor)).attr("stroke", "var(--bg)").attr("stroke-width", 1.5);

    if (mode === "blue") {
      caption.text(`Blue's graph: ${blueEdges.length} possible edges, connecting TOP to BOTTOM.`);
    } else if (mode === "red") {
      caption.text(`Red's dual graph: ${redEdges.length} possible edges — exactly as many as Blue's, connecting LEFT to RIGHT.`);
    } else if (!selected) {
      caption.text("Dots are colored by checkerboard parity. Every cell has one Blue diagonal and one Red diagonal — click an edge to see its partner.");
    } else {
      const isBlue = selected.startsWith("BD");
      caption.text(`Claiming this ${isBlue ? "Blue" : "Red"} diagonal removes the highlighted ${isBlue ? "Red" : "Blue"} diagonal in the same cell as an option for the other player.`);
    }
  }

  render();
})();
