---
title: Connectivity is a random walker's memory span
date: 2026-08-17
theme: graph
tags: ["graph-robustness", "theory"]
article: graph-spectrum-insights-expansion
js: ["connectivity_mixing.js"]
---

Imagine a random walker dropped somewhere on a graph, taking one random step at a time. How long before its position becomes unpredictable?

That time is the mixing time.

A low one means the walk reaches a stable, spread-out distribution quickly: every node is reachable soon regardless of the starting point. This shows a well-connected graph.

A high mixing time means the walk stays trapped near its start for a long time, or stuck in a loop.

<figure>
<div id="connectivity-mixing-viz"></div>
<figcaption>The exact same walker, tracked step by step — one graph forgets its start in a few hops, the other stays stuck for a long time.</figcaption>
</figure>
