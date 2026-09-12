---
title: Degree and betweenness don't always agree
date: 2026-08-15
theme: graph
tags: ["graph-robustness", "theory"]
article: graph-robustness
js: ["degree_betweenness.js"]
---

What is the most important node of a network? It all depends on the perspective!

For example, degree counts how many neighbors a node has directly. Betweenness counts how many shortest paths run through it.

They usually roughly agree: a well-connected node also tends to sit on a lot of routes. In certain configurations, however, they can point at completely different nodes.

<figure>
<div id="degree-betweenness-viz"></div>
<figcaption>Same graph, same positions — only which node lights up changes with the metric.</figcaption>
</figure>

Neither ranking is "more correct". They're answering different questions. Who has the most direct connections? Who sits on the most paths between others? Which one matters depends on what you're trying to reason about.