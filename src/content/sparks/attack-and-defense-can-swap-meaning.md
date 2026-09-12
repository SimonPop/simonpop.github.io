---
title: Robustness, defensive or offensive?
date: 2026-08-13
theme: graph
tags: ["graph-robustness", "theory"]
article: graph-robustness
js: ["percolation_d3.js"]
---

Depending on the nature of a network, robustness can be a defensive strategy, or an attacking one.

Take an electrical grid, an attack tries to disconnect it, defense means holding it together. On the other hand, with a disease spreading through a social graph, roles flip.

The two paradigms actually share the same math: on a network, an epidemic sustains itself only once β/δ exceeds 1/λ₁, where β is the infection rate, δ is the recovery rate, and λ₁ is the largest eigenvalue of the adjacency matrix.

<figure>
<div id="percolation-viz"></div>
<figcaption>Drag the slider to vary the edge-removal probability <em>p</em> — the "decoupling" side of the duality: the same fragmenting lattice is also what an epidemic needs to stay contained.</figcaption>
</figure>

The exact same quantity that makes a network hard to tear apart is what makes it easy to infect.