(function () {
  const root = d3.select("#kmers-viz");
  if (root.empty()) return;
  root.style("display", "flex").style("flex-direction", "column").style("align-items", "center").style("gap", "0.75rem");

  const articleEl = document.querySelector(".article");
  const themeColor = (articleEl && getComputedStyle(articleEl).getPropertyValue("--theme-color").trim()) || "#14805c";

  const sequence = "ATCGGTACCAGT".split("");
  const baseColor = { A: "#e6197d", T: "#17bcd8", C: "#8bc540", G: "#e0a800" };
  const k = 6;

  const cell = 44, cellGap = 6, cellStep = cell + cellGap;
  const chipW = 90, chipGap = 10, chipStep = chipW + chipGap;

  const seqY = 10;
  const windowY = seqY - 8;
  const windowH = cell + 16;
  const lineTopY = windowY + windowH;
  const chipY = lineTopY + 40;
  const statusY = chipY + 66;

  const seqWidth = sequence.length * cellStep - cellGap;
  const maxChips = Math.floor((sequence.length - k) / 1) + 1; // overlapping = most chips
  const chipsWidth = maxChips * chipStep - chipGap;
  const width = Math.max(seqWidth, chipsWidth);
  const height = statusY + 20;

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

  const nonOverlapBtn = styleToggle(controls.append("button").text("Non-overlapping (stride = 6)"));
  const overlapBtn = styleToggle(controls.append("button").text("Overlapping (stride = 1)"));
  const replayBtn = styleToggle(controls.append("button").text("Replay"))
    .style("color", "var(--text-muted)")
    .style("background", "var(--bg)")
    .style("border", "1px solid var(--border)");

  function paintToggles(active) {
    [ [nonOverlapBtn, "non-overlap"], [overlapBtn, "overlap"] ].forEach(([btn, mode]) => {
      const isActive = mode === active;
      btn
        .style("border", isActive ? "1px solid " + themeColor : "1px solid var(--border)")
        .style("background", isActive ? themeColor : "var(--bg)")
        .style("color", isActive ? "#fff" : "var(--text-muted)");
    });
  }

  // ---- svg ----
  const svg = root.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("width", "100%")
    .style("max-width", "620px");

  const seqLayer = svg.append("g");
  seqLayer.selectAll("rect.base")
    .data(sequence)
    .join("rect")
    .attr("class", "base")
    .attr("x", (d, i) => i * cellStep)
    .attr("y", seqY)
    .attr("width", cell)
    .attr("height", cell)
    .attr("rx", 6)
    .attr("fill", (d) => baseColor[d]);

  seqLayer.selectAll("text.base-label")
    .data(sequence)
    .join("text")
    .attr("class", "base-label")
    .attr("x", (d, i) => i * cellStep + cell / 2)
    .attr("y", seqY + cell / 2 + 6)
    .attr("text-anchor", "middle")
    .style("font-size", "17px")
    .style("font-weight", 700)
    .style("fill", "#fff")
    .text((d) => d);

  const windowRect = svg.append("rect")
    .attr("y", windowY)
    .attr("height", windowH)
    .attr("rx", 8)
    .attr("fill", "none")
    .attr("stroke", themeColor)
    .attr("stroke-width", 3)
    .style("opacity", 0);

  const lineLayer = svg.append("g");
  const chipLayer = svg.append("g");

  const status = svg.append("text")
    .attr("x", width / 2)
    .attr("y", statusY)
    .attr("text-anchor", "middle")
    .style("font-size", "13px")
    .style("font-style", "italic")
    .style("fill", "var(--text-muted)");

  function kmerize(strideVal) {
    const out = [];
    for (let i = 0; i + k <= sequence.length; i += strideVal) {
      out.push({ start: i, text: sequence.slice(i, i + k).join("") });
    }
    return out;
  }

  let generation = 0;
  let currentMode = "non-overlap";

  function play(mode) {
    currentMode = mode;
    generation += 1;
    const myGen = generation;
    const strideVal = mode === "overlap" ? 1 : k;
    const toks = kmerize(strideVal);

    paintToggles(mode);
    lineLayer.selectAll("*").remove();
    chipLayer.selectAll("*").remove();
    windowRect.style("opacity", 1);
    status.text(
      mode === "overlap"
        ? `Sliding window, stride 1 — ${toks.length} overlapping 6-mers`
        : `Jumping window, stride 6 — ${toks.length} non-overlapping 6-mers`
    );

    toks.forEach((t, i) => {
      setTimeout(() => {
        if (myGen !== generation) return;

        const wx = t.start * cellStep;
        const wWidth = k * cellStep - cellGap;
        windowRect
          .transition()
          .duration(400)
          .attr("x", wx)
          .attr("width", wWidth);

        const chipCx = i * chipStep + chipW / 2;
        lineLayer.append("line")
          .attr("x1", wx + wWidth / 2)
          .attr("y1", lineTopY)
          .attr("x2", chipCx)
          .attr("y2", chipY)
          .attr("stroke", themeColor)
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "3,3")
          .style("opacity", 0)
          .transition()
          .delay(200)
          .duration(300)
          .style("opacity", 0.7);

        const chip = chipLayer.append("g")
          .attr("transform", `translate(${i * chipStep}, ${chipY})`)
          .style("opacity", 0);

        chip.append("rect")
          .attr("width", chipW)
          .attr("height", 40)
          .attr("rx", 8)
          .attr("fill", "var(--bg)")
          .attr("stroke", themeColor)
          .attr("stroke-width", 2);

        chip.append("text")
          .attr("x", chipW / 2)
          .attr("y", 25)
          .attr("text-anchor", "middle")
          .style("font-family", "var(--font-mono)")
          .style("font-size", "14px")
          .style("font-weight", 700)
          .style("fill", "var(--text)")
          .text(t.text);

        chip.transition().delay(200).duration(300).style("opacity", 1);
      }, i * 650);
    });
  }

  nonOverlapBtn.on("click", () => play("non-overlap"));
  overlapBtn.on("click", () => play("overlap"));
  replayBtn.on("click", () => play(currentMode));

  play("non-overlap");
})();
