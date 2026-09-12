---
title: Every step you take, your opponent doesn't
date: 2026-08-21
theme: graph
tags: ["game-theory", "graph-theory", "combinatorial-games"]
article: gymkhana-shannon-switching-game
js: ["gymkhana_board_dual.js"]
---

"Bridg-it is about a Blue planar graph and its Red dual graph" is not only the kind of thing you can say to your opponent to disorientate them, but the real justification why any move by one player simultaneously hinders the plan of the other.

Once you've recovered from the confusion, the entire game reduces into a single question: can Blue always route around whatever edge Red just removed? Once the board is seen as two dual graphs instead of a grid of dots, the game stops being about drawing lines and starts being about graph connectivity.

<figure>
<div id="gymkhana-board-dual-viz"></div>
<figcaption>Toggle between the physical board and each player's own graph — then click an edge to see the opponent's edge it crosses.</figcaption>
</figure>
