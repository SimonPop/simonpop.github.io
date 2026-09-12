---
title: Explainable without being interpretable
date: 2026-08-18
theme: ml
tags: ["graph-structure-learning", "theory", "overview"]
article: graph-structure-learning
js: ["adjacency_matrix.js"]
---

By letting your model learn the graph on which it operates, you may discover new insights about it. The way it re-arranges it can tell you more than the original alone.

A subway network recovered purely from passenger flow tells you something real about the city.

<figure>
<div id="adjacency_matrix_viz"></div>
<figcaption>The adjacency matrix and its corresponding directed, weighted graph. Hover a cell, an edge, or a node to see the correspondence.</figcaption>
</figure>

However, striking a balance between model growth and graph interpretability can be difficult. Some models can learn graphs that measurably improve their predictions while no longer being human-readable.

At that point you're not looking at the problem anymore, you're looking at how the network chose to represent the problem.
