---
title: Domino failures
date: 2026-08-14
theme: graph
tags: ["graph-robustness", "theory"]
article: graph-robustness
js: ["cascade_redistribution.js"]
---

A cascading failure rarely comes from an attacker hitting every node in turn. Instead, a few high-load nodes going down can cause a domino effect.

Each node has a given capacity. If a network looks to maximize its regime, then nodes are maintained at a high percentage of that capacity.

Removing a single node redistributes its traffic onto whatever remains. In that event, any node exceeding its capacity fails in turn. A single, contained failure becomes a cascade purely through this feedback loop, which is exactly why the highest-load nodes are the most dangerous ones to lose first.

<figure>
<div id="cascade-viz"></div>
<figcaption>Same failure, different scenarios.</figcaption>
</figure>

Toggle the network's operating regime, then fail the hub and watch where its load goes. With generous slack, the survivors shrug it off. Maximized to the same tight margin everywhere, one failure is enough to take the whole thing down.
