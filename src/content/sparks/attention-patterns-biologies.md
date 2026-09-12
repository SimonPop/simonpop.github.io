---
title: Attention patterns and biologies
date: 2026-08-09
theme: genomics
article: genomic-fundational-models
js: ["nucleotide_attention.js"]
---

If you can teach a model genomics, it can teach genomics back to you. You can follow its eyes to understand how it thinks!

That information lies within the attention map. In nucleotide-based models, it holds a truth about which area of the genome is linked to which other.

<figure>
<div id="my_dataviz"></div>
<figcaption>Nucleotide Transformer clipped attention weights on a hundred nucleotides from GRCh38 chromosome 11.</figcaption>
</figure>

Depending on the task the model has been trained on performing, the information gathered through this process can represent different kinds of relationships.
