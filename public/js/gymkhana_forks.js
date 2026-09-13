(function () {
  const root = d3.select("#gymkhana-forks-viz");
  if (root.empty()) return;
  root.style("flex-direction", "row").style("flex-wrap", "wrap").style("justify-content", "center").style("align-items", "flex-start").style("gap", "1.5rem");

  const articleEl = document.querySelector(".article");
  const blueColor = (articleEl && getComputedStyle(articleEl).getPropertyValue("--theme-color").trim()) || "#0d7377";
  const goldColor = "#c2760f";
  const mutedColor = "var(--text-muted)";

  function panel(title, height) {
    const wrap = root.append("div").style("display", "flex").style("flex-direction", "column").style("align-items", "center").style("max-width", "220px");
    wrap.append("p")
      .style("font-family", "var(--font-display)").style("font-size", "0.85rem").style("font-weight", "700")
      .style("color", "var(--text)").style("margin", "0 0 0.4rem").text(title);
    const svg = wrap.append("svg").attr("viewBox", `0 0 200 ${height}`).style("width", "100%").style("max-width", "200px");
    const caption = wrap.append("p")
      .style("font-family", "var(--font-sans)").style("font-size", "0.78rem").style("color", "var(--text-muted)")
      .style("text-align", "center").style("margin", "0.5rem 0 0");
    return { svg, caption };
  }

  function line(svg, x1, y1, x2, y2, color, opts = {}) {
    svg.append("line").attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2)
      .attr("stroke", color).attr("stroke-width", opts.width || 3.5)
      .attr("stroke-linecap", "round")
      .attr("stroke-dasharray", opts.dashed ? "5,4" : null)
      .attr("stroke-opacity", opts.opacity != null ? opts.opacity : 1);
  }
  function node(svg, x, y, color, r = 5) {
    svg.append("circle").attr("cx", x).attr("cy", y).attr("r", r).attr("fill", color).attr("stroke", "var(--bg)").attr("stroke-width", 1.5);
  }
  function tag(svg, x, y, text, color, anchor = "middle") {
    svg.append("text").attr("x", x).attr("y", y).attr("text-anchor", anchor)
      .style("font-family", "var(--font-sans)").style("font-size", "0.62rem").style("font-weight", 700)
      .style("fill", color).text(text);
  }

  // --- Panel 1: a fork ---
  {
    const { svg, caption } = panel("A fork", 140);
    const chain = { x: 20, y: 70 };
    const Q = { x: 65, y: 70 };
    const R1 = { x: 130, y: 30 };
    const R2 = { x: 130, y: 110 };
    const G1 = { x: 180, y: 30 };
    const G2 = { x: 180, y: 110 };

    line(svg, chain.x, chain.y, Q.x, Q.y, blueColor);
    line(svg, Q.x, Q.y, R1.x, R1.y, goldColor, { dashed: true });
    line(svg, Q.x, Q.y, R2.x, R2.y, goldColor, { dashed: true });
    line(svg, R1.x, R1.y, G1.x, G1.y, blueColor, { opacity: 0.5 });
    line(svg, R2.x, R2.y, G2.x, G2.y, blueColor, { opacity: 0.5 });

    node(svg, chain.x, chain.y, mutedColor, 3);
    node(svg, Q.x, Q.y, blueColor);
    node(svg, R1.x, R1.y, blueColor);
    node(svg, R2.x, R2.y, blueColor);
    node(svg, G1.x, G1.y, blueColor, 3);
    node(svg, G2.x, G2.y, blueColor, 3);
    tag(svg, 2, chain.y + 18, "chain from L", mutedColor, "start");
    tag(svg, Q.x + 32, 20, "either wins", goldColor);

    caption.text("Blue's chain reaches Q. Both dashed edges already lead on to a finished connection — Red can only cut one.");
  }

  // --- Panel 2: a double fork ---
  {
    const { svg, caption } = panel("A double fork", 140);
    const trunk = { x: 20, y: 70 };
    const Q1 = { x: 60, y: 35 };
    const Q2 = { x: 60, y: 105 };
    const a1 = { x: 115, y: 15 }, a2 = { x: 115, y: 55 };
    const b1 = { x: 115, y: 85 }, b2 = { x: 115, y: 125 };

    line(svg, trunk.x, trunk.y, Q1.x, Q1.y, blueColor);
    line(svg, trunk.x, trunk.y, Q2.x, Q2.y, blueColor);
    line(svg, Q1.x, Q1.y, a1.x, a1.y, goldColor, { dashed: true });
    line(svg, Q1.x, Q1.y, a2.x, a2.y, goldColor, { dashed: true });
    line(svg, Q2.x, Q2.y, b1.x, b1.y, goldColor, { dashed: true });
    line(svg, Q2.x, Q2.y, b2.x, b2.y, goldColor, { dashed: true });

    node(svg, trunk.x, trunk.y, mutedColor, 3);
    node(svg, Q1.x, Q1.y, blueColor);
    node(svg, Q2.x, Q2.y, blueColor);
    [a1, a2, b1, b2].forEach((p) => node(svg, p.x, p.y, blueColor, 3));
    tag(svg, 2, trunk.y + 18, "chain from L", mutedColor, "start");
    tag(svg, 150, 8, "fork 1", goldColor);
    tag(svg, 150, 133, "fork 2", goldColor);

    caption.text("Two independent forks are already live. Whichever one Red tries to block, the other still completes the connection.");
  }
})();
