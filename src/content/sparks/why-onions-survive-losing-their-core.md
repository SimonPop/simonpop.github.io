---
title: Why onions survive losing their core
date: 2026-08-25
theme: graph
tags: ["graph-robustness", "theory"]
article: the-onion-topology
js: ["tree_onion_removal.js"]
---

Remove the highest-degree node from a tree, and everything falls apart. Every branch disconnects, since the node linking it to the rest is gone.

Take it out from an onion-structured network, and it barely makes a change in connectivity! Nodes in onion networks like to connect to other similar degree nodes. It results in radial layers with the highest-degree nodes at the core. Any node can reach the core via many different paths. No hierarchical exclusivity, no single point of failure.

<figure>
<div id="tree-onion-viz"></div>
<figcaption>Removing the highest-degree node from each: the tree shatters into disconnected branches, the onion's ring keeps it whole.</figcaption>
</figure>