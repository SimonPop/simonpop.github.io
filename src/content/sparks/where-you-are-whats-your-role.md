---
title: Location and role
date: 2026-08-11
theme: ml
tags: ["graph-neural-network"]
article: graph-positional-encoding
js: ["molecule_pe.js", "laplacian_similarity.js", "random_walk_similarity.js"]
---

A Transformer needs guidance to recognize a graph as more than just a set of points.

We need to tell the model where a node is, and what its role or situation with regards to its vicinity. The first is fulfilled by positional encoding, inspired by the one in sequences.

<figure>
<div id="laplacian_similarity"></div>
<figcaption>Laplacian encoding node similarity on a molecule from the <a href="https://paperswithcode.com/dataset/zinc">ZINC dataset</a>. Hover nodes to reveal the raw similarity from one node to all the others using the first 10 eigenvectors.</figcaption>
</figure>

The second, by structural encodings, exclusive to graphs. Indeed, a hub is a hub whether it sits on the left or the right; a graph needs a way to say that, on top of just saying where things are.

<figure>
<div id="random_walk"></div>
<figcaption>Random walk encoding node similarity from the <a href="https://paperswithcode.com/dataset/zinc">ZINC dataset</a>. Hover nodes to reveal the raw similarity from one node to all the others using the first 10 path lengths.</figcaption>
</figure>

Different techniques can help a Transformer figure this out. Linear algebra, with the Laplacian eigenvectors, can give it that notion of positioning. A random walk through the graph on the other hand, can help it discover the structure.

