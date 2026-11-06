---
title: "Optimizers: SGD, momentum, RMSProp and Adam"
date: "2026-10-24T19:15"
category: "AI"
tags: ["optimizers", "adam", "sgd", "momentum", "training"]
summary: "On a bowl 50 times steeper one way than the other, plain SGD must keep its step under 0.04 or diverge, and then crawls: 137 steps at best. Momentum gets there in 83, Adam in 80. Every popular optimizer is a fix for the same problem — one learning rate for directions that need different ones."
draft: false
cover: "/blog/optimizers-in-deep-learning.svg"
---

Training computes a gradient — which way each weight should move to reduce the loss — and an **optimizer** decides how far to actually move. The simplest rule is to step against the gradient by a fixed fraction, the learning rate. Every other optimizer in common use is a fix for one particular way that simple rule goes wrong.

## The problem: valleys

Loss surfaces are rarely round bowls. More often they are long, narrow valleys: very steep across, very gentle along. That shape breaks plain gradient descent.

Take the simplest valley there is:

`f(x, y) = ½ (x² + 50 y²)`

It is 50 times steeper in *y* than in *x*. Start at (10, 1), and count the steps each optimizer needs to bring the loss below 0.001, trying a range of learning rates for each:

| optimizer | best learning rate tried | steps | what limited it |
| --- | --- | --- | --- |
| SGD | 0.039 | 137 | diverges at 0.041 |
| SGD, "safe" setting | 0.02 | 268 | |
| SGD + momentum | 0.02 | **83** | |
| RMSProp | 0.01 | 1,036 | oscillates at larger rates |
| Adam | 0.5 | **80** | |

## Why plain SGD is stuck

In the steep direction, each step multiplies *y* by `1 − 50 × lr`. If the learning rate exceeds 2/50 = **0.04**, that factor's magnitude exceeds 1 and *y* bounces back and forth with growing amplitude: divergence. In the run above, 0.039 converges and 0.041 does not.

So the steep direction caps the learning rate. But in the gentle direction, each step multiplies *x* by `1 − lr`, which at 0.039 shrinks it by only 3.9% per step. The steep direction sets the speed limit; the gentle direction is where all the distance is. In real networks with millions of directions of wildly different steepness, this is the central difficulty.

## Momentum: remember the direction

Momentum keeps a running sum of recent gradients and steps along that instead of the latest gradient alone:

`v ← 0.9 v + gradient`
`weights ← weights − lr × v`

In the steep direction the gradient flips sign every step, so the running sum cancels out and the bouncing is damped. In the gentle direction it points the same way every step, so the sum builds up to about ten times the single gradient and the model accelerates down the valley. **83 steps** instead of 137 — and stable over a much wider range of learning rates.

## RMSProp: a learning rate per direction

RMSProp tracks, for each weight separately, a running average of the squared gradient, and divides each step by its square root. Directions with large gradients get small steps; directions with small gradients get large ones. In the valley that equalises the two directions, which is exactly the right idea.

On its own, though, it has no memory of direction, and its normalised steps stay roughly the size of the learning rate even near the minimum. In this test, larger learning rates left it hovering around the bottom without settling below the threshold; only 0.01 got there, in 1,036 steps. In practice it is used with a decaying learning rate.

## Adam: both

Adam combines the two: momentum's running average of the gradient (the first moment) and RMSProp's running average of its square (the second moment), with a correction for their bias in the first few steps:

`m ← 0.9 m + 0.1 g`
`s ← 0.999 s + 0.001 g²`
`weights ← weights − lr × m̂ / (√ŝ + ε)`

Per-direction scaling handles the different steepness; momentum handles the zig-zag and carries it to the bottom. **80 steps**, and it worked across a wide range of learning rates — 0.3, 0.5 and 1.0 all finished within 86 steps. That robustness to the learning rate is a large part of why Adam is the default.

<figure>
<svg viewBox="0 0 560 270" width="560" role="img" aria-label="Contour ellipses of a narrow valley with three paths from the same start: SGD zig-zagging across the valley, momentum curving smoothly, Adam heading almost directly to the centre." xmlns="http://www.w3.org/2000/svg">
<style>.hd{font:600 11px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary);letter-spacing:.07em}.b{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--primary)}.l{font:500 10px var(--font-geist-mono),ui-monospace,monospace;fill:var(--muted-foreground)}</style>
<text class="hd" x="20" y="18">ONE VALLEY, THREE ROUTES</text>
<g fill="none" stroke="var(--muted-foreground)" stroke-opacity="0.3">
<ellipse cx="280" cy="120" rx="240" ry="34"/><ellipse cx="280" cy="120" rx="170" ry="24"/><ellipse cx="280" cy="120" rx="100" ry="14"/><ellipse cx="280" cy="120" rx="40" ry="6"/>
</g>
<circle cx="280" cy="120" r="3" fill="var(--primary)"/>
<path d="M60 96 L72 144 L84 98 L96 142 L108 100 L120 140 L134 102 L148 138 L164 104 L180 136 L198 106 L218 134 L240 108 L262 130 L280 120" stroke="var(--muted-foreground)" stroke-width="1.6" fill="none"/>
<path d="M60 96 C110 150 190 132 280 120" stroke="var(--primary)" stroke-opacity="0.55" stroke-width="2" fill="none"/>
<path d="M60 96 C140 110 210 118 280 120" stroke="var(--primary)" stroke-width="2.4" fill="none"/>
<circle cx="60" cy="96" r="4" fill="var(--muted-foreground)"/>
<text class="l" x="30" y="86">start</text>
<text class="l" x="20" y="186">SGD — zig-zags across, crawls along · 137 steps at best</text>
<text class="b" x="20" y="206">momentum — damps the zig-zag, builds speed · 83</text>
<text class="b" x="20" y="226">Adam — per-direction step size plus momentum · 80</text>
<path d="M20 240 H540" stroke="var(--muted-foreground)" stroke-opacity="0.25"/>
<text class="l" x="20" y="260">f = ½(x² + 50y²) from (10, 1) to loss &lt; 0.001; paths schematic</text>
</svg>
<figcaption>The steep direction caps a single learning rate; the gentle direction is where the distance is.</figcaption>
</figure>

## Variants worth knowing

**AdamW** separates weight decay from the gradient update, which matters because Adam's per-direction scaling distorts ordinary L2 regularisation. It is the standard optimizer for training transformers.

**Learning rate schedules** — a warm-up from near zero over the first steps, then a gradual decay — are used with almost every optimizer. Warm-up keeps Adam's early moment estimates from producing huge steps; decay lets training settle into a minimum.

**SGD with momentum** remains competitive for some vision models and is sometimes reported to generalise slightly better when well tuned.

**Memory-efficient optimizers** exist because Adam stores two extra numbers per parameter — for a 70B-parameter model, that is 140 billion additional values held during training.

## What to take away

Plain gradient descent uses one learning rate for every direction, so the steepest direction caps it (diverging above 0.04 in a 50:1 valley) and the gentlest direction makes it crawl. Momentum averages gradients over time to damp oscillation and build speed; RMSProp scales each direction by its own gradient size; Adam does both.

In the test valley SGD needed 137 steps at best, momentum 83, Adam 80 — and Adam got there across a wide range of learning rates, which is why AdamW with warm-up and decay is the default for training large models.
