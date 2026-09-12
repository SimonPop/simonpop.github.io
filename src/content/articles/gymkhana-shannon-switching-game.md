---
title: "Bridging the Gymkhana"
date: 2026-08-18
theme: graph
tags: ["game-theory", "graph-theory", "combinatorial-games"]
author: "Simon Popelier"
summary: "Gymkhana, a modern rebrand of Bridg-it a connection game whose winning strategy comes from pairing two spanning trees. How to solve it?"
js: ["gymkhana_board_dual.js", "gymkhana_pairing.js", "gymkhana_forks.js", "gymkhana_pairing_exercise.js"]
draft: false
---

## A Game Solved in 1964

I used to play Gymkhana as a kid, the mysteriously chosen French title of the Connections board game. White and red esthetic, rules simple enough for a child to grasp, yet hard enough to challenge adults. Unless, of course, you happen to be Alfred Lehman, the author of "A Solution of the Shannon Switching Game".

The rule goes like this. Two players share a grid of dots. One player, White, is trying to build an unbroken chain of lines from the top of the board to the bottom. The other, Red, is trying to build one from the left side to the right. Players alternate turns, each drawing a single line between two adjacent dots along their own orientation. Whoever completes their chain first wins.

That is not a new game. It is actually *Bridg-it*, invented by the mathematician David Gale in 1958 and sold commercially as a puzzle-toy shortly after. Gymkhana changes the packaging, the color scheme, and the name, but the principle remains. And that is good news for us today: over sixty years of graph theory already tell us exactly how to win.

*For the sake of visibility, and to the detriment of originality, we will use a blue and red color scheme from now on.* 

## The Board Is a Graph

Look closely at the grid:

<figure>
<div id="gymkhana-board-dual-viz"></div>
<figcaption>Toggle between the physical board and each player's own graph — then click an edge to see the opponent's edge it crosses.</figcaption>
</figure>

Dots alternate in a checkerboard pattern. Every unit square cell of the grid has two Blue corners and two Red corners on opposite diagonals. Therefore, only one Red or Blue line can cross it. Chain enough Blue diagonals together and you get a zigzag path from the top of the board to the bottom; chain Red diagonals and you get one from left to right. Because the construction is symmetric by design, Blue and Red always have exactly the same number of possible lines. 

We have a Blue [planar](https://en.wikipedia.org/wiki/Planar_graph) graph and its Red [dual](https://en.wikipedia.org/wiki/Dual_graph).

Every move Red makes toward a left–right chain simultaneously *removes* one specific option from Blue's graph: the one edge it crosses.

## Round 1: Someone Has to Win

We first want to make sure that a winning strategy exists.

Bridg-it cannot end in a draw. One of the two players must have a winning strategy. The question is which one. Say Blue moves first.

Why can't both players win? If a line crosses the board, it prevents another line from crossing it. Indeed it creates a physical wall, separating the other side in two.

Why can't both players lose? If any side is completely obstructed, planar duality guarantees it means a path for the other side. There is no board state where both players are simultaneously stuck: exactly one connection exists once the board fills up (Gale, 1979). In a Harry Potter fashion, if one loses, the other succeeds.

Then why is Blue the only one that should win? Well if Red has a winning strategy, Blue could just play an arbitrary first move, and then adopt that winning strategy (as the second player). The first arbitrary move being at worst a useless move, Blue would win with that "second player" strategy. Meaning Blue would win anyways. That is the strategy stealing argument.

## Round 2: The Winning Move, Explicitly

Shannon's switching game gives the general framework: two players alternately claim edges of a graph, one trying to connect two terminals, the other trying to cut every path between them. 

Lehman's theorem (Lehman, 1964) says the connecting player wins whenever the graph contains two edge-disjoint spanning trees. Whenever the opponent removes an edge from one tree, there is always a specific edge in the other tree that repairs it.

Below, Blue's board has been reduced to a graph with two terminals, **L** and **R**, and its edges are pre-split into two edge-disjoint spanning trees, T₁ and T₂. Play as Red: click any edge (or use the button) to "cut" it, and watch Blue's automatic reply light up.

<figure>
<div id="gymkhana-pairing-viz"></div>
<figcaption>Whatever Red cuts, Blue always has a reconnecting reply. That's the pairing strategy in action.</figcaption>
</figure>

After a few moves, there might not be a perfect twin-edge in the other tree that you can play. However, Lehman's theorem still guarantees a legal, connectivity-preserving reply exists. The widget above will always find one.

## Playing It Out

Theory sounds nice, but in practice, a player is not going to identify a spanning tree on the board. Instead, a couple of patterns are worth training your eye on.

**Forks.** A single move that threatens two different connecting paths at once. The opponent can only block one line per turn. Think of it like a fork in chess!

**Double forks.** A move that sets up a *second*, independent fork one move later, regardless of how the opponent responds to the first threat.

<figure>
<div id="gymkhana-forks-viz"></div>
<figcaption>A fork threatens two finishing edges at once; a double fork lines up two independent forks so blocking one doesn't matter.</figcaption>
</figure>

Time to try it yourself. Below is the same board from Round 2, mid-game: a few edges have already been claimed and cut, and Red has just cut one more. Find a valid reply for Blue!

<figure>
<div id="gymkhana-exercise-viz"></div>
<figcaption>Click the edge Blue should claim in reply to Red's cut. Stuck? "Reveal a valid reply" shows one option, and "New scenario" deals a fresh position.</figcaption>
</figure>

## Further Reading

Bridg-it, Gymkhana and Shannon's switching game are cases of what is called Maker-Breaker games. These games have a natural connection to matroid theory. Related ideas also appear, from a different angle, in percolation theory.

## References

Gale, D. (1979). The Game of Hex and the Brouwer Fixed-Point Theorem. *The American Mathematical Monthly*, 86(10), 818–827. [https://doi.org/10.2307/2320146](https://doi.org/10.2307/2320146)

Lehman, A. (1964). A Solution of the Shannon Switching Game. *Journal of the Society for Industrial and Applied Mathematics*, 12(4), 687–725. [https://doi.org/10.1137/0112059](https://doi.org/10.1137/0112059)

Berlekamp, E. R., Conway, J. H., & Guy, R. K. (1982). *Winning Ways for Your Mathematical Plays* (Vol. 2). Academic Press.
