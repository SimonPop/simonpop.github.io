---
title: "Graph Structure Learning"
date: 2023-04-10
theme: ml
tags: ["graph-structure-learning", "theory", "overview"]
author: "Simon Popelier"
summary: "Introduction to Graph Structure Learning, a method for learning the graph jointly with the target using Graph Neural Networks"
js: ["adjacency_matrix.js", "similarity_viz.js"]
---

## Introduction

Graph Neural Networks assume a graph is given. In practice, that graph is often noisy, partially known, or missing entirely. Graph Structure Learning (GSL) addresses this by learning or refining the graph jointly with the prediction task.

Take subway traffic forecasting as a running example. The station network is a natural graph, but if the map is unavailable, GSL can recover a working structure directly from passenger data.

More generally, GSL extends graph-based methods to any data where a graph is suspected but not directly observed. The resulting graph can then be used with spectral techniques or, more recently, Graph Neural Networks, which have been applied successfully to social networks (Fan et al., 2019), recommendation systems (Wu et al., 2022), and spatial analysis (Derrow-Pinion et al., 2021).

This article gives a concise overview of GSL: why it is used, how it is combined with a network, and what constraints are typically imposed on the learned graph.

## Motivation

### Performance

The primary motivation is performance. Framing a problem as a graph problem introduces a useful inductive bias. Learning or refining the graph further adapts the model's structure to the task, improving results.

### Explainability

A second motivation is understanding the system itself. Graphs are easy to visualize and map naturally onto the problem domain. In our subway example, GSL could recover the station network directly from data: the idea behind Graph WaveNet (Wu et al., 2019).

This benefit has limits. As a network grows, the graph it learns may diverge from one a human would draw. MTGNN (Wu et al., 2020), for instance, improves prediction accuracy but produces a graph that is not human-readable. At that point we are analyzing how the network represents the problem, not the problem itself: explainability rather than interpretability.

### Robustness

A third use is defense against adversarial graphs. Like any input, a graph can be manipulated to bias a model's output, for example to favor a particular product in a recommendation engine. GSL can correct such graphs by removing the offending edges, a process Jin et al. (2020) call graph purification.

## Implementations

### Paradigms

A GSL module can be combined with the rest of the network in three ways.

<img src="/imgs/graph-structure-learning/paradigms_blocs.svg" alt="A Graph Structure Learning module producing edges to be learned, next to a Message Passing module exchanging information along fixed edges." width="100%">

1. **Joint** — a single GSL block, followed by the rest of the network.
2. **Adaptive** — a fixed sequence of alternating GSL and prediction blocks, as in MTGNN (Wu et al., 2020).
3. **Iterative** — the same idea, but repeated until a stopping condition is met rather than a fixed number of times (Chen et al., 2020).

<figure style="max-width: 680px; margin-left: auto; margin-right: auto;">
<img src="/imgs/graph-structure-learning/paradigms.svg" alt="Three paradigms for combining a Graph Structure Learning block (GSL) with a prediction module: Joint, Adaptive and Iterative." width="100%">
<figcaption>The three paradigms differ in how the GSL and prediction blocks are composed.</figcaption>
</figure>

### Constraints on the graph

Learned graphs are usually constrained to preserve properties expected of real graphs. This is enforced either through regularization (altering the loss) or architectural constraints (altering the network itself). We cover the most common attributes below; others exist.

#### Constraints by regularization

Regularization terms steer the learned graph by adding a penalty to the loss:

$$
L = L_{pred} + \lambda L_{reg}
$$

Kalofolias (2016) identifies several such constraints.

- **Smoothness** — under a homophily assumption, connected nodes should have similar representations:

$$
L_{reg}(A, X) = \frac{1}{2}\sum A_{ij}(x_i-x_j)^2
$$

Under heterophily, the opposite holds: connected nodes should have distant embeddings.

<figure style="max-width: 460px; margin-left: auto; margin-right: auto;">
<img src="/imgs/graph-structure-learning/smoothness.svg" alt="A graph whose node colors vary smoothly along its edges, illustrating homophily." width="100%">
<figcaption>Smoothness: in a homophily setting, connected nodes are assigned close values along the signal.</figcaption>
</figure>

- **Sparsity** — real graphs are sparse: each node connects to only a few others. This can be enforced by penalizing the $l_0$ norm of the adjacency matrix $A$:

$$
L_{reg}(A) = ||A||_0
$$

<figure style="max-width: 560px; margin-left: auto; margin-right: auto;">
<img src="/imgs/graph-structure-learning/sparsity.svg" alt="A dense graph with some edges removed to obtain a sparse graph." width="100%">
<figcaption>Sparsity: penalizing the $l_0$ norm removes low-value edges (dashed), leaving a sparser graph.</figcaption>
</figure>

- **Connectivity** — a connected graph is usually preferred. Minimizing the rank of $A$ encourages a few tightly coherent clusters rather than many disconnected fragments:

$$
L_{reg}(A) = \text{rank}(A)
$$

- **Degree positivity** — the constraints above admit the trivial solution $A = 0$. Penalizing zero-degree nodes rules it out:

$$
L_{reg}(A) = -\mathbf{1}^T\log(A\mathbf{1})
$$

#### Architectural constraints

- **Directivity** — whether the graph is directed, i.e. $A_{ij} \neq A_{ji}$, follows from whether the underlying distance $d(X_i, X_j)$ is symmetric. MTGNN (Wu et al., 2020) learns two embeddings per node to represent each direction of an edge separately.

<figure style="max-width: 560px; margin-left: auto; margin-right: auto;">
<img src="/imgs/graph-structure-learning/directed.svg" alt="Comparison of an undirected graph and a directed graph on the same four nodes." width="100%">
<figcaption>Directivity: in a directed graph, the adjacency matrix is no longer symmetric.</figcaption>
</figure>

- **Positivity** — edge weights can be constrained to be non-negative, either by zeroing negative values ($A' = \text{ReLU}(A)$) or by exponentiating them ($A' = \exp(A)$).

- **Sparsity** — sparsity can also be enforced architecturally: thresholding low values with ReLU gives an $\epsilon$-graph, while keeping only the top-$k$ values per node gives a $k$NN graph.

- **Discretization** — edges can be made binary via sampling or reinforcement learning. In practice, weighted graphs are usually preferable: they are more flexible and easier to learn, being differentiable.

### Architecture

Two approaches are commonly used to compute the adjacency matrix.

- **Direct optimization** — the adjacency matrix $A$ is treated as a free parameter and optimized directly, as in GLNN (Gao et al., 2019).

<figure style="padding-left: 0px; margin-left: 0px;">
<div id="adjacency_matrix_viz"></div>
<figcaption>The adjacency matrix and its corresponding directed, weighted graph. Hover a cell, an edge, or a node to see the correspondence.</figcaption>
</figure>

- **Metric-based** — edge weights are estimated from node embeddings via a distance metric, such as cosine similarity (Nguyen & Bai, 2011):

$$
A = \cos(w\odot v_i, w\odot v_j)
$$

where $w$ is a trainable parameter, as in IDGL (Chen et al., 2020). Because weights are derived from embeddings rather than stored directly, new nodes can be added without retraining the whole graph.

<figure style="max-width: 640px; margin-left: auto; margin-right: auto;">
<div id="similarity_viz"></div>
<figcaption>Similarity: comparing two node feature vectors yields the weight of the edge between them. Click a node to pin it, then hover another to compare.</figcaption>
</figure>

More expressive metrics can replace cosine similarity, such as attention mechanisms (Veličković et al., 2018). A further extension, **structure-aware learning**, also incorporates the attributes of the edge itself when computing its weight.

## Conclusion

Graph Structure Learning makes graph-based methods usable even when the underlying graph is noisy or missing, by learning or correcting it directly.

This article covered why GSL is used, how it is combined with a network, and the constraints typically placed on the learned graph. The field is active, and what is covered here is far from exhaustive.

This overview draws on Zhu et al. (2022) and Chen & Wu (2023). A future article will experiment with a GSL method in practice.

## References

Chen, Y., Wu, L., & Zaki, M. J. (2020). *Iterative Deep Graph Learning for Graph Neural Networks : Better and Robust Node Embeddings* (arXiv:2006.13009). arXiv. [https://doi.org/10.48550/arXiv.2006.13009](https://doi.org/10.48550/arXiv.2006.13009)

Derrow-Pinion, A., She, J., Wong, D., Lange, O., Hester, T., Perez, L., Nunkesser, M., Lee, S., Guo, X., Wiltshire, B., Battaglia, P. W., Gupta, V., Li, A., Xu, Z., Sanchez-Gonzalez, A., Li, Y., & Veličković, P. (2021). ETA Prediction with Graph Neural Networks in Google Maps. *Proceedings of the 30th ACM International Conference on Information & Knowledge Management*, 3767‑3776. [https://doi.org/10.1145/3459637.3481916](https://doi.org/10.1145/3459637.3481916)

Fan, W., Ma, Y., Li, Q., He, Y., Zhao, E., Tang, J., & Yin, D. (2019). Graph Neural Networks for Social Recommendation. *The World Wide Web Conference*, 417‑426. [https://doi.org/10.1145/3308558.3313488](https://doi.org/10.1145/3308558.3313488)

Gao, X., Hu, W., & Guo, Z. (2019). *Exploring Structure-Adaptive Graph Learning for Robust Semi-Supervised Classification* (arXiv:1904.10146). arXiv. [https://doi.org/10.48550/arXiv.1904.10146](https://doi.org/10.48550/arXiv.1904.10146)

*GNNBook@2023 : Graph Neural Networks : Graph Structure Learning*. (n.d.). Accessed April 10, 2023, from [https://graph-neural-networks.github.io/gnnbook_Chapter14.html](https://graph-neural-networks.github.io/gnnbook_Chapter14.html)

Jin, W., Li, Y., Xu, H., Wang, Y., Ji, S., Aggarwal, C., & Tang, J. (2020). *Adversarial Attacks and Defenses on Graphs : A Review, A Tool and Empirical Studies* (arXiv:2003.00653). arXiv. [https://doi.org/10.48550/arXiv.2003.00653](https://doi.org/10.48550/arXiv.2003.00653)

Kalofolias, V. (2016). *How to learn a graph from smooth signals* (arXiv:1601.02513). arXiv. [https://doi.org/10.48550/arXiv.1601.02513](https://doi.org/10.48550/arXiv.1601.02513)

Nguyen, H. V., & Bai, L. (2011). Cosine Similarity Metric Learning for Face Verification. In R. Kimmel, R. Klette, & A. Sugimoto (Eds.), *Computer Vision – ACCV 2010* (p. 709‑720). Springer. [https://doi.org/10.1007/978-3-642-19309-5_55](https://doi.org/10.1007/978-3-642-19309-5_55)

Veličković, P., Cucurull, G., Casanova, A., Romero, A., Liò, P., & Bengio, Y. (2018). *Graph Attention Networks* (arXiv:1710.10903). arXiv. [https://doi.org/10.48550/arXiv.1710.10903](https://doi.org/10.48550/arXiv.1710.10903)

Wu, S., Sun, F., Zhang, W., Xie, X., & Cui, B. (2022). *Graph Neural Networks in Recommender Systems : A Survey* (arXiv:2011.02260). arXiv. [https://doi.org/10.48550/arXiv.2011.02260](https://doi.org/10.48550/arXiv.2011.02260)

Wu, Z., Pan, S., Long, G., Jiang, J., Chang, X., & Zhang, C. (2020). *Connecting the Dots : Multivariate Time Series Forecasting with Graph Neural Networks* (arXiv:2005.11650). arXiv. [https://doi.org/10.48550/arXiv.2005.11650](https://doi.org/10.48550/arXiv.2005.11650)

Zhu, Y., Xu, W., Zhang, J., Du, Y., Zhang, J., Liu, Q., Yang, C., & Wu, S. (2022). *A Survey on Graph Structure Learning : Progress and Opportunities* (arXiv:2103.03036). arXiv. [https://doi.org/10.48550/arXiv.2103.03036](https://doi.org/10.48550/arXiv.2103.03036)

Wu, Z., Pan, S., Long, G., Jiang, J., & Zhang, C. (2019). *Graph WaveNet for Deep Spatial-Temporal Graph Modeling* (arXiv:1906.00121). arXiv. [https://doi.org/10.48550/arXiv.1906.00121](https://doi.org/10.48550/arXiv.1906.00121)
