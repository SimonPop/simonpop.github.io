---
title: A genome is just a very long sentence
date: 2026-08-08
theme: genomics
article: genomic-fundational-models
js: ["kmers_d3.js"]
---

Genome is coded by sequences of nucleotides. Turns out sequences of tokens are exactly what modern ML excels at. Adapting models thought for text to genomics has been a tremendous accelerator to the field.

For instance, DNA is usually cut into *k*-mers: fixed-length windows of *k* nucleotides. One popular choice of token size is 3-mers, and it happens to match codons: the exact triplets that map to amino acids.

<figure>
<div id="kmers-viz"></div>
<figcaption>6-merization of a 12-nucleotide sequence: jump the window by <em>k</em> for non-overlapping tokens, or slide it by 1 to get overlapping tokens.</figcaption>
</figure>

The analogy between a genome and a sentence isn't just a metaphor, it already lines up with a real unit of biological meaning.
