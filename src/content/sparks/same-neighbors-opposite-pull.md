---
title: Opposites attract or birds of a feather?
date: 2026-08-20
theme: ml
tags: ["graph-structure-learning", "theory", "overview"]
article: graph-structure-learning
js: ["homophily_heterophily.js"]
---

Birds of a feather? Opposite attract?

In graph language, the first philosophy is called homophily while the second heterophily.

<figure>
<div id="homophily-heterophily-viz"></div>
<figcaption>Same 18 nodes, same two classes. Only the wiring rule changes!</figcaption>
</figure>

When you're building a graph, or teaching a model to do so, you can use one of these principles to your advantage. In practice this amounts to penalizing nodes with similar or dissimilar embeddings to connect.